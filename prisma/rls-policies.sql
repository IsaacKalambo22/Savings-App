-- NestKeep Row Level Security Policies
-- These policies ensure users can only access their own household data

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- HOUSEHOLDS
-- Users can view their own households
CREATE POLICY "Users can view own households" ON households
  FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert households (they become owner)
CREATE POLICY "Users can create households" ON households
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ACCOUNTS
-- Users can view accounts from their households
CREATE POLICY "Users can view household accounts" ON accounts
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert accounts in their households
CREATE POLICY "Users can create accounts in household" ON accounts
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update accounts in their households
CREATE POLICY "Users can update household accounts" ON accounts
  FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- TRANSACTIONS
-- Users can view transactions from their household accounts
CREATE POLICY "Users can view household transactions" ON transactions
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts 
      WHERE household_id IN (
        SELECT household_id FROM household_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert transactions in their household accounts
CREATE POLICY "Users can create transactions in household" ON transactions
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts 
      WHERE household_id IN (
        SELECT household_id FROM household_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update transactions in their household
CREATE POLICY "Users can update household transactions" ON transactions
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts 
      WHERE household_id IN (
        SELECT household_id FROM household_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- TRANSFERS
-- Users can view transfers from their household
CREATE POLICY "Users can view household transfers" ON transfers
  FOR SELECT
  USING (
    from_transaction_id IN (
      SELECT id FROM transactions 
      WHERE account_id IN (
        SELECT id FROM accounts 
        WHERE household_id IN (
          SELECT household_id FROM household_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- HOUSEHOLD MEMBERS
-- Users can view members of their households
CREATE POLICY "Users can view household members" ON household_members
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- SETTINGS
-- Users can view settings for their households
CREATE POLICY "Users can view household settings" ON settings
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- SAVINGS GOALS
-- Users can view goals from their households
CREATE POLICY "Users can view household goals" ON savings_goals
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create goals in their households
CREATE POLICY "Users can create goals in household" ON savings_goals
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

-- AUDIT LOGS
-- Users can view audit logs for their households
CREATE POLICY "Users can view household audit logs" ON audit_logs
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );
