-- V10: Add ipo_holdings as a distinct entity from stock holdings
CREATE TABLE ipo_holdings (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id),
    ipo_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    invested_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_ipo_holdings_group_id ON ipo_holdings(group_id);
