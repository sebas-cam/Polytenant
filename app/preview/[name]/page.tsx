import { redirect } from "next/navigation";

import { getLandingDesign } from "@/lib/design";

export const dynamic = "force-dynamic";

// This is what the tenant's subdomain landing page will look like once you wire
// up wildcard subdomain routing. For now it lives at /preview/<tenant-name>.
export default async function TenantLandingPreview({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  // Goes straight to the tenant DB — skips the admin lookup. See lib/design.ts.
  // If the tenant DB doesn't exist, Postgres throws → we redirect to the apex.
  let design;
  try {
    design = await getLandingDesign(name);
  } catch {
    const root = process.env.ROOT_DOMAIN ?? "localhost:3000";
    redirect(`http://${root}`);
  }

  const { primaryColor, secondaryColor, headline, description } = design;

  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center px-6"
      style={{ background: secondaryColor, color: primaryColor }}
    >
      <div className="w-full max-w-2xl space-y-6 text-center">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
          style={{ background: primaryColor, color: secondaryColor }}
        >
          {name}
        </span>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{headline}</h1>
        {description ? (
          <p className="text-lg leading-relaxed opacity-80">{description}</p>
        ) : null}       
      </div>
    </main>
  );
}