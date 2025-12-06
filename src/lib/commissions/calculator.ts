import { supabase } from '../supabase';

interface CommissionRule {
  id: string;
  commission_type: 'percentage' | 'fixed' | 'tiered';
  percentage?: number;
  fixed_amount?: number;
  tiers?: Array<{ min: number; max: number; rate: number }>;
  minimum_deal_size?: number;
  is_active: boolean;
  applies_to_roles: string[];
}

interface CommissionCalculationParams {
  userId: string;
  userRole: string;
  projectId?: string;
  invoiceId?: string;
  dealValue: number;
  organizationId: string;
}

export async function calculateCommission(params: CommissionCalculationParams) {
  const { userId, userRole, projectId, invoiceId, dealValue, organizationId } = params;

  // Get applicable commission rule for this user's role
  const { data: rules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .contains('applies_to_roles', [userRole]);

  if (rulesError || !rules || rules.length === 0) {
    console.log('No applicable commission rules found');
    return null;
  }

  const rule = rules[0] as CommissionRule;

  // Check minimum deal size
  if (rule.minimum_deal_size && dealValue < rule.minimum_deal_size) {
    console.log(`Deal value ${dealValue} below minimum ${rule.minimum_deal_size}`);
    return null;
  }

  let commissionAmount = 0;

  // Calculate commission based on type
  switch (rule.commission_type) {
    case 'percentage':
      if (rule.percentage) {
        commissionAmount = dealValue * (rule.percentage / 100);
      }
      break;

    case 'fixed':
      if (rule.fixed_amount) {
        commissionAmount = rule.fixed_amount;
      }
      break;

    case 'tiered':
      if (rule.tiers && Array.isArray(rule.tiers)) {
        const tier = rule.tiers.find(
          (t) => dealValue >= t.min && (t.max === null || dealValue <= t.max)
        );
        if (tier) {
          commissionAmount = dealValue * (tier.rate / 100);
        }
      }
      break;
  }

  if (commissionAmount <= 0) {
    console.log('Commission amount is zero');
    return null;
  }

  // Get current period dates
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Create commission record
  const { data: commission, error: commissionError } = await supabase
    .from('commissions')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      project_id: projectId,
      invoice_id: invoiceId,
      amount: commissionAmount,
      deal_value: dealValue,
      status: 'pending',
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (commissionError) {
    console.error('Error creating commission:', commissionError);
    return null;
  }

  return commission;
}

export async function approveCommission(commissionId: string, notes?: string) {
  const { data, error } = await supabase
    .from('commissions')
    .update({
      status: 'approved',
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commissionId)
    .select()
    .single();

  if (error) {
    console.error('Error approving commission:', error);
    return null;
  }

  return data;
}

export async function rejectCommission(commissionId: string, reason: string) {
  const { data, error } = await supabase
    .from('commissions')
    .update({
      status: 'pending',
      notes: `Rejected: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commissionId)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting commission:', error);
    return null;
  }

  return data;
}

export async function markCommissionPaid(commissionId: string, paidAt: Date) {
  const { data, error } = await supabase
    .from('commissions')
    .update({
      status: 'paid',
      paid_at: paidAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commissionId)
    .select()
    .single();

  if (error) {
    console.error('Error marking commission paid:', error);
    return null;
  }

  return data;
}

export async function getUserCommissionSummary(userId: string, organizationId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .gte('created_at', monthStart.toISOString());

  if (error) {
    console.error('Error fetching commissions:', error);
    return null;
  }

  const summary = {
    totalEarnedThisMonth: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  };

  commissions?.forEach((commission) => {
    summary.totalEarnedThisMonth += commission.amount;
    switch (commission.status) {
      case 'pending':
        summary.pending += commission.amount;
        break;
      case 'approved':
        summary.approved += commission.amount;
        break;
      case 'paid':
        summary.paid += commission.amount;
        break;
    }
  });

  return summary;
}
