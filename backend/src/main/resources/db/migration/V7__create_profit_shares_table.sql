CREATE TABLE profit_shares (
    id                      BIGSERIAL PRIMARY KEY,
    valuation_id            BIGINT          NOT NULL REFERENCES valuations (id) ON DELETE CASCADE,
    member_id               BIGINT          NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    ownership_percentage    NUMERIC(9, 6)   NOT NULL,
    contributed_amount      NUMERIC(15, 2)  NOT NULL,
    current_value           NUMERIC(15, 2)  NOT NULL,
    profit_loss             NUMERIC(15, 2)  NOT NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT now(),
    CONSTRAINT uq_profit_shares_valuation_member UNIQUE (valuation_id, member_id)
);

CREATE INDEX idx_profit_shares_valuation_id ON profit_shares (valuation_id);
CREATE INDEX idx_profit_shares_member_id ON profit_shares (member_id);
