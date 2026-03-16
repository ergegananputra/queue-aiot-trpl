-- Add access_code column to computers table
alter table public.computers add column access_code text unique;

-- Optionally, fill with random codes for existing computers (example: 6 digit PIN)
-- update public.computers set access_code = lpad((floor(random()*1000000))::text, 6, '0') where access_code is null;
