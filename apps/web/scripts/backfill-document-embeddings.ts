#!/usr/bin/env bun
/**
 * Backfill embeddings for documents that have null embedding vectors
 *
 * Usage: bun run apps/web/scripts/backfill-document-embeddings.ts [--dry-run]
 * [--batch-size=10]
 *
 * Options: --dry-run: Show what would be updated without making changes
 * --batch-size: Number of documents to process in each batch (default: 10)
 */

import { eq } from 'drizzle-orm';

import db from '../src/database/client';
import { documents } from '../src/database/schema';
import { generateEmbedding } from '../src/lib/embeddings/generateEmbedding';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find((arg) => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;

async function backfillDocumentEmbeddings() {
  console.log('🚀 Starting document embeddings backfill');
  console.log(`   Mode: ${isDryRun ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log('');

  // Get all documents with null embeddings
  const documentsWithNullEmbeddings = await db.query.documents.findMany({
    where: {
      embedding: {
        isNull: true
      }
    },
    columns: {
      id: true,
      name: true,
      summary: true,
      tags: true,
      type: true,
      status: true
    }
  });

  console.log(
    `📊 Found ${documentsWithNullEmbeddings.length} documents with null embeddings`
  );

  if (documentsWithNullEmbeddings.length === 0) {
    console.log('✅ All documents already have embeddings!');
    return;
  }

  if (isDryRun) {
    console.log('\n📋 Documents that would be updated:');
    documentsWithNullEmbeddings.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name} (${doc.id})`);
      console.log(`      Type: ${doc.type}, Status: ${doc.status}`);
      console.log(`      Summary: ${doc.summary?.substring(0, 100)}...`);
      console.log(`      Tags: ${doc.tags.join(', ')}`);
      console.log('');
    });
    console.log('🔍 Dry run completed - no changes made');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{
    documentId: string;
    documentName: string;
    error: string;
  }> = [];

  // Process documents in batches
  for (let i = 0; i < documentsWithNullEmbeddings.length; i += batchSize) {
    const batch = documentsWithNullEmbeddings.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(
      documentsWithNullEmbeddings.length / batchSize
    );

    console.log(
      `\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} documents)`
    );

    for (const doc of batch) {
      try {
        // Skip if no summary or tags (cannot generate embedding)
        if (!doc.summary || doc.tags.length === 0) {
          console.log(`   ⚠️  Skipping ${doc.name}: Missing summary or tags`);
          errorCount++;
          errors.push({
            documentId: doc.id,
            documentName: doc.name,
            error: 'Missing summary or tags'
          });
          continue;
        }

        // Generate embedding from summary and tags (same as ingest-document-job)
        const embeddingText = `${doc.summary} ${doc.tags.join(' ')}`;
        console.log(`   🔄 Generating embedding for: ${doc.name}`);

        const embedding = await generateEmbedding(embeddingText);

        // Update document with embedding
        await db
          .update(documents)
          .set({ embedding })
          .where(eq(documents.id, doc.id));

        successCount++;
        console.log(
          `   ✅ Updated ${doc.name} (${embedding.length} dimensions)`
        );
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error processing ${doc.name}: ${errorMessage}`);
        errors.push({
          documentId: doc.id,
          documentName: doc.name,
          error: errorMessage
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 Backfill Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${documentsWithNullEmbeddings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.documentName} (${err.documentId})`);
      console.log(`      Error: ${err.error}`);
    });
  }

  console.log('\n✨ Backfill completed!');
}

// Run the script
backfillDocumentEmbeddings()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
