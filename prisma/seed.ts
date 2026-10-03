/**
 * Seeds the catalogue from the fixtures in prisma/seed-data.
 *
 * Safe to re-run: by default it only adds categories and products that are missing
 * (matched by slug) and leaves existing rows alone, so prices, availability and visibility
 * edited in the database survive. A product that has no photos yet still gets the
 * ones found on disk. Nothing is deleted, because orders may reference existing products.
 *
 * SEED_OVERWRITE=1 makes the fixtures win: existing rows and their galleries are reset
 * to what prisma/seed-data says. Use it after editing the fixtures, never by habit.
 */
import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../src/generated/prisma/client"
import { careByCategory } from "./seed-data/care"
import { categories, products } from "./seed-data/catalog"
import { photosOnDisk } from "./seed-data/photos"
import { toMinor } from "../src/lib/money"
import { toDbAvailability } from "../src/server/catalog/availability"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and point it at PostgreSQL.")
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const overwrite = process.env.SEED_OVERWRITE === "1"

async function main() {
  // The homepage shows the four most popular items labelled "popular"
  const featuredSlugs = new Set(
    products
      .filter((p) => p.isPopular)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 4)
      .map((p) => p.slug)
  )

  const counts = { created: 0, overwritten: 0, kept: 0 }

  await prisma.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>()

    for (const [index, category] of categories.entries()) {
      const data = {
        name: category.name,
        description: category.description,
        illustration: category.visual,
        imageUrl: category.image ?? null,
        sortOrder: (index + 1) * 10,
        isActive: true,
        isFeatured: category.featured ?? false,
        showInNav: category.inNavigation ?? false,
      }
      const existing = await tx.category.findUnique({ where: { slug: category.slug }, select: { id: true } })
      const row =
        existing && !overwrite
          ? existing
          : await tx.category.upsert({
              where: { slug: category.slug },
              create: { slug: category.slug, ...data },
              update: data,
              select: { id: true },
            })
      counts[existing ? (overwrite ? "overwritten" : "kept") : "created"]++
      categoryIds.set(category.slug, row.id)
    }

    for (const product of products) {
      const data = {
        name: product.name,
        categoryId: categoryIds.get(product.category)!,
        composition: product.composition,
        stems: product.stems,
        description: product.description,
        careInstructions: careByCategory[product.category] ?? [],
        size: product.size,
        priceMinor: toMinor(product.price),
        compareAtPriceMinor: product.oldPrice !== undefined ? toMinor(product.oldPrice) : null,
        availability: toDbAvailability(product.availability),
        leadTimeDays: product.availability === "preorder" ? (product.leadDays ?? 2) : null,
        isFeatured: featuredSlugs.has(product.slug),
        isPopular: product.isPopular ?? false,
        isNew: product.isNew ?? false,
        popularity: product.popularity,
        isActive: true,
        illustration: product.visual,
        createdAt: new Date(`${product.addedAt}T00:00:00Z`),
      }
      const existing = await tx.product.findUnique({
        where: { slug: product.slug },
        select: { id: true, _count: { select: { images: true } } },
      })
      const keep = existing !== null && !overwrite
      const row = keep
        ? existing
        : await tx.product.upsert({
            where: { slug: product.slug },
            create: { slug: product.slug, ...data },
            update: data,
            select: { id: true },
          })
      counts[existing ? (overwrite ? "overwritten" : "kept") : "created"]++

      // A kept product only gains photos while its gallery is empty; it never loses any
      if (keep && existing._count.images > 0) continue

      // The stored gallery mirrors the fixtures, or else the photographs found on disk
      const images = product.images?.length ? product.images : photosOnDisk(product.slug)
      if (!keep) await tx.productImage.deleteMany({ where: { productId: row.id } })
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((url, sortOrder) => ({ productId: row.id, url, alt: product.name, sortOrder })),
        })
      }
    }
  })

  const [categoryCount, productCount] = await Promise.all([prisma.category.count(), prisma.product.count()])
  console.log(
    `Seed: ${counts.created} created, ${counts.overwritten} overwritten, ${counts.kept} left unchanged. ` +
      `The database now has ${categoryCount} categories and ${productCount} products.`
  )
  if (counts.kept) console.log("Existing rows were not touched. Set SEED_OVERWRITE=1 to reset them to the fixtures.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
