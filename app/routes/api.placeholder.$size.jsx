export async function loader({ params }) {
  const size = params.size || '80x80';
  const [width, height] = size.split('x').map(n => parseInt(n) || 80);
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="#999" text-anchor="middle" dy="0.3em">No Image</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
} 