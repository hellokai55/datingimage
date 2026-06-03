-- Create orders table for payment tracking
-- Supports Creem (and future payment providers)

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  creem_checkout_id text unique,
  creem_payment_id text,
  status text not null default 'pending',
  amount numeric(10,2) not null,
  credits integer not null,
  currency text default 'USD',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  
  -- Status constraint
  constraint valid_status check (status in ('pending', 'completed', 'failed', 'cancelled'))
);

-- Indexes
create index idx_orders_user_id on orders(user_id);
create index idx_orders_creem_checkout_id on orders(creem_checkout_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at desc);

-- RLS
alter table orders enable row level security;

create policy "Users can view their own orders"
  on orders for select
  using (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC: Add credits after successful payment
-- SECURITY DEFINER allows the webhook to call this without user auth context
create or replace function add_credits_from_order(
  p_order_id uuid,
  p_creem_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_credits integer;
  v_amount numeric(10,2);
  v_new_balance integer;
begin
  -- Lock the order row to prevent double-processing
  select user_id, credits, amount
  into v_user_id, v_credits, v_amount
  from orders
  where id = p_order_id
    and status = 'pending'
  for update;
  
  if v_user_id is null then
    raise exception 'Order not found or already processed: %', p_order_id;
  end if;
  
  -- Update order status
  update orders
  set status = 'completed',
      creem_payment_id = p_creem_payment_id,
      completed_at = now()
  where id = p_order_id;
  
  -- Add credits to user profile
  update profiles
  set credits = credits + v_credits,
      updated_at = now()
  where id = v_user_id
  returning credits into v_new_balance;
  
  -- Record credit transaction
  insert into credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    description,
    project_id
  )
  values (
    v_user_id,
    v_credits,
    v_new_balance,
    'purchase',
    'Credits purchase - $' || v_amount::text,
    null
  );
end;
$$;

-- RPC: Mark order as failed (for webhook failure handling)
create or replace function fail_order(
  p_order_id uuid,
  p_reason text default 'Payment failed'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set status = 'failed',
      metadata = jsonb_set(
        coalesce(metadata, '{}'),
        '{failure_reason}',
        to_jsonb(p_reason)
      ),
      updated_at = now()
  where id = p_order_id
    and status = 'pending';
end;
$$;