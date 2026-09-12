CREATE TABLE groups (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255)   NOT NULL,
    invite_code   VARCHAR(20)    NOT NULL UNIQUE,
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_invite_code ON groups (invite_code);
