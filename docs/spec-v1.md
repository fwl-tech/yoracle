# Product spec — yoracle

**Version**: 1.0  
**Status**: Draft  
**URL**: https://hatchai.fairwaterlabs.com/apps/yoracle  
**Repo**: https://github.com/fwl-tech/yoracle  
**Updated**: 2026-06-12

---

## Problem

Business leaders at mid-to-large companies are drowning in data but starved of insight. KPIs are scattered across ERPs, CRMs, and spreadsheets; analysts spend days producing reports that are stale by the time they land. Yoracle solves this by building a living ontology of the business — its customers, revenue model, cost structure, and departmental relationships — and using it to continuously surface the signals that matter, suppress the noise, and suggest what to do next. The result is faster, more confident decisions at every level of the organisation.

---

## Users

| Persona | Description | Key need |
|---------|-------------|----------|
| CEO | Sets overall direction, owns P&L | Company health at a glance; early warning on revenue and customer risk |
| CRO | Owns revenue targets | Pipeline health, win rates, churn signals, forecast accuracy |
| CMO | Owns demand generation | Campaign ROI, lead quality, brand-to-revenue attribution |
| COO | Owns operational efficiency | Cost-per-unit, throughput, delivery SLAs, resource utilisation |
| CFO | Owns financial performance | Gross margin, burn, cash flow, profitability by segment |
| CCO | Owns customer relationships | NPS trends, churn risk, expansion signals, escalation backlog |
| VP / Director (Sales) | Manages sales teams and quota | Rep performance, deal velocity, pipeline coverage |
| VP / Director (Marketing) | Manages campaigns and pipeline | MQL/SQL conversion, channel mix, content performance |
| VP / Director (Operations) | Manages delivery and fulfilment | Capacity, cycle times, defect rates |
| VP / Director (Finance) | Manages FP&A | Variance to budget, headcount cost, runway |
| VP / Director (Customer Success) | Manages retention and expansion | Health scores, renewal risk, upsell opportunities |

---

## Core actions

### 1. Review daily insight digest
Each user receives a personalised daily briefing — via email, Slack DM, and the web app — containing the 3–5 most important signals for their role. Each insight includes: what changed, why it matters, and a suggested action. The system generates this at a scheduled time (default 07:00 local) by querying the ontology + live data connectors.

**Success**: User reads the digest and either acts on a suggestion or marks it as reviewed, without opening a single underlying tool.

### 2. Ask the AI a follow-up question
From the web app or Slack, users can ask natural-language questions about any metric, trend, or entity in the business. Yoracle answers using the ontology layer and connected data sources, citing which system the data came from. Conversation history is stored per user and used to personalise future insights.

**Success**: User gets a direct answer with source attribution in under 10 seconds.

### 3. Drill into KPI dashboards
The web app surfaces role-specific dashboards showing the KPIs most relevant to each persona. Dashboards are generated from the ontology (which defines what "revenue", "customer", "cost" means for this business) and updated on a configurable refresh cadence. Users can filter by time range, segment, or business unit.

**Success**: User finds the metric they're looking for without leaving the app or writing a query.

### 4. Get suggested actions and trigger workflows
Each insight carries one or more AI-generated suggested actions (e.g. "Schedule a review call with Account X — renewal risk is high"). Users can approve and trigger these actions directly into connected SaaS tools via API or MCP server connections (e.g. create a Salesforce task, send a Slack message, update a HubSpot deal stage).

**Success**: User triggers a workflow from within Yoracle without switching to the underlying tool.

---

## Data model

| Entity | Key fields |
|--------|------------|
| **Organisation** | id, name, industry, size, ontology_version |
| **Ontology** | id, org_id, version, customer_definition, revenue_model, cost_structure, departments, saas_connections, created_at |
| **User** | id, org_id, email, name, role, department, rbac_permissions, timezone, notification_prefs |
| **UserContext** | id, user_id, conversation_history (JSON), preference_signals, last_active |
| **Connector** | id, org_id, system_type (crm/erp/etc), auth_config (encrypted), last_synced, status |
| **DataSnapshot** | id, connector_id, entity_type, raw_data (JSON), synced_at |
| **Insight** | id, org_id, user_id, generated_at, title, body, metric_refs (JSON), suggested_actions (JSON), status (new/reviewed/actioned) |
| **DigestDelivery** | id, user_id, date, channel (email/slack/web), insight_ids, delivered_at |
| **WorkflowTrigger** | id, user_id, insight_id, action_type, target_system, payload (JSON), triggered_at, status |

---

## Auth

Email + password with SSO support (Google Workspace, Microsoft Entra).

> **Assumed:** SSO is available in v1 since the target users are enterprise employees who expect it. Magic-link fallback for users without SSO configured.

