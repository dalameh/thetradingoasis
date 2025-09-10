-- SUPABASE SQL SCHEMAS

-- Table to store users
CREATE TABLE users (
    -- unique user ID
    -- unique email
    -- timestamp of creation

    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Store user watchlist data
CREATE TABLE watchlist (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT watchlist_user_symbol_unique UNIQUE (user_id, ticker)
);

-- Index to speed up queries for a user’s watchlist
CREATE INDEX idx_watchlist_user_id
ON watchlist(user_id);


-- Table to store user-created trading setups
CREATE TABLE playbook_setups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rules TEXT[] NOT NULL,

  type TEXT NOT NULL,
  market TEXT NOT NULL,
  conditions TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Speed up queries like: SELECT * FROM playbook_setups WHERE user_id = '...'
CREATE INDEX idx_playbook_setups_user_id
ON playbook_setups(user_id);


create table if not exists sentiment_results (
  id text primary key,                       -- cryptographic id generated in FastAPI
  ticker text not null,                      -- stock ticker
  model_used text not null,                  -- sentiment model used
  headlines jsonb not null,                  -- array of input headlines
  items jsonb not null,                      -- structured items returned by model
  summary jsonb not null,                    -- sentiment summary
  created_at timestamptz default now()
);

-- Ensure that ticker + model_used is unique (only one record per pair)
create unique index if not exists sentiment_results_ticker_model_idx
on sentiment_results (ticker, model_used);


CREATE TABLE sp500_tickers (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR UNIQUE NOT NULL,
  company_name TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nd100_tickers (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR UNIQUE NOT NULL,
  company_name TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE djia_tickers (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR UNIQUE NOT NULL,
  company_name TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);