-- Whop as a billing channel, and Whop's user ID so memberships can be linked to accounts.
alter type billing_channel add value if not exists 'whop';
alter table subscriptions add column if not exists whop_user_id text;
create index if not exists subscriptions_whop_user on subscriptions (whop_user_id);
