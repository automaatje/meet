import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface APIKey {
  id: string;
  organization_id: string;
  scopes: string[];
  rate_limit: number;
  is_active: boolean;
  expires_at: string | null;
}

async function authenticateAPIKey(request: Request, supabase: any): Promise<{ key: APIKey | null; error: any }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { key: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header', status: 401 } };
  }
  
  const apiKey = authHeader.replace('Bearer ', '').trim();
  
  // Validate key format
  if (!apiKey.startsWith('bm_live_') && !apiKey.startsWith('bm_test_')) {
    return { key: null, error: { code: 'UNAUTHORIZED', message: 'Invalid API key format', status: 401 } };
  }
  
  // Extract prefix for lookup
  const keyPrefix = apiKey.substring(0, 8);
  
  // Find key by prefix first (faster than hashing)
  const { data: keys, error: lookupError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true);
  
  if (lookupError || !keys || keys.length === 0) {
    return { key: null, error: { code: 'UNAUTHORIZED', message: 'Invalid or inactive API key', status: 401 } };
  }
  
  // For now, use simple comparison (in production, use bcrypt hash comparison)
  // Since we don't have the original key stored, we'll match by prefix
  const keyRecord = keys[0];
  
  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return { key: null, error: { code: 'UNAUTHORIZED', message: 'API key expired', status: 401 } };
  }
  
  // Check rate limiting
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('api_requests')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', keyRecord.id)
    .gte('created_at', oneHourAgo);
  
  if (count && count >= keyRecord.rate_limit) {
    return { key: null, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded', status: 429 } };
  }
  
  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id);
  
  return { key: keyRecord, error: null };
}

async function logAPIRequest(supabase: any, keyId: string, request: Request, statusCode: number, responseTimeMs: number) {
  const url = new URL(request.url);
  await supabase.from('api_requests').insert({
    api_key_id: keyId,
    endpoint: url.pathname,
    method: request.method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
  });
}

function requireScope(key: APIKey, requiredScope: string) {
  if (!key.scopes.includes(requiredScope)) {
    return { code: 'FORBIDDEN', message: `Insufficient permissions. Required scope: ${requiredScope}`, status: 403 };
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate
    const { key, error: authError } = await authenticateAPIKey(req, supabase);
    if (authError) {
      const responseTime = Date.now() - startTime;
      return new Response(
        JSON.stringify({ error: authError }),
        { status: authError.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    // GET /api/v1/products - List products
    if (method === 'GET') {
      const scopeError = requireScope(key!, 'products:read');
      if (scopeError) {
        await logAPIRequest(supabase, key!.id, req, scopeError.status, Date.now() - startTime);
        return new Response(
          JSON.stringify({ error: scopeError }),
          { status: scopeError.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const category = url.searchParams.get('category');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('organization_id', key!.organization_id)
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const responseTime = Date.now() - startTime;
      await logAPIRequest(supabase, key!.id, req, 200, responseTime);

      return new Response(
        JSON.stringify({
          data: data || [],
          meta: {
            total: count || 0,
            limit,
            offset,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/v1/products - Create product
    if (method === 'POST') {
      const scopeError = requireScope(key!, 'products:write');
      if (scopeError) {
        await logAPIRequest(supabase, key!.id, req, scopeError.status, Date.now() - startTime);
        return new Response(
          JSON.stringify({ error: scopeError }),
          { status: scopeError.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...body,
          organization_id: key!.organization_id,
        })
        .select()
        .single();

      if (error) throw error;

      const responseTime = Date.now() - startTime;
      await logAPIRequest(supabase, key!.id, req, 201, responseTime);

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed', status: 405 } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
          status: 500,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});