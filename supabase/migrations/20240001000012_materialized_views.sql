-- supabase/migrations/20240001000012_materialized_views.sql

CREATE MATERIALIZED VIEW mv_revenue_daily AS
SELECT
  workspace_id,
  DATE(paid_at) as date,
  SUM(amount) as revenue,
  COUNT(*) as payment_count
FROM payments
GROUP BY workspace_id, DATE(paid_at);

CREATE UNIQUE INDEX ON mv_revenue_daily(workspace_id, date);

CREATE MATERIALIZED VIEW mv_client_health AS
SELECT
  c.id as client_id,
  c.workspace_id,
  LEAST(100, GREATEST(0,
    (CASE WHEN c.last_interaction_at > NOW() - INTERVAL '30 days' THEN 40 ELSE 0 END) +
    (CASE WHEN c.total_bookings > 5 THEN 30 ELSE c.total_bookings * 6 END) +
    (CASE WHEN c.total_revenue > 10000 THEN 30 ELSE (c.total_revenue / 10000 * 30)::INTEGER END)
  )) as health_score
FROM clients c;

CREATE UNIQUE INDEX ON mv_client_health(client_id);