-- Add reported_count column to agents table
ALTER TABLE agents ADD COLUMN reported_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for reported_count for efficient sorting/filtering
CREATE INDEX idx_agents_reported_count ON agents(reported_count DESC);

-- Create reports table to track individual reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Create index for reports table
CREATE INDEX idx_reports_agent_id ON reports(agent_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- Function to increment report count when a report is created
CREATE OR REPLACE FUNCTION increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agents SET reported_count = reported_count + 1 WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement report count when a report is deleted
CREATE OR REPLACE FUNCTION decrement_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agents SET reported_count = reported_count - 1 WHERE id = OLD.agent_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment report count on insert
CREATE TRIGGER increment_agent_reports
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION increment_report_count();

-- Trigger to decrement report count on delete
CREATE TRIGGER decrement_agent_reports
  AFTER DELETE ON reports
  FOR EACH ROW EXECUTE FUNCTION decrement_report_count();

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports table
-- Users can create reports (insert their own)
CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
