CREATE TABLE trades (
    id           BIGSERIAL PRIMARY KEY,
    group_id     BIGINT          NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    symbol       VARCHAR(20)     NOT NULL,
    trade_type   VARCHAR(10)     NOT NULL,
    quantity     NUMERIC(18, 6)  NOT NULL,
    price        NUMERIC(15, 4)  NOT NULL,
    traded_at    TIMESTAMP       NOT NULL,
    note         TEXT,
    created_at   TIMESTAMP       NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP       NOT NULL DEFAULT now(),
    CONSTRAINT chk_trade_type CHECK (trade_type IN ('BUY', 'SELL')),
    CONSTRAINT chk_trade_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_trade_price_positive CHECK (price > 0)
);

CREATE INDEX idx_trades_group_id ON trades (group_id);
CREATE INDEX idx_trades_symbol ON trades (symbol);
CREATE INDEX idx_trades_traded_at ON trades (traded_at);
