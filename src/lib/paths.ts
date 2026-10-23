/** Prefix site paths so the same markup works on `/` (local) and `/webpage/` (GitHub Pages). */
export function withBase(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (/^(https?:|mailto:|#)/i.test(path)) return path;
  if (!path || path === "/") return `${base}/` || "/";
  return `${base}/${path.replace(/^\//, "")}`;
}

export function pagePath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length) || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}
