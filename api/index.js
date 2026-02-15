export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',    // handles null origin too
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(request) {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response(
      JSON.stringify({
        error: 'Missing url parameter',
        usage: '/api/proxy?url=https://example.com/api/data',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Forward the same method and body
    const fetchOptions = {
      method: request.method,
      headers: {},
    };

    // Forward relevant headers to target
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      fetchOptions.headers['Content-Type'] = contentType;
    }

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      fetchOptions.body = await request.text();
    }

    const response = await fetch(decodeURIComponent(targetUrl), fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}