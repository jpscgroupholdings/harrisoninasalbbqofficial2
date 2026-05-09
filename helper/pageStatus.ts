export const pageStatus = {
  "/orders/[id]/review": false,
};

export function isRouteBlocked(pathname: string): boolean {
  for (const [route, enabled] of Object.entries(pageStatus)) {
    // Convert Next.js dynamic route to regex
    const pattern = route.replace(/\[.*?\]/g, "[^/]+");

    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(pathname)) {
      return !enabled;
    }
  }

  return false;
}