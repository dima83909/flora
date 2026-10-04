import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

import ts from "typescript"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "@/components/ui/button"

/*
 * Guards the 44px touch-target rule from CLAUDE.md. A browser measurement is the real check;
 * these tests catch the regressions that slipped through before: a compact control added
 * without a touch size, or a Button size losing its touch minimum.
 */

const SIZES = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const

describe("Button touch sizes", () => {
  it.each(SIZES)("size %s is at least 44px tall on touch screens", (size) => {
    expect(buttonVariants({ size })).toContain("any-pointer-coarse:min-h-11")
  })

  it.each(["icon", "icon-xs", "icon-sm"] as const)("icon size %s is at least 44px wide on touch screens", (size) => {
    expect(buttonVariants({ size })).toContain("any-pointer-coarse:min-w-11")
  })
})

// Visible heights under 44px: size-5…size-10, h-5…h-10
const COMPACT = /(?:^|\s)(?:size|h)-(?:[5-9]|10)(?:\s|$)/
// Ways a compact control still gets a 44px target on touch: a touch-only size,
// a pseudo-element that widens the hit area, or a full-card overlay link
const TOUCH_SAFE = /any-pointer-coarse:|after:-inset|after:inset-0/
const INTERACTIVE = new Set(["button", "a", "Link"])

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return tsxFiles(path)
    return entry.name.endsWith(".tsx") ? [path] : []
  })
}

/**
 * Every string literal inside a className expression, e.g. both branches of cn(a, b ? c : d).
 * Identifiers are followed to their declaration in the same file (className={buttonClass}).
 */
function classStrings(node: ts.Node, declarations: Map<string, ts.Node>, seen = new Set<string>()): string[] {
  if (ts.isStringLiteralLike(node)) return [node.text]
  if (ts.isIdentifier(node)) {
    const declaration = declarations.get(node.text)
    if (!declaration || seen.has(node.text)) return []
    return classStrings(declaration, declarations, new Set(seen).add(node.text))
  }
  return node.getChildren().flatMap((child) => classStrings(child, declarations, seen))
}

function compactControls(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declarations = new Map<string, ts.Node>()
  const collect = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      declarations.set(node.name.text, node.initializer)
    }
    ts.forEachChild(node, collect)
  }
  collect(source)

  const found: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source)
      const className = node.attributes.properties.find(
        (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText(source) === "className"
      )
      if (INTERACTIVE.has(tag) && className?.initializer) {
        const classes = classStrings(className.initializer, declarations).join(" ")
        if (COMPACT.test(classes) && !TOUCH_SAFE.test(classes)) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source))
          found.push(`${relative(process.cwd(), file)}:${line + 1} <${tag}>`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

describe("compact interactive elements", () => {
  it("have a touch-sized hit area", () => {
    const root = join(process.cwd(), "src")
    const offenders = tsxFiles(root).flatMap(compactControls)
    expect(offenders).toEqual([])
  })
})
