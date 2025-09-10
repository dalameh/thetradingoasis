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

-- Table to store user-created trading setups
CREATE TABLE setups( 
    -- unique setup ID
    -- user_id as foreign key : linked to Supabase auth user
    -- setup name
    -- description of the setup
    -- array of trading rules
    -- timestamp of creation
    -- optional win rate percentage

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rules TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    win_rate NUMERIC
);

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