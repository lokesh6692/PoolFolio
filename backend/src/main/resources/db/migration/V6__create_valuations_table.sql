CREATE TABLE valuations (
    id             BIGSERIAL PRIMARY KEY,
    group_id       BIGINT          NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    total_value    NUMERIC(18, 2)  NOT NULL,
    snapshot_at    TIMESTAMP       NOT NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT now()
);

CREATE INDEX idx_valuations_group_id ON valuations (group_id);
CREATE INDEX idx_valuations_snapshot_at ON valuations (snapshot_at);
