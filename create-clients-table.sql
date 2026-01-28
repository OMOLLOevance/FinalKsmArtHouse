CREATE TABLE clients (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  account_manager TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  number_of_parks INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  type_of_events TEXT NOT NULL,
  status TEXT
);
