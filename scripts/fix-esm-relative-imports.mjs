import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const targetDir = resolve(process.argv[2] ?? "");

if (!targetDir) {
  throw new Error("Usage: node scripts/fix-esm-relative-imports.mjs <dist-dir>");
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !fullPath.endsWith(".js")) {
      continue;
    }

    const original = readFileSync(fullPath, "utf8");
    const rewritten = original.replace(
      /(from\s+["'](\.{1,2}\/[^"']+?)["']|import\s*\(\s*["'](\.{1,2}\/[^"']+?)["']\s*\)|export\s+\*\s+from\s+["'](\.{1,2}\/[^"']+?)["']|export\s+\{[^}]*\}\s+from\s+["'](\.{1,2}\/[^"']+?)["'])/g,
      (match, _full, fromImport, fromDynamicImport, fromExportAll, fromExportNamed) => {
        const specifier = fromImport ?? fromDynamicImport ?? fromExportAll ?? fromExportNamed;
        if (!specifier || specifier.endsWith(".js") || specifier.endsWith(".mjs") || specifier.endsWith(".cjs")) {
          return match;
        }

        const target = resolve(dirname(fullPath), specifier);
        const fileCandidate = `${target}.js`;
        const directoryCandidate = join(target, "index.js");
        if (statExists(fileCandidate)) {
          return match.replace(specifier, `${specifier}.js`);
        }

        if (statExists(directoryCandidate)) {
          return match.replace(specifier, `${specifier}/index.js`);
        }

        return match;
      }
    );

    if (rewritten !== original) {
      writeFileSync(fullPath, rewritten);
    }
  }
}

function statExists(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

walk(targetDir);
