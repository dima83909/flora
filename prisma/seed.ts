/**
 * Seeds the catalogue from the fixtures in prisma/seed-data.
 *
 * Idempotent: categories and products are upserted by slug, so it can be re-run
 * after editing the fixtures. Nothing is deleted, because orders may reference
 * existing products.
 */
import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../src/generated/prisma/client"
import { careByCategory } from "./seed-data/care"
import { categories, products } from "./seed-data/catalog"
import { toMinor } from "../src/lib/money"
import { toStockFields } from "../src/server/catalog/availability"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and point it at PostgreSQL.")
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  // The homepage shows the four most popular items labelled "popular"
  const featuredSlugs = new Set(
    products
      .filter((p) => p.label === "popular")
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 4)
      .map((p) => p.slug)
  )

  await prisma.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>()

    for (const [index, category] of categories.entries()) {
      const data = {
        name: category.name,
        description: category.description,
        illustration: category.visual,
        sortOrder: (index + 1) * 10,
        isActive: true,
        isFeatured: category.featured ?? false,
        showInNav: category.inNavigation ?? false,
      }
      const row = await tx.category.upsert({
        where: { slug: category.slug },
        create: { slug: category.slug, ...data },
        update: data,
        select: { id: true },
      })
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
        ...toStockFields(product.availability, product.leadDays),
        isFeatured: featuredSlugs.has(product.slug),
        isPopular: product.label === "popular",
        isNew: product.label === "new",
        popularity: product.popularity,
        isActive: true,
        illustration: product.visual,
        createdAt: new Date(`${product.addedAt}T00:00:00Z`),
      }
      const row = await tx.product.upsert({
        where: { slug: product.slug },
        create: { slug: product.slug, ...data },
        update: data,
        select: { id: true },
      })

      // Real photography, when present in the fixtures, replaces the stored gallery
      if (product.images?.length) {
        await tx.productImage.deleteMany({ where: { productId: row.id } })
        await tx.productImage.createMany({
          data: product.images.map((url, sortOrder) => ({ productId: row.id, url, alt: product.name, sortOrder })),
        })
      }
    }
  })

  const [categoryCount, productCount] = await Promise.all([prisma.category.count(), prisma.product.count()])
  console.log(`Seeded ${categoryCount} categories and ${productCount} products.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
