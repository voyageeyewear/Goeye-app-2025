import pkg from "@remix-run/node";
const { Response } = pkg;

export async function loader({ params }) {
  const { width = 80, height = 80 } = params;
  
  // Create a simple SVG placeholder
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f5f5f5"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="12">No Image</text>
  </svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
    },
  });
} 