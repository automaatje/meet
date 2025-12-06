import { supabase } from '../supabase';

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export async function createSession(
  userId: string,
  timeoutMinutes: number = 480
): Promise<UserSession> {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      ip_address: 'client-ip',
      user_agent: navigator.userAgent,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserSessions(userId: string): Promise<UserSession[]> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('last_activity_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateSessionActivity(sessionToken: string): Promise<void> {
  await supabase
    .from('user_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('session_token', sessionToken);
}

export async function terminateSession(sessionId: string): Promise<void> {
  await supabase.from('user_sessions').delete().eq('id', sessionId);
}

export async function terminateAllOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<void> {
  await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('id', currentSessionId);
}

export async function isSessionValid(sessionToken: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_sessions')
    .select('expires_at')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (!data) return false;

  const expiresAt = new Date(data.expires_at);
  return expiresAt > new Date();
}

export function getDeviceInfo(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  } else if (userAgent.includes('Edg')) {
    return 'Edge';
  }
  return 'Unknown Browser';
}

export function getOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown OS';
}
