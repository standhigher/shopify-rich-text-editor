import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const packages = ["packages/rich-text-core", "packages/rich-text-editor", "packages/rich-text-server"];
const allowedExact = new Set(["README.md", "LICENSE", "package.json"]);
const npmCache = resolve(tmpdir(), "best-rich-text-npm-cache");
mkdirSync(npmCache, { recursive: true });

for (const relativePackage of packages) {
  const packageDir = resolve(root, relativePackage);
  const manifest = JSON.parse(readFileSync(resolve(packageDir, "package.json"), "utf8"));
  const output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: packageDir,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: npmCache },
    stdio: ["ignore", "pipe", "inherit"]
  });
  const files = JSON.parse(output)[0].files.map(({ path }) => path);

  for (const file of files) {
    if (allowedExact.has(file)) continue;
    if (!file.startsWith("dist/")) {
      throw new Error(`${manifest.name} contains a non-release file: ${file}`);
    }
    if (/(test|fixture|storybook|demo|\.env|token|secret)/i.test(file)) {
      throw new Error(`${manifest.name} contains a forbidden release artifact: ${file}`);
    }
  }

  console.log(`${manifest.name}: ${files.length} release files verified`);
}
