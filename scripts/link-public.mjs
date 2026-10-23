import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
fs.mkdirSync(pub, { recursive: true });

const links = [
  ["fonts", "fonts"],
  ["logos", "logos"],
  ["photos", "photos"],
];

for (const [name, from] of links) {
  const dest = path.join(pub, name);
  const src = path.join(root, from);
  if (fs.existsSync(dest)) continue;
  const type = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(src, dest, type);
}
