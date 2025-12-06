import { supabase, pricingService, customerService } from './supabase';

interface GeneratePDFDataParams {
  projectId: string;
}

export async function generatePDFData(params: GeneratePDFDataParams) {
  const { projectId } = params;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) throw new Error('Project not found');

  const customer = await customerService.getById(project.customer_id);
  if (!customer) throw new Error('Customer not found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const lineItems = await pricingService.getLineItems(projectId);

  let logoUrl = undefined;
  if (profile?.logo_url) {
    const { data: logoData } = supabase.storage
      .from('company-assets')
      .getPublicUrl(profile.logo_url);
    logoUrl = logoData.publicUrl;
  }

  const quoteNumber = await generateQuoteNumber();
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);

  const getSubsidyConfig = (type: string | null) => {
    const configs: Record<string, { singleRate: number; doubleRate: number; maxArea: number }> = {
      spouwmuurisolatie: { singleRate: 5.25, doubleRate: 10.50, maxArea: 170 },
      vloerisolatie: { singleRate: 5.50, doubleRate: 11.00, maxArea: 130 },
      dakisolatie: { singleRate: 16.25, doubleRate: 32.50, maxArea: 200 },
      kunststof_kozijnen_triple_glas: { singleRate: 111, doubleRate: 222, maxArea: 45 },
    };
    return type ? configs[type] : null;
  };

  const measuresCount = lineItems?.filter(item => item.isde_subsidy_type).length || 0;
  const isDoubleMeasure = measuresCount >= 2;

  let materialTotal = 0;
  let laborTotal = 0;
  let subtotal = 0;
  let vatTotal = 0;
  let subsidyTotal = 0;

  const pdfLineItems = lineItems?.map(item => {
    const material = item.area_m2 * item.material_price_m2 * (1 + item.waste_percentage / 100);
    const labor = item.area_m2 * item.labor_price_m2;
    const lineSubtotal = material + labor;
    const vat = lineSubtotal * (item.vat_percentage / 100);
    const total = lineSubtotal + vat;

    let subsidy = 0;
    if (item.isde_subsidy_type) {
      const config = getSubsidyConfig(item.isde_subsidy_type);
      if (config) {
        const cappedArea = Math.min(item.area_m2, config.maxArea);
        const rate = isDoubleMeasure ? config.doubleRate : config.singleRate;
        subsidy = cappedArea * rate;
      }
    }

    materialTotal += material;
    laborTotal += labor;
    subtotal += lineSubtotal;
    vatTotal += vat;
    subsidyTotal += subsidy;

    const avgPricePerM2 = item.area_m2 > 0 ? lineSubtotal / item.area_m2 : 0;

    return {
      description: item.description,
      area_m2: item.area_m2,
      price_per_m2: avgPricePerM2,
      total,
      subsidyType: item.isde_subsidy_type,
      subsidyAmount: subsidy,
    };
  }) || [];

  const financing = project.financing_enabled ? {
    loanAmount: project.financing_loan_amount || 0,
    term: project.financing_term || 0,
    interestRate: project.financing_interest_rate || 0,
    monthlyPayment: project.financing_monthly_payment || 0,
  } : undefined;

  return {
    quote: {
      quoteNumber,
      date: formatDate(today),
      validUntil: formatDate(validUntil),
    },
    company: {
      name: profile?.company_name || 'Jouw Bedrijf',
      address: profile?.address || '',
      postalCode: profile?.postal_code || '',
      city: profile?.city || '',
      phone: profile?.phone || '',
      email: user.email || '',
      kvkNumber: profile?.kvk_number || undefined,
      btwNumber: profile?.btw_number || undefined,
      logoUrl,
    },
    customer: {
      name: customer.company_name || customer.contact_name,
      address: customer.address || '',
      postalCode: customer.postal_code || '',
      city: customer.city || '',
      phone: customer.phone || undefined,
      email: customer.email || undefined,
    },
    project: {
      title: project.title,
      address: project.address || '',
      description: project.description || undefined,
    },
    lineItems: pdfLineItems,
    totals: {
      subtotal,
      vat: vatTotal,
      total: subtotal + vatTotal,
      subsidy: subsidyTotal,
      totalAfterSubsidy: subtotal + vatTotal - subsidyTotal,
    },
    financing,
    terms: {
      payment: profile?.payment_terms || '30 dagen netto na factuurdatum',
      conditions: profile?.general_conditions || 'De algemene voorwaarden zijn van toepassing op deze offerte.',
    },
  };
}

async function generateQuoteNumber(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const year = new Date().getFullYear();
  const number = (count || 0) + 1;
  return `OFF-${year}-${number.toString().padStart(4, '0')}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function markQuoteAsSent(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .update({
      status: 'sent',
    })
    .eq('id', projectId);

  if (error) throw error;
}
