import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "/webpage";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");

function prefix(source) {
  return source
    .replace(
      /(href|src|action|poster)="\/(logos|photos|fonts)\//g,
      `$1="${BASE}/$2/`,
    )
    .replace(
      /url\((['"]?)\/(logos|photos|fonts)\//g,
      (_m, q, dir) => `url(${q}${BASE}/${dir}/`,
    );
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(html|css|js|svg)$/.test(entry.name)) continue;
    const before = fs.readFileSync(full, "utf8");
    const after = prefix(before);
    if (after !== before) fs.writeFileSync(full, after);
  }
}

if (process.env.CI) {
  walk(root);
  fs.writeFileSync(path.join(root, ".nojekyll"), "");
}
