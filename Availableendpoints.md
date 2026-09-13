All available endpoints

Auth (/api/v1/auth) — no token required

POST /signup/create-group — {email, password, displayName, groupName}
POST /signup/join-group — {email, password, displayName, inviteCode}
POST /login — {email, password}

Contributions (/api/v1/contributions) — Bearer token required

POST / — {amount, type: DEPOSIT|WITHDRAWAL, note, contributedAt}
GET /me — your contribution history
GET /me/total — your running total (deposits, withdrawals, net)
GET /group/total — group running total

Trades (/api/v1/trades)

POST / — {symbol, tradeType: BUY|SELL, quantity, price, tradedAt, note}
GET / — all group trades
GET /{id} — one trade
PUT /{id} — update a trade
DELETE /{id} — delete a trade

Holdings (/api/v1/holdings) — read-only, derived from trades

GET / — all group holdings (symbol, quantity, avg cost)
GET /{symbol} — one holding

IPO Holdings (/api/v1/ipo-holdings)

POST / — {ipoName, amount, investedDate}
GET / — all group IPO holdings
PUT /{id} — update
DELETE /{id} — delete

Portfolio (/api/v1/portfolio)

GET /summary — totalContributed, stockHoldingsValue, ipoHoldingsValue, availableCash

Valuations (/api/v1/valuations) — new, Phase 5 Batch 2

POST / — {totalValue, snapshotAt} → triggers a snapshot + full per-member P&L breakdown
GET /latest — latest snapshot
GET /{id} — specific snapshot