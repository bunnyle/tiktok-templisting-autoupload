CREATE TABLE IF NOT EXISTS licenses (
  code TEXT PRIMARY KEY,
  plan TEXT NOT NULL,            -- 'monthly' | 'lifetime'
  max_dev INTEGER NOT NULL DEFAULT 10,
  days INTEGER,                  -- monthly: 授權天數（首次啟用才開始計時）
  started_at INTEGER,            -- 首次啟用時間 (ms)
  expires_at INTEGER,            -- NULL = 永久
  revoked INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
  code TEXT NOT NULL,
  dev TEXT NOT NULL,
  name TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (code, dev)
);
CREATE INDEX IF NOT EXISTS idx_dev_seen ON devices(code, last_seen);
