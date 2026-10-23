import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const prerender = false;

const FILE = path.resolve("data/waitlist.json");
const ROLES = new Set(["founder", "guia", "otro"]);

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

function ok(message: string, request: Request) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: true, message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: "/gracias" },
  });
}

function fail(message: string, status: number, request: Request) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: false, message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: "/?error=1" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  if (String(data.get("company") ?? "").trim()) {
    return ok("Ya estás en la lista.", request);
  }

  const email = String(data.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(data.get("name") ?? "").trim().slice(0, 80);
  const rolRaw = String(data.get("rol") ?? "otro").trim();
  const rol = ROLES.has(rolRaw) ? rolRaw : "otro";

  if (!emailOk(email)) {
    return fail("Mail inválido.", 400, request);
  }

  await fs.mkdir(path.dirname(FILE), { recursive: true });
  let list: Array<{ email: string; name: string; rol: string; at: string }> = [];
  try {
    list = JSON.parse(await fs.readFile(FILE, "utf8"));
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  if (!list.some((row) => row.email === email)) {
    list.push({ email, name, rol, at: new Date().toISOString() });
    await fs.writeFile(FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
  }

  return ok("Ya estás en la lista. Te avisamos cuando abra la mesa.", request);
};
