interface RouteLocation {
  pathname: string;
  search: string;
  hash: string;
}

/** A store update can render the next step before BrowserRouter commits its location. */
export function isCommittedDemoLocation(
  rendered: RouteLocation,
  browser: RouteLocation,
  basename = import.meta.env.BASE_URL,
): boolean {
  const base = basename.replace(/\/$/, "");
  const pathname = `${base}${rendered.pathname}`;
  const matchesPath = browser.pathname === pathname
    || rendered.pathname === "/" && base !== "" && browser.pathname === base;
  return matchesPath && rendered.search === browser.search && rendered.hash === browser.hash;
}
