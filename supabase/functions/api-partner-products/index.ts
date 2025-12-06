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
}

async function authenticateAPIKey(request: Request, supabase: any) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { key: null, error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header', status: 401 } };
  }
  
  const apiKey = authHeader.replace('Bearer ', '').trim();
  const keyPrefix = apiKey.substring(0, 8);
  
  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true);
  
  if (!keys || keys.length === 0) {
    return { key: null, error: { code: 'UNAUTHORIZED', message: 'Invalid API key', status: 401 } };
  }
  
  const keyRecord = keys[0];
  
  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id);
  
  return { key: keyRecord, error: null };
}

function requireScope(key: APIKey, requiredScope: string) {
  if (!key.scopes.includes(requiredScope)) {
    return { code: 'FORBIDDEN', message: `Required scope: ${requiredScope}`, status: 403 };
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { key, error: authError } = await authenticateAPIKey(req, supabase);
    if (authError) {
      return new Response(
        JSON.stringify({ error: authError }),
        { status: authError.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/v1/partner/products/sync - Sync partner product catalog
    if (req.method === 'POST') {
      const scopeError = requireScope(key!, 'products:write');
      if (scopeError) {
        return new Response(
          JSON.stringify({ error: scopeError }),
          { status: scopeError.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const products = Array.isArray(body) ? body : [body];

      const results = [];
      for (const product of products) {
        const { data, error } = await supabase
          .from('partner_products')
          .upsert({
            partner_api_key_id: key!.id,
            external_id: product.external_id,
            category: product.category,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            price: product.price,
            stock_quantity: product.stock_quantity,
            specifications: product.specifications || {},
            image_urls: product.image_urls || [],
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'partner_api_key_id,external_id',
          })
          .select()
          .single();

        if (error) {
          results.push({ external_id: product.external_id, success: false, error: error.message });
        } else {
          results.push({ external_id: product.external_id, success: true, id: data.id });
        }
      }

      return new Response(
        JSON.stringify({
          synced: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/v1/partner/products - List partner products
    if (req.method === 'GET') {
      const scopeError = requireScope(key!, 'products:read');
      if (scopeError) {
        return new Response(
          JSON.stringify({ error: scopeError }),
          { status: scopeError.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_api_key_id', key!.id)
        .order('last_synced_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ data: data || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed', status: 405 } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
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