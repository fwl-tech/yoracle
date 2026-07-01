SET search_path TO yoracle;

-- Clerk removed in favour of a simple email/password login (see lib/simple-auth.ts).
-- `clerk_user_id` is retained as the generic external-auth identifier and now
-- holds the user's email address instead of a Clerk user id.
ALTER TABLE users ADD COLUMN password_hash TEXT;
