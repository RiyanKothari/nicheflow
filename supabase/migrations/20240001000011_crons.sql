-- supabase/migrations/20240001000011_crons.sql
-- Note: pg_cron jobs call Edge Functions via HTTP

SELECT cron.schedule('digest-agent', '50 1 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/digest-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{}')$$
);

SELECT cron.schedule('reminder-check', '*/5 * * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/booking-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"check_reminders"}')$$
);

SELECT cron.schedule('invoice-overdue-check', '0 9 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/invoice-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"check_overdue"}')$$
);

SELECT cron.schedule('client-health-score', '0 2 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/client-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"recalculate_health_scores"}')$$
);

SELECT cron.schedule('birthday-check', '0 5 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/client-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"check_birthdays"}')$$
);

SELECT cron.schedule('inventory-check', '0 8 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/inventory-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"daily_check"}')$$
);

SELECT cron.schedule('recurring-tasks', '0 0 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/task-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"generate_recurring"}')$$
);

SELECT cron.schedule('refresh-materialized-views', '*/15 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_daily$$
);