#!/usr/bin/env bun
/**
 * Script to update error messages to use status: 'error' instead of status: 'completed'
 */

import fs from 'fs';
import path from 'path';

function getAllToolFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllToolFiles(fullPath));
    } else if (item.isFile() && item.name.startsWith('tool') && item.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function updateErrorStatus() {
  const toolFiles = getAllToolFiles('src/app/_chats/tools');
  let updatedCount = 0;

  for (const filePath of toolFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip if no error handling with messageStreamWriter
    if (!content.includes('messageStreamWriter?.write') || !content.includes('if (error')) {
      continue;
    }

    let newContent = content;
    let hasChanges = false;

    // Pattern 1: Error handling with ResponseError
    // Replace status: 'completed' with status: 'error' in error blocks
    const responseErrorPattern = /(if \(error instanceof ResponseError\) \{[\s\S]*?messageStreamWriter\?\.write\(\{[\s\S]*?data: \{[\s\S]*?)status: 'completed'([\s\S]*?message: '[^']*'[\s\S]*?\}\);)/g;
    if (responseErrorPattern.test(content)) {
      newContent = newContent.replace(responseErrorPattern, "$1status: 'error'$2");
      hasChanges = true;
    }

    // Pattern 2: Generic error handling
    const genericErrorPattern = /(if \(error\) \{[\s\S]*?messageStreamWriter\?\.write\(\{[\s\S]*?data: \{[\s\S]*?)status: 'completed'([\s\S]*?message: `[^`]*`[\s\S]*?\}\);)/g;
    if (genericErrorPattern.test(content)) {
      newContent = newContent.replace(genericErrorPattern, "$1status: 'error'$2");
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✓ Updated ${path.basename(filePath)}`);
      updatedCount++;
    }
  }

  console.log(`\nUpdated ${updatedCount} tool files with error status!`);
}

updateErrorStatus().catch(console.error);
