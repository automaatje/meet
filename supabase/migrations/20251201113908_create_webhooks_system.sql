/*
  # Create Webhooks System

  1. New Tables
    - `webhooks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - User-friendly name for the webhook
      - `url` (text) - Target webhook URL (must be HTTPS)
      - `events` (text[]) - Array of event types to listen for
      - `is_active` (boolean) - Enable/disable webhook
      - `created_at` (timestamptz)
      - `last_triggered_at` (timestamptz) - Last successful trigger timestamp

    - `webhook_logs`
      - `id` (uuid, primary key)
      - `webhook_id` (uuid, references webhooks)
      - `event_type` (text) - Type of event that triggered the webhook
      - `payload` (jsonb) - Event payload data
      - `response_status` (integer) - HTTP response status code
      - `error_message` (text) - Error details if failed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own webhooks
    - Users can only view logs for their own webhooks

  3. Indexes
    - Index on webhooks.user_id for faster queries
    - Index on webhook_logs.webhook_id for log retrieval
    - Index on webhook_logs.created_at for time-based queries
*/

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_triggered_at TIMESTAMPTZ,
  CONSTRAINT valid_url CHECK (url ~* '^https://')
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
CREATE POLICY "Users can view own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for webhook_logs
CREATE POLICY "Users can view logs for own webhooks"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_logs.webhook_id
      AND webhooks.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_logs.webhook_id
      AND webhooks.user_id = auth.uid()
    )
  );