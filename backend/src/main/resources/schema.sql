CREATE TABLE IF NOT EXISTS app_account (id VARCHAR(36) PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS app_identity (provider VARCHAR(20) NOT NULL, subject VARCHAR(255) NOT NULL, account_id VARCHAR(36) NOT NULL REFERENCES app_account(id), PRIMARY KEY(provider, subject));
CREATE TABLE IF NOT EXISTS student_link (student_number VARCHAR(9) PRIMARY KEY, account_id VARCHAR(36) NOT NULL UNIQUE REFERENCES app_account(id));
