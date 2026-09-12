-- Fix identity sequences after V8 seed data inserted explicit IDs.
-- IDENTITY columns do not auto-advance when explicit values are inserted directly via SQL.

SELECT setval(pg_get_serial_sequence('groups', 'id'), COALESCE((SELECT MAX(id) FROM groups), 1));
SELECT setval(pg_get_serial_sequence('members', 'id'), COALESCE((SELECT MAX(id) FROM members), 1));
SELECT setval(pg_get_serial_sequence('contributions', 'id'), COALESCE((SELECT MAX(id) FROM contributions), 1));
SELECT setval(pg_get_serial_sequence('holdings', 'id'), COALESCE((SELECT MAX(id) FROM holdings), 1));
SELECT setval(pg_get_serial_sequence('trades', 'id'), COALESCE((SELECT MAX(id) FROM trades), 1));
SELECT setval(pg_get_serial_sequence('valuations', 'id'), COALESCE((SELECT MAX(id) FROM valuations), 1));
SELECT setval(pg_get_serial_sequence('profit_shares', 'id'), COALESCE((SELECT MAX(id) FROM profit_shares), 1));
