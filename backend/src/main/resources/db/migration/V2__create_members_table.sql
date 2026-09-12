CREATE TABLE members (
    id             BIGSERIAL PRIMARY KEY,
    group_id       BIGINT         NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    email          VARCHAR(255)   NOT NULL UNIQUE,
    password_hash  VARCHAR(255)   NOT NULL,
    display_name   VARCHAR(255)   NOT NULL,
    role           VARCHAR(20)    NOT NULL DEFAULT 'MEMBER',
    joined_at      TIMESTAMP      NOT NULL DEFAULT now(),
    created_at     TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT chk_member_role CHECK (role IN ('ADMIN', 'MEMBER'))
);

CREATE INDEX idx_members_group_id ON members (group_id);
