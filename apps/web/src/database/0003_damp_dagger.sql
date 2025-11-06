CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX "embedding_idx" ON "documents" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "documents_name_trgm_idx" ON "documents" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "documents_summary_trgm_idx" ON "documents" USING gin ("summary" gin_trgm_ops);