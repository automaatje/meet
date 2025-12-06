import { supabase } from '../supabase';
import { WebhookEventType } from './events';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000];
const MAX_WEBHOOKS_PER_MINUTE = 100;

const webhookCallCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = webhookCallCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    webhookCallCounts.set(userId, {
      count: 1,
      resetTime: now + 60000,
    });
    return true;
  }

  if (userLimit.count >= MAX_WEBHOOKS_PER_MINUTE) {
    return false;
  }

  userLimit.count++;
  return true;
}

async function executeWebhookWithRetry(
  webhookId: string,
  url: string,
  eventType: string,
  payload: any,
  retryCount: number = 0
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Event-Type': eventType,
        'X-Timestamp': new Date().toISOString(),
        'User-Agent': 'BouwMeet-Webhooks/1.0',
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    });

    const success = response.ok;

    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: payload,
      response_status: response.status,
      error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
    });

    if (success) {
      await supabase
        .from('webhooks')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', webhookId);

      return { success: true, status: response.status };
    }

    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[retryCount]));
      return executeWebhookWithRetry(webhookId, url, eventType, payload, retryCount + 1);
    }

    return { success: false, status: response.status, error: response.statusText };
  } catch (error: any) {
    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: payload,
      response_status: 0,
      error_message: error.message || 'Network error',
    });

    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[retryCount]));
      return executeWebhookWithRetry(webhookId, url, eventType, payload, retryCount + 1);
    }

    return { success: false, error: error.message };
  }
}

export async function triggerWebhooks(
  userId: string,
  eventType: WebhookEventType,
  payload: any
): Promise<void> {
  try {
    if (!checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return;
    }

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (error) {
      console.error('Error fetching webhooks:', error);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      webhooks.map((webhook) =>
        executeWebhookWithRetry(webhook.id, webhook.url, eventType, payload)
      )
    );

    const failedWebhooks = results.filter((result) => result.status === 'rejected');
    if (failedWebhooks.length > 0) {
      console.error(`${failedWebhooks.length} webhook(s) failed to execute`);
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

export async function testWebhook(
  webhookId: string,
  url: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  const testPayload = {
    test: true,
    message: 'This is a test webhook from BouwMeet',
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Event-Type': 'webhook.test',
        'X-Timestamp': new Date().toISOString(),
        'User-Agent': 'BouwMeet-Webhooks/1.0',
      },
      body: JSON.stringify(testPayload),
    });

    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event_type: 'webhook.test',
      payload: testPayload,
      response_status: response.status,
      error_message: response.ok ? null : `HTTP ${response.status}`,
    });

    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : response.statusText,
    };
  } catch (error: any) {
    await supabase.from('webhook_logs').insert({
      webhook_id: webhookId,
      event_type: 'webhook.test',
      payload: testPayload,
      response_status: 0,
      error_message: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getWebhookStats(webhookId: string): Promise<{
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
}> {
  const { data: logs } = await supabase
    .from('webhook_logs')
    .select('response_status')
    .eq('webhook_id', webhookId);

  if (!logs || logs.length === 0) {
    return { totalCalls: 0, successfulCalls: 0, failedCalls: 0, successRate: 0 };
  }

  const totalCalls = logs.length;
  const successfulCalls = logs.filter(
    (log) => log.response_status >= 200 && log.response_status < 300
  ).length;
  const failedCalls = totalCalls - successfulCalls;
  const successRate = Math.round((successfulCalls / totalCalls) * 100);

  return { totalCalls, successfulCalls, failedCalls, successRate };
}
