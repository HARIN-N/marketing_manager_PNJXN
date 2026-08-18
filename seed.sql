-- ============================================================================
-- MARKETING OS — SEED DATA (example)
-- ----------------------------------------------------------------------------
-- Run after schema.sql and policies.sql. This is a short EXAMPLE seed showing
-- the pattern — it intentionally does not duplicate the full demo dataset.
--
-- The full, richer demo dataset (10 clients across hospitality, SaaS and D2C,
-- with content/tasks/approvals/SEO/ads) currently lives in js/db.js so the
-- app works immediately with zero backend setup. When you connect Supabase
-- (see README → "Connecting Supabase"), port that same SEED object into
-- INSERT statements following the pattern below, or write a small one-time
-- Node script that reads js/db.js's SEED export and inserts it via the
-- Supabase JS client — that will be far less error-prone than hand-copying.
-- ============================================================================

-- Example: one client, its Brand Brain, and a first content item.
with new_client as (
  insert into clients (name, industry, business_type, status, services, platforms, target_audience, website)
  values (
    'Example Wellness Co',
    'Healthcare',
    'Multi-location wellness clinic',
    'Onboarding',
    array['Content','Social Media','SEO'],
    array['Instagram','Google Business Profile'],
    'Health-conscious urban professionals, 28-45',
    'https://example-wellness.example.com'
  )
  returning id
)
insert into brand_brain (client_id, personality, tone, target_audience, core_messaging)
select id, 'Calm, evidence-based, approachable', array['Reassuring','Clear','Warm'], 'Health-conscious urban professionals, 28-45', 'Care that actually listens.'
from new_client;
