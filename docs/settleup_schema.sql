-- Settle Up (Group Expense Sharing) - PostgreSQL schema
-- Assumes the database is already created and you have privileges to create extensions/tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core users
CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_currency CHAR(3) NOT NULL DEFAULT 'SGD',
  auth_provider TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE IF NOT EXISTS expense_group (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_currency CHAR(3) NOT NULL DEFAULT 'SGD',
  created_by UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group membership + roles
CREATE TABLE IF NOT EXISTS group_member (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'LEFT', 'REMOVED')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Invite links / email invites
CREATE TABLE IF NOT EXISTS group_invite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  invitee_email TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER')),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Currency reference
CREATE TABLE IF NOT EXISTS currency (
  code CHAR(3) PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT
);

-- Exchange rates (optional for multi-currency)
CREATE TABLE IF NOT EXISTS exchange_rate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency CHAR(3) NOT NULL REFERENCES currency(code),
  quote_currency CHAR(3) NOT NULL REFERENCES currency(code),
  rate NUMERIC(18, 8) NOT NULL,
  as_of TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency, as_of)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expense (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'SGD',
  split_type TEXT NOT NULL CHECK (split_type IN ('EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARES')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Who paid (supports multiple payers)
CREATE TABLE IF NOT EXISTS expense_payer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  amount_paid NUMERIC(14, 2) NOT NULL CHECK (amount_paid >= 0),
  UNIQUE (expense_id, user_id)
);

-- How the expense is split
CREATE TABLE IF NOT EXISTS expense_split (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  share_amount NUMERIC(14, 2),
  share_percent NUMERIC(6, 3),
  share_weight NUMERIC(10, 4),
  UNIQUE (expense_id, user_id)
);

-- Receipts (S3 or similar)
CREATE TABLE IF NOT EXISTS expense_receipt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_by UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Simplified settlement transactions
CREATE TABLE IF NOT EXISTS settlement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  to_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'SGD',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Activity log (auditing)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_member_group ON group_member(group_id);
CREATE INDEX IF NOT EXISTS idx_group_member_user ON group_member(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_group ON expense(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_created_by ON expense(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_payer_expense ON expense_payer(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_split_expense ON expense_split(expense_id);
CREATE INDEX IF NOT EXISTS idx_settlement_group ON settlement(group_id);
CREATE INDEX IF NOT EXISTS idx_settlement_from_to ON settlement(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_group ON activity_log(group_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_user_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expense_group_updated_at
BEFORE UPDATE ON expense_group
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expense_updated_at
BEFORE UPDATE ON expense
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Row-level security (RLS)
-- Assumes the application sets: SET app.user_id = '<uuid>';
-- ============================================================================
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Enable RLS
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invite ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payer ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_split ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- app_user: user can see/update self
CREATE POLICY app_user_select_self ON app_user
  FOR SELECT USING (id = current_app_user_id());

CREATE POLICY app_user_update_self ON app_user
  FOR UPDATE USING (id = current_app_user_id());

-- expense_group: members can read, admins can update/delete, creator can insert
CREATE POLICY expense_group_select_member ON expense_group
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense_group.id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_group_insert_creator ON expense_group
  FOR INSERT WITH CHECK (created_by = current_app_user_id());

CREATE POLICY expense_group_update_admin ON expense_group
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense_group.id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_group_delete_admin ON expense_group
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense_group.id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

-- group_member: members can read, admins can manage
CREATE POLICY group_member_select_group ON group_member
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = group_member.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY group_member_insert_admin ON group_member
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = group_member.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY group_member_update_admin ON group_member
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = group_member.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY group_member_delete_admin ON group_member
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = group_member.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

-- group_invite: admins can manage, members can read
CREATE POLICY group_invite_select_member ON group_invite
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = group_invite.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY group_invite_manage_admin ON group_invite
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = group_invite.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

-- expense + related tables: members can read, members can insert, admins can update/delete
CREATE POLICY expense_select_member ON expense
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_insert_member ON expense
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_update_admin ON expense
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_delete_admin ON expense
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = expense.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_payer_select_member ON expense_payer
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM expense e
      JOIN group_member gm ON gm.group_id = e.group_id
      WHERE e.id = expense_payer.expense_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_payer_insert_member ON expense_payer
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM expense e
      JOIN group_member gm ON gm.group_id = e.group_id
      WHERE e.id = expense_payer.expense_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_split_select_member ON expense_split
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM expense e
      JOIN group_member gm ON gm.group_id = e.group_id
      WHERE e.id = expense_split.expense_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_split_insert_member ON expense_split
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM expense e
      JOIN group_member gm ON gm.group_id = e.group_id
      WHERE e.id = expense_split.expense_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_receipt_select_member ON expense_receipt
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM expense e
      JOIN group_member gm ON gm.group_id = e.group_id
      WHERE e.id = expense_receipt.expense_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY expense_receipt_insert_member ON expense_receipt
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM expense e
      JOIN group_member gm ON gm.group_id = e.group_id
      WHERE e.id = expense_receipt.expense_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

-- settlement: members can read, members can insert, admins can update/delete
CREATE POLICY settlement_select_member ON settlement
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = settlement.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY settlement_insert_member ON settlement
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = settlement.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY settlement_update_admin ON settlement
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = settlement.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY settlement_delete_admin ON settlement
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = settlement.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

-- activity log: members can read, admins can insert (or system)
CREATE POLICY activity_log_select_member ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = activity_log.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.status = 'ACTIVE'
    )
  );

CREATE POLICY activity_log_insert_admin ON activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_member gm
      WHERE gm.group_id = activity_log.group_id
        AND gm.user_id = current_app_user_id()
        AND gm.role = 'ADMIN'
        AND gm.status = 'ACTIVE'
    )
  );

-- notifications: user can read/update self
CREATE POLICY notification_select_self ON notification
  FOR SELECT USING (user_id = current_app_user_id());

CREATE POLICY notification_update_self ON notification
  FOR UPDATE USING (user_id = current_app_user_id());

-- ============================================================================
-- Materialized view: net balances per group/member/currency
-- Assumes expense_split.share_amount is populated for all splits.
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_group_member_balance AS
WITH paid AS (
  SELECT e.group_id, ep.user_id, e.currency, SUM(ep.amount_paid) AS amount
  FROM expense_payer ep
  JOIN expense e ON e.id = ep.expense_id
  GROUP BY e.group_id, ep.user_id, e.currency
),
owed AS (
  SELECT e.group_id, es.user_id, e.currency, SUM(COALESCE(es.share_amount, 0)) AS amount
  FROM expense_split es
  JOIN expense e ON e.id = es.expense_id
  GROUP BY e.group_id, es.user_id, e.currency
),
ledger AS (
  SELECT group_id, user_id, currency, amount FROM paid
  UNION ALL
  SELECT group_id, user_id, currency, -amount FROM owed
)
SELECT
  group_id,
  user_id,
  currency,
  SUM(amount) AS net_amount
FROM ledger
GROUP BY group_id, user_id, currency;

CREATE INDEX IF NOT EXISTS idx_mv_balance_group_user
  ON mv_group_member_balance(group_id, user_id, currency);

-- Refresh when needed:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_group_member_balance;

-- ============================================================================
-- Master data seed
-- ============================================================================
INSERT INTO currency (code, name, symbol) VALUES
  ('SGD', 'Singapore Dollar', 'S$'),
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('INR', 'Indian Rupee', '₹'),
  ('JPY', 'Japanese Yen', '¥')
ON CONFLICT (code) DO NOTHING;
