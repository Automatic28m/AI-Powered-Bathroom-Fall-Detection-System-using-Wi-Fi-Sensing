-- 0003: two indexes found in the M2 schema review.

-- ai-service asks "who watches this bathroom?" on every fall. The primary key
-- (account_id, bathroom_id) starts with account_id, so it can't serve that query.
CREATE INDEX "bathroom_watchers_bathroom_id_idx" ON "bathroom_watchers"("bathroom_id");

-- At most one current baseline per bathroom (WA-9, WA-12). Prisma can't express
-- a partial unique index, so it lives only in this SQL.
CREATE UNIQUE INDEX "baselines_one_current_per_bathroom"
    ON "baselines"("bathroom_id")
    WHERE "is_current";
