CREATE TABLE events (
  time TIMESTAMPTZ NOT NULL,
  user_id UUID,
  event_type TEXT,
  properties JSONB
);
SELECT create_hypertable('events', 'time');
