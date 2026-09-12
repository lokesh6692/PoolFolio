CREATE TABLE contributions (
    id               BIGSERIAL PRIMARY KEY,
    group_id         BIGINT          NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    member_id        BIGINT          NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    amount           NUMERIC(15, 2)  NOT NULL,
    type             VARCHAR(20)     NOT NULL,
    note             TEXT,
    contributed_at   TIMESTAMP       NOT NULL,
    created_at       TIMESTAMP       NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP       NOT NULL DEFAULT now(),
    CONSTRAINT chk_contribution_type CHECK (type IN ('DEPOSIT', 'WITHDRAWAL')),
    CONSTRAINT chk_contribution_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_contributions_group_id ON contributions (group_id);
CREATE INDEX idx_contributions_member_id ON contributions (member_id);
CREATE INDEX idx_contributions_contributed_at ON contributions (contributed_at);
