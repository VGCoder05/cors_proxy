export const config = {
  runtime: 'edge',
};

function getCorsHeaders(request) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const requestOrigin = request.headers.get('Origin');

  let origin;

  if (allowedOrigin === '*') {
    // Allow all websites
    origin = '*';
  } else {
    // Support multiple origins via comma separation
    // e.g. ALLOWED_ORIGIN=https://site1.com,https://site2.com
    const allowedOrigins = allowedOrigin.split(',').map(o => o.trim());

    if (allowedOrigins.includes(requestOrigin)) {
      origin = requestOrigin;  // reflect the matching origin
    } else {
      origin = null;  // block it
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
    // Needed when origin is not '*' and you use cookies/auth
    // 'Access-Control-Allow-Credentials': 'true',
  };
}

export default async function handler(request) {
  const corsHeaders = getCorsHeaders(request);

  // Block disallowed origins
  if (!corsHeaders['Access-Control-Allow-Origin']) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(decodeURIComponent(targetUrl));
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/xml',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}