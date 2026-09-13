ALTER TABLE profit_shares
    ADD COLUMN units_held NUMERIC(18,6) NOT NULL DEFAULT 0,
    ADD COLUMN total_contributed NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN total_invested NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN available_cash_without_pl NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN realized_profit_loss NUMERIC(15,2) NOT NULL DEFAULT 0,
    ADD COLUMN available_cash_with_pl NUMERIC(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN profit_shares.ownership_percentage IS
    'Phase 5 Batch 2: member unit-share (units_held / total group units outstanding as of snapshot) expressed 0-100. Was unused/naive flat percentage before this migration.';
