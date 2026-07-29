const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#202223"/>
  <path d="M9 22V10h6.2c2.7 0 4.5 1.5 4.5 3.8 0 1.3-.6 2.4-1.7 3 1.4.5 2.3 1.7 2.3 3.2 0 2.5-1.9 4-4.8 4H9Zm3-7h2.8c1.1 0 1.8-.6 1.8-1.5s-.7-1.5-1.8-1.5H12v3Zm0 6h3.2c1.2 0 1.9-.6 1.9-1.6s-.7-1.6-1.9-1.6H12V21Z" fill="#ffffff"/>
  <path d="M22 10h2v12h-2z" fill="#95bf47"/>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml"
    }
  });
}

