CREATE TABLE unit_ledger (
    id               BIGSERIAL PRIMARY KEY,
    group_id         BIGINT          NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    member_id        BIGINT          NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    contribution_id  BIGINT          NOT NULL REFERENCES contributions (id) ON DELETE CASCADE,
    units            NUMERIC(18, 6)  NOT NULL,
    nav_per_unit     NUMERIC(15, 6)  NOT NULL,
    transaction_at   TIMESTAMP       NOT NULL,
    created_at       TIMESTAMP       NOT NULL DEFAULT now()
);

CREATE INDEX idx_unit_ledger_group_id ON unit_ledger (group_id);
CREATE INDEX idx_unit_ledger_member_id ON unit_ledger (member_id);
CREATE INDEX idx_unit_ledger_transaction_at ON unit_ledger (transaction_at);