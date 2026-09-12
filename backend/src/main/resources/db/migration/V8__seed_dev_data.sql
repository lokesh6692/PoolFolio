-- Sample data for local development only.
-- Password hash below is BCrypt for the plaintext "password123" (cost 10) — dev use only.

INSERT INTO groups (id, name, invite_code) VALUES
    (1, 'The Diamond Hands', 'DH-2024-001');

INSERT INTO members (id, group_id, email, password_hash, display_name, role, joined_at) VALUES
    (1, 1, 'alice@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa2s5W1jL2Hk9C6q6bBDdCS.G4A6b7Xu', 'Alice',   'ADMIN',  '2024-01-01 09:00:00'),
    (2, 1, 'bob@example.com',   '$2a$10$7EqJtq98hPqEX7fNZaFWoOa2s5W1jL2Hk9C6q6bBDdCS.G4A6b7Xu', 'Bob',     'MEMBER', '2024-01-01 09:00:00'),
    (3, 1, 'carol@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa2s5W1jL2Hk9C6q6bBDdCS.G4A6b7Xu', 'Carol',   'MEMBER', '2024-02-15 09:00:00');

INSERT INTO contributions (group_id, member_id, amount, type, note, contributed_at) VALUES
    (1, 1, 5000.00, 'DEPOSIT', 'Initial contribution', '2024-01-01 09:00:00'),
    (1, 2, 3000.00, 'DEPOSIT', 'Initial contribution', '2024-01-01 09:00:00'),
    (1, 3, 2000.00, 'DEPOSIT', 'Joined late',           '2024-02-15 09:00:00'),
    (1, 2, 500.00,  'WITHDRAWAL', 'Partial withdrawal', '2024-03-01 09:00:00');

INSERT INTO trades (group_id, symbol, trade_type, quantity, price, traded_at, note) VALUES
    (1, 'AAPL', 'BUY', 20, 185.00, '2024-01-05 10:00:00', 'Initial position'),
    (1, 'MSFT', 'BUY', 10, 400.00, '2024-01-10 10:00:00', 'Diversify'),
    (1, 'AAPL', 'BUY', 5,  190.00, '2024-02-20 10:00:00', 'Add on dip');

INSERT INTO holdings (group_id, symbol, quantity, average_cost) VALUES
    (1, 'AAPL', 25, 186.00),
    (1, 'MSFT', 10, 400.00);

INSERT INTO valuations (group_id, total_value, snapshot_at) VALUES
    (1, 9800.00, '2024-03-15 00:00:00');

INSERT INTO profit_shares (valuation_id, member_id, ownership_percentage, contributed_amount, current_value, profit_loss) VALUES
    (1, 1, 52.63, 5000.00, 5157.89, 157.89),
    (1, 2, 26.32, 2500.00, 2578.95, 78.95),
    (1, 3, 21.05, 2000.00, 2063.16, 63.16);
