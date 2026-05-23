-- MFM Corporation Supabase Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ptziszkaeueqyojixghn/sql

create table if not exists agent_events (
  id          bigserial primary key,
  agent       text        not null,
  task        text,
  response    text,
  score       integer     default 0,
  latency_ms  integer     default 0,
  provider    text,
  model       text,
  user_id     text,
  created_at  timestamptz default now()
);

create table if not exists agent_metrics (
  agent       text        primary key,
  total_runs  integer     default 0,
  avg_score   numeric(5,2) default 0,
  avg_latency integer     default 0,
  updated_at  timestamptz default now()
);

create table if not exists routing_decisions (
  id          bigserial primary key,
  agent       text,
  task_type   text,
  reasoning   text,
  confidence  numeric(3,2),
  created_at  timestamptz default now()
);

create table if not exists ceo_commands (
  id          bigserial primary key,
  command     text,
  user_id     text,
  response    text,
  created_at  timestamptz default now()
);

-- Indexes for dashboard queries
create index if not exists idx_agent_events_agent     on agent_events(agent);
create index if not exists idx_agent_events_created   on agent_events(created_at desc);
create index if not exists idx_routing_created        on routing_decisions(created_at desc);

-- Enable Realtime for live dashboard updates
alter publication supabase_realtime add table agent_events;
alter publication supabase_realtime add table agent_metrics;
