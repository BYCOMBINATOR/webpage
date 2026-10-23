import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "logos");

const SAL = "#F3F0E8";
const SOMBRA = "#10141C";

function r(n) {
  return Math.round(n * 100) / 100;
}

function P(pts) {
  return `M${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join("L")}Z`;
}

function rect(x, y, w, h) {
  return P([
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);
}

function loadFont(file) {
  const buf = fs.readFileSync(file);
  return opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  );
}

function commandsToD(commands) {
  const bits = [];
  for (const c of commands) {
    if (c.type === "M") bits.push(`M${r(c.x)} ${r(c.y)}`);
    else if (c.type === "L") bits.push(`L${r(c.x)} ${r(c.y)}`);
    else if (c.type === "C")
      bits.push(
        `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`,
      );
    else if (c.type === "Q")
      bits.push(`Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`);
    else if (c.type === "Z") bits.push("Z");
  }
  return bits.join("");
}

const stamp = loadFont(path.join(root, "fonts/LibreFranklin-ExtraBold.ttf"));

function letterPath(ch) {
  const optical = ch === "C" ? 0.7 : ch === "Y" ? 0.66 : 0.64;
  const p = stamp.getPath(ch, 0, 0, 100);
  const b = p.getBoundingBox();
  const w = b.x2 - b.x1;
  const h = b.y2 - b.y1;
  const s = (100 * optical) / Math.max(w, h);
  const cx = (b.x1 + b.x2) / 2;
  const cy = (b.y1 + b.y2) / 2;
  const d = commandsToD(p.commands);
  return `<g transform="translate(50 50) scale(${r(s)}) translate(${r(-cx)} ${r(-cy)})"><path d="${d}"/></g>`;
}

function cubeGeom(ox, oy, S, dx, dy) {
  return {
    front: [
      [ox, oy + dy],
      [ox + S, oy + dy],
      [ox + S, oy + dy + S],
      [ox, oy + dy + S],
    ],
    top: [
      [ox, oy + dy],
      [ox + dx, oy],
      [ox + S + dx, oy],
      [ox + S, oy + dy],
    ],
    side: [
      [ox + S, oy + dy],
      [ox + S + dx, oy],
      [ox + S + dx, oy + S],
      [ox + S, oy + dy + S],
    ],
  };
}

function cubes({ letters, face, ink, edge, iso }) {
  const S = 80;
  const dx = iso ? 16 : 0;
  const dy = iso ? 10 : 0;
  const gap = 10;
  const inset = 12;
  const bits = [];

  letters.forEach((ch, i) => {
    const ox = i * (S + dx + gap);
    const oy = 0;
    const g = cubeGeom(ox, oy, S, dx, dy);
    if (iso) {
      bits.push(`<path d="${P(g.top)}" fill="${edge}"/>`);
      bits.push(`<path d="${P(g.side)}" fill="${edge}"/>`);
    }
    bits.push(`<path d="${P(g.front)}" fill="${face}"/>`);
    bits.push(
      `<path d="${rect(ox + 6, oy + dy + 6, S - 12, S - 12)}" fill="none" stroke="${ink}" stroke-width="2.2"/>`,
    );
    const ls = (S - inset * 2) / 100;
    bits.push(
      `<g transform="translate(${r(ox + inset)} ${r(oy + dy + inset)}) scale(${r(ls)})" fill="${ink}">${letterPath(ch)}</g>`,
    );
  });

  const w = letters.length * S + (letters.length - 1) * gap + letters.length * dx;
  const h = dy + S;
  return { content: bits.join("\n    "), box: [-8, -8, w + 16, h + 16] };
}

function writeSvg(name, title, box, bg, content) {
  const [x, y, w, h] = box;
  const bgRect = bg
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>`
    : "";
  fs.writeFileSync(
    path.join(outDir, name),
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" fill="none" role="img" aria-labelledby="title">
  <title id="title">${title}</title>
  ${bgRect}
  ${content}
</svg>
`,
  );
}

function pack(prefix, letters, iso) {
  const pos = cubes({ letters, face: SAL, ink: SOMBRA, edge: SOMBRA, iso });
  const neg = cubes({ letters, face: SOMBRA, ink: SAL, edge: SAL, iso });
  writeSvg(`${prefix}.svg`, prefix, pos.box, null, pos.content);
  writeSvg(`${prefix}-neg.svg`, `${prefix} neg`, neg.box, null, neg.content);
  writeSvg(`${prefix}-sal.svg`, `${prefix} sal`, pos.box, SAL, pos.content);
  writeSvg(`${prefix}-sombra.svg`, `${prefix} sombra`, neg.box, SOMBRA, neg.content);
}

pack("byc", ["B", "Y", "C"], true);
pack("byc-sello", ["B", "Y", "C"], false);
pack("byc-b", ["B"], true);
pack("byc-y", ["Y"], true);
pack("byc-c", ["C"], true);
pack("byc-b-sello", ["B"], false);
pack("byc-y-sello", ["Y"], false);
pack("byc-c-sello", ["C"], false);

console.log("cube marks + Libre Franklin ExtraBold");
