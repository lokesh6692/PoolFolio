CREATE TABLE holdings (
    id             BIGSERIAL PRIMARY KEY,
    group_id       BIGINT          NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    symbol         VARCHAR(20)     NOT NULL,
    quantity       NUMERIC(18, 6)  NOT NULL DEFAULT 0,
    average_cost   NUMERIC(15, 4)  NOT NULL DEFAULT 0,
    updated_at     TIMESTAMP       NOT NULL DEFAULT now(),
    created_at     TIMESTAMP       NOT NULL DEFAULT now(),
    CONSTRAINT uq_holdings_group_symbol UNIQUE (group_id, symbol)
);

CREATE INDEX idx_holdings_group_id ON holdings (group_id);
