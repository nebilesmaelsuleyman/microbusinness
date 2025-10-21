export async function GET() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <path d="M18 42V22h10.4c3 0 5.4.7 7 2.2 1.6 1.5 2.4 3.5 2.4 6 0 2.6-.8 4.6-2.4 6.1-1.6 1.5-4 2.2-7 2.2H24v3.5H18zm6-9.2h3.7c3 0 4.5-1.2 4.5-3.6s-1.5-3.6-4.5-3.6H24v7.2z" fill="#fff"/>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
