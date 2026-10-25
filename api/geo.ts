// Rough location of the visitor for the overview globe. Vercel adds these
// headers from the request IP; nothing is looked up elsewhere or stored.
// Only city level: the coordinates are those of the city, not the visitor.
const header = (r: Request, name: string) => {
  const v = r.headers.get(name);
  return v ? decodeURIComponent(v) : undefined;
};

export function GET(request: Request) {
  const lat = Number(header(request, 'x-vercel-ip-latitude'));
  const lon = Number(header(request, 'x-vercel-ip-longitude'));
  return Response.json(
    {
      city: header(request, 'x-vercel-ip-city') ?? null,
      country: header(request, 'x-vercel-ip-country') ?? null, // ISO code, e.g. AT
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
