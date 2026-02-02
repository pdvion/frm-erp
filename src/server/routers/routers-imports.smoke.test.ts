import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

describe("Routers import smoke", () => {
  it("imports all router modules", { timeout: 30000 }, async () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const files = fs.readdirSync(dir);

    const targets = files.filter((file) => {
      if (!file.endsWith(".ts")) return false;
      if (file.endsWith(".test.ts")) return false;
      if (file.endsWith(".spec.ts")) return false;
      return true;
    });

    await Promise.all(
      targets.map(async (file) => {
        const fileUrl = pathToFileURL(path.join(dir, file)).href;
        await import(fileUrl);
      })
    );

    expect(targets.length).toBeGreaterThan(0);
  });
});
