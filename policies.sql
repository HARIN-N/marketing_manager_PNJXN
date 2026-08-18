-- ============================================================================
-- MARKETING OS — ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------
-- Run after schema.sql. Enforces spec section 36 (role-based access) at the
-- database layer — the frontend never has to be trusted for authorization.
--
-- Roles: Admin / Manager see everything. Everyone else only sees clients
-- they're a member of (client_members). Clients (if client login is ever
-- added) only see their own approvals/content.
-- ============================================================================

alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_custom_fields enable row level security;
alter table client_members enable row level security;
alter table brand_brain enable row level security;
alter table content enable row level security;
alter table content_revisions enable row level security;
alter table comments enable row level security;
alter table approvals enable row level security;
alter table approval_history enable row level security;
alter table workflow_stages enable row level security;
alter table tasks enable row level security;
alter table campaigns enable row level security;
alter table seo_keywords enable row level security;
alter table seo_rankings enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_metrics enable row level security;
alter table reports enable row level security;
alter table report_sections enable row level security;
alter table files enable row level security;
alter table notifications enable row level security;
alter table client_integrations enable row level security;

-- Helper: is the current user Admin or Manager?
create or replace function is_agency_lead()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('Admin','Manager')
  );
$$;

-- Helper: can the current user access this client?
create or replace function can_access_client(target_client_id uuid)
returns boolean language sql stable as $$
  select is_agency_lead() or exists (
    select 1 from client_members
    where client_id = target_client_id and user_id = auth.uid()
  );
$$;

-- profiles: everyone can read teammates, only self/admin can edit
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_self_or_admin" on profiles for update
  using (id = auth.uid() or is_agency_lead());

-- clients
create policy "clients_select" on clients for select using (can_access_client(id));
create policy "clients_insert_leads" on clients for insert with check (is_agency_lead());
create policy "clients_update_leads" on clients for update using (is_agency_lead());
create policy "clients_delete_leads" on clients for delete using (is_agency_lead());

-- generic per-client-scoped tables: same pattern applied to each
create policy "client_custom_fields_rw" on client_custom_fields for all using (can_access_client(client_id));
create policy "client_members_rw" on client_members for all using (is_agency_lead());
create policy "brand_brain_rw" on brand_brain for all using (can_access_client(client_id));
create policy "content_rw" on content for all using (can_access_client(client_id));
create policy "workflow_stages_rw" on workflow_stages for all using (can_access_client(client_id));
create policy "tasks_rw" on tasks for all using (client_id is null or can_access_client(client_id));
create policy "campaigns_rw" on campaigns for all using (can_access_client(client_id));
create policy "seo_keywords_rw" on seo_keywords for all using (can_access_client(client_id));
create policy "ad_campaigns_rw" on ad_campaigns for all using (can_access_client(client_id));
create policy "reports_rw" on reports for all using (can_access_client(client_id));
create policy "files_rw" on files for all using (can_access_client(client_id));
create policy "client_integrations_rw" on client_integrations for all using (can_access_client(client_id));

-- tables scoped through a parent content/report/campaign row
create policy "content_revisions_rw" on content_revisions for all using (
  exists (select 1 from content c where c.id = content_id and can_access_client(c.client_id))
);
create policy "comments_rw" on comments for all using (
  exists (select 1 from content c where c.id = content_id and can_access_client(c.client_id))
);
create policy "approvals_rw" on approvals for all using (
  exists (select 1 from content c where c.id = content_id and can_access_client(c.client_id))
);
create policy "approval_history_rw" on approval_history for all using (
  exists (select 1 from content c where c.id = content_id and can_access_client(c.client_id))
);
create policy "seo_rankings_rw" on seo_rankings for all using (
  exists (select 1 from seo_keywords k where k.id = keyword_id and can_access_client(k.client_id))
);
create policy "ad_metrics_rw" on ad_metrics for all using (
  exists (select 1 from ad_campaigns a where a.id = ad_campaign_id and can_access_client(a.client_id))
);
create policy "report_sections_rw" on report_sections for all using (
  exists (select 1 from reports r where r.id = report_id and can_access_client(r.client_id))
);

-- notifications: strictly personal
create policy "notifications_owner" on notifications for all using (user_id = auth.uid());
