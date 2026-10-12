-- DriveOne Direct purchases, read by scripts/dod-purchase-alert.mjs.
-- Run read-only against Supabase project kovara-ai-production (enrucchbvcrtailxqzjt).
-- Metricbridge's kovara mirror lags this table (missed 6 of 10 sales as of 12 Oct 2026),
-- so this is the source of truth.
select
  q.id,
  q.created_at,
  q.status,
  q.payment_status,
  q.payment_completed_at,
  q.contract_number,
  q.ascent_contract_number,
  q.ascent_plan_name,
  q.contract_months,
  q.contract_price,
  q.down_payment,
  q.payment_method,
  q.payment_term,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.city,
  c.state,
  v.year,
  v.make,
  v.model
from quotes q
left join customers c on c.id = q.customer_id
left join customer_vehicles v on v.id = q.customer_vehicle_id
where q.status in ('payment_pending', 'paid')
   or q.payment_status in ('budco_initiated', 'completed')
   or q.payment_completed_at is not null
order by q.created_at;
