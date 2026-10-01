import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Unit tests cover pure logic only (no database, no Next runtime); database behaviour is
// checked by `npm run db:check`.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
})