**Protected routes** (require login + valid RBAC role):
- `/apps/yoracle/*` — all routes

**Public routes:**
- `/apps/yoracle/health` — uptime check only

RBAC is role-based: each user's role (CEO, CFO, etc.) determines which dashboard panels, insight categories, and data connectors they can see. Implemented via Clerk Organisations + role metadata.

---

## API surface

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apps/yoracle/api/insights` | List today's insights for the authenticated user |
| GET | `/apps/yoracle/api/insights/:id` | Get a single insight with full detail |
| POST | `/apps/yoracle/api/insights/:id/action` | Trigger a suggested workflow action |
| GET | `/apps/yoracle/api/dashboards` | List available dashboards for user's role |
| GET | `/apps/yoracle/api/dashboards/:id/data` | Get KPI data for a specific dashboard |
| POST | `/apps/yoracle/api/chat` | Send a chat message, get AI response (streaming) |
| GET | `/apps/yoracle/api/chat/history` | Get conversation history for the user |
| GET | `/apps/yoracle/api/ontology` | Get the organisation's current ontology |
| POST | `/apps/yoracle/api/onboarding/answer` | Submit an onboarding wizard answer |
| GET | `/apps/yoracle/api/connectors` | List configured data connectors |
| POST | `/apps/yoracle/api/connectors` | Add a new SaaS connector |
| DELETE | `/apps/yoracle/api/connectors/:id` | Remove a connector |

---

## UI screens

1. **Onboarding wizard** — Conversational step-by-step flow for new organisations. Asks questions about the business (customer definition, revenue model, cost structure, SaaS tools in use, department structure). Builds the ontology layer. The wizard proceeds until enough context exists to populate at least one KPI dashboard panel per the user's role — completeness is evaluated dynamically, and the system prompts for specific missing fields before rendering each panel.

2. **Daily digest** — Landing screen after login. Shows today's personalised insight cards, each with title, summary, severity indicator, and action button. Filterable by category (customer, revenue, profitability).

3. **Chat / AI assistant** — Full-screen chat interface. Supports follow-up questions, references to specific insights or KPIs, and shows source attribution inline. Conversation history in left sidebar.

4. **KPI dashboards** — Role-specific dashboard view. Panel grid with live KPI tiles (sparkline + current value + delta). Filters: time range, segment, business unit. Drill-down to underlying data on click.

5. **Insight detail** — Expanded view of a single insight. Full narrative, supporting charts, linked entities, suggested actions with one-click trigger buttons.

6. **Connectors** — Admin screen to add/edit/remove SaaS integrations. Shows sync status and last-updated timestamp per connector.

7. **User settings** — Notification preferences (email digest time, Slack DM on/off), role/department self-declaration, timezone.

8. **Org admin** — (Admin role only) Manage users, roles, and the ontology. Edit ontology fields, view connector health, manage API keys.

---

## Constraints

**Must have in v1:**
- Conversational onboarding wizard that builds the ontology layer
- Role-specific KPI dashboards (at minimum: revenue health, customer base state, profitability)
- Slack agent (bot that responds to DMs and can be @mentioned in channels)
- Daily personalised insights email per user
- Connectors to **Salesforce, NetSuite, HubSpot, SAP, and Zendesk** via API or MCP server
- RBAC aligned to the 11 personas defined above

**Explicitly out of scope for v1:**
- Self-serve billing or pricing tiers (this is an internal tool)
- Mobile native apps (web + Slack covers mobile use cases sufficiently)
- Custom report builder (dashboards are generated from the ontology, not user-configured)
- Real-time streaming data (batch/scheduled refresh is sufficient for v1)

**Technical constraints:**
- All data connector credentials stored encrypted at rest
- No raw business data exposed in API responses — only derived insights and aggregates
- Slack bot must work in both DM and channel contexts

---

## Success metric

**Primary**: Reduction in time-to-insight — measured by how quickly a user can answer a business question using Yoracle vs. their current process (baseline survey at onboarding, follow-up at 30 days).

**Secondary**: Decision velocity — number of workflow actions triggered per week per user (proxy for the system surfacing actionable, trusted insights).

**Lagging**: Qualitative feedback from C-suite users at 60-day review: "I make faster, more confident decisions."

---

## Open questions

> **Assumed:** The ontology is org-wide (one per organisation), not per business unit. If different BUs have fundamentally different commercial models, the ontology may need a hierarchical structure. Flag for discussion before coding the data model.

> **Assumed:** The Slack agent uses the same AI backend as the web chat. A single conversation context is maintained per user across both channels.

> **Assumed:** Daily digest is sent at 07:00 in the user's local timezone. Configurable in user settings.

> **Assumed:** v1 connectors are read-only (pull data in). Write-back (triggering workflows) is handled via separate workflow trigger API calls, not through the connector itself.
