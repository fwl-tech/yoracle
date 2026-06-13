-- Yoracle schema
CREATE SCHEMA IF NOT EXISTS yoracle;
SET search_path TO yoracle;

CREATE TABLE organisations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  industry      TEXT,
  size          TEXT,
  ontology_version INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ontologies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  version              INTEGER NOT NULL DEFAULT 1,
  customer_definition  JSONB DEFAULT '{}',
  revenue_model        JSONB DEFAULT '{}',
  cost_structure       JSONB DEFAULT '{}',
  departments          JSONB DEFAULT '[]',
  saas_connections     JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id     TEXT UNIQUE NOT NULL,
  org_id            UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  name              TEXT,
  role              TEXT NOT NULL,
  department        TEXT,
  rbac_permissions  JSONB DEFAULT '{}',
  timezone          TEXT DEFAULT 'UTC',
  notification_prefs JSONB DEFAULT '{"email": true, "slack": true, "digest_time": "07:00"}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_contexts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_history JSONB DEFAULT '[]',
  preference_signals   JSONB DEFAULT '{}',
  last_active          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE connectors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  system_type           TEXT NOT NULL,
  auth_config_encrypted TEXT NOT NULL,
  last_synced           TIMESTAMPTZ,
  status                TEXT DEFAULT 'active',
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE data_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL,
  raw_data     JSONB NOT NULL DEFAULT '{}',
  synced_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_at      TIMESTAMPTZ DEFAULT now(),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'general',
  severity          TEXT NOT NULL DEFAULT 'info',
  metric_refs       JSONB DEFAULT '[]',
  suggested_actions JSONB DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE digest_deliveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  channel     TEXT NOT NULL,
  insight_ids UUID[] DEFAULT '{}',
  delivered_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workflow_triggers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_id    UUID REFERENCES insights(id),
  action_type   TEXT NOT NULL,
  target_system TEXT NOT NULL,
  payload       JSONB DEFAULT '{}',
  triggered_at  TIMESTAMPTZ DEFAULT now(),
  status        TEXT DEFAULT 'pending'
);

-- Indexes
CREATE INDEX idx_insights_user_date    ON insights(user_id, generated_at DESC);
CREATE INDEX idx_insights_org          ON insights(org_id);
CREATE INDEX idx_insights_status       ON insights(user_id, status);
CREATE INDEX idx_connectors_org        ON connectors(org_id);
CREATE INDEX idx_snapshots_connector   ON data_snapshots(connector_id, synced_at DESC);
CREATE INDEX idx_ontologies_org        ON ontologies(org_id, version DESC);
CREATE INDEX idx_users_clerk           ON users(clerk_user_id);
CREATE INDEX idx_users_org             ON users(org_id);
