import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed Middleware → Proxy. Same NextRequest/NextResponse API.
// Convention: `proxy.ts` at project root, exported function named `proxy`.

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

// Subdomains that should NOT be treated as tenant subdomains.
// They fall through to whatever app routes exist at that path.
const RESERVED_SUBDOMAINS = new Set(["www", "api", "app", "admin", "dashboard"]);

function extractSubdomain(host: string | null): string | null {
  if (!host) return null;

  // Strip port — host comes in as "empresa_x.localhost:3000".
  const hostname = host.split(":")[0];
  const rootHostname = ROOT_DOMAIN.split(":")[0];

  // Apex itself ("localhost", "tenantforge.app") → no subdomain.
  if (hostname === rootHostname) return null;

  // Must end with ".<apex>" to be a recognized subdomain.
  const suffix = `.${rootHostname}`;
  if (!hostname.endsWith(suffix)) return null;

  const sub = hostname.slice(0, -suffix.length);
  if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;

  // Defense in depth: must match the same regex the API uses for tenant names.
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(sub)) return null;

  return sub;
}

export function proxy(request: NextRequest) {
  const subdomain = extractSubdomain(request.headers.get("host"));
  if (!subdomain) return NextResponse.next();

  // On a tenant subdomain, *every* path renders the landing for that tenant.
  // The dashboard is intentionally unreachable from a tenant subdomain.
  // (Extend this later if tenants get multi-page landings.)
  const url = request.nextUrl.clone();
  url.pathname = `/preview/${subdomain}`;

  return NextResponse.rewrite(url);
}

export const config = {
  // Skip framework internals and API routes — those should never go through the rewrite.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
