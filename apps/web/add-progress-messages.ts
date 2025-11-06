#!/usr/bin/env bun
/**
 * Script to add progress messages to all remaining tools
 * This automates the pattern of adding UIMessageStreamWriter to tool functions
 */

import fs from 'fs';
import path from 'path';

// Tool name to Dutch translation mapping
const translations: Record<string, { in_progress: string; completed: string; error: string }> = {
  // Submissions
  'toolShowSubmission': {
    in_progress: 'Inzending ophalen...',
    completed: 'Inzending opgehaald',
    error: 'Fout bij ophalen van inzending'
  },
  'toolCreateSubmission': {
    in_progress: 'Inzending aanmaken...',
    completed: 'Inzending aangemaakt',
    error: 'Fout bij aanmaken van inzending'
  },
  'toolUpdateSubmission': {
    in_progress: 'Inzending bijwerken...',
    completed: 'Inzending bijgewerkt',
    error: 'Fout bij bijwerken van inzending'
  },
  'toolDeleteSubmission': {
    in_progress: 'Inzending verwijderen...',
    completed: 'Inzending verwijderd',
    error: 'Fout bij verwijderen van inzending'
  },
  'toolPrepareSubmission': {
    in_progress: 'Inzending voorbereiden...',
    completed: 'Inzending voorbereid',
    error: 'Fout bij voorbereiden van inzending'
  },
  'toolListSubmissionMedia': {
    in_progress: 'Inzendingsmedia ophalen...',
    completed: 'Inzendingsmedia opgehaald',
    error: 'Fout bij ophalen van inzendingsmedia'
  },
  'toolShowSubmissionMedia': {
    in_progress: 'Inzendingsmedium ophalen...',
    completed: 'Inzendingsmedium opgehaald',
    error: 'Fout bij ophalen van inzendingsmedium'
  },
  'toolUploadSubmissionMedia': {
    in_progress: 'Inzendingsmedium uploaden...',
    completed: 'Inzendingsmedium geüpload',
    error: 'Fout bij uploaden van inzendingsmedium'
  },
  // Planning
  'toolGetPlanningProject': {
    in_progress: 'Planningsproject ophalen...',
    completed: 'Planningsproject opgehaald',
    error: 'Fout bij ophalen van planningsproject'
  },
  'toolGetPlanningProjects': {
    in_progress: 'Planningsprojecten ophalen...',
    completed: 'Planningsprojecten opgehaald',
    error: 'Fout bij ophalen van planningsprojecten'
  },
  'toolCreatePlanningProject': {
    in_progress: 'Planningsproject aanmaken...',
    completed: 'Planningsproject aangemaakt',
    error: 'Fout bij aanmaken van planningsproject'
  },
  'toolUpdatePlanningProject': {
    in_progress: 'Planningsproject bijwerken...',
    completed: 'Planningsproject bijgewerkt',
    error: 'Fout bij bijwerken van planningsproject'
  },
  'toolGetPlanningPhase': {
    in_progress: 'Planningsfase ophalen...',
    completed: 'Planningsfase opgehaald',
    error: 'Fout bij ophalen van planningsfase'
  },
  'toolGetPlanningPhases': {
    in_progress: 'Planningsfases ophalen...',
    completed: 'Planningsfases opgehaald',
    error: 'Fout bij ophalen van planningsfases'
  },
  'toolCreatePlanningPhase': {
    in_progress: 'Planningsfase aanmaken...',
    completed: 'Planningsfase aangemaakt',
    error: 'Fout bij aanmaken van planningsfase'
  },
  'toolUpdatePlanningPhase': {
    in_progress: 'Planningsfase bijwerken...',
    completed: 'Planningsfase bijgewerkt',
    error: 'Fout bij bijwerken van planningsfase'
  },
  // Resources
  'toolGetResources': {
    in_progress: 'Middelen ophalen...',
    completed: 'Middelen opgehaald',
    error: 'Fout bij ophalen van middelen'
  },
  'toolGetResourceGroups': {
    in_progress: 'Middelengroepen ophalen...',
    completed: 'Middelengroepen opgehaald',
    error: 'Fout bij ophalen van middelengroepen'
  },
  'toolGetProjectsOfResource': {
    in_progress: 'Projecten van middel ophalen...',
    completed: 'Projecten van middel opgehaald',
    error: 'Fout bij ophalen van projecten van middel'
  },
  'toolGetDataSources': {
    in_progress: 'Gegevensbronnen ophalen...',
    completed: 'Gegevensbronnen opgehaald',
    error: 'Fout bij ophalen van gegevensbronnen'
  },
  // Allocations
  'toolCreateMultipleAllocations': {
    in_progress: 'Toewijzingen aanmaken...',
    completed: 'Toewijzingen aangemaakt',
    error: 'Fout bij aanmaken van toewijzingen'
  },
  'toolUpdateMultipleAllocations': {
    in_progress: 'Toewijzingen bijwerken...',
    completed: 'Toewijzingen bijgewerkt',
    error: 'Fout bij bijwerken van toewijzingen'
  },
  'toolDeleteAllocation': {
    in_progress: 'Toewijzing verwijderen...',
    completed: 'Toewijzing verwijderd',
    error: 'Fout bij verwijderen van toewijzing'
  },
  // Charts
  'toolCreateBarChart': {
    in_progress: 'Staafdiagram genereren...',
    completed: 'Staafdiagram gegenereerd',
    error: 'Fout bij genereren van staafdiagram'
  },
  'toolCreateLineChart': {
    in_progress: 'Lijndiagram genereren...',
    completed: 'Lijndiagram gegenereerd',
    error: 'Fout bij genereren van lijndiagram'
  },
  'toolCreatePieChart': {
    in_progress: 'Cirkeldiagram genereren...',
    completed: 'Cirkeldiagram gegenereerd',
    error: 'Fout bij genereren van cirkeldiagram'
  },
  'toolCreateStackedBarChart': {
    in_progress: 'Gestapeld staafdiagram genereren...',
    completed: 'Gestapeld staafdiagram gegenereerd',
    error: 'Fout bij genereren van gestapeld staafdiagram'
  },
  // Core
  'toolCreateMemory': {
    in_progress: 'Geheugen aanmaken...',
    completed: 'Geheugen aangemaakt',
    error: 'Fout bij aanmaken van geheugen'
  },
  'toolDeleteMemory': {
    in_progress: 'Geheugen verwijderen...',
    completed: 'Geheugen verwijderd',
    error: 'Fout bij verwijderen van geheugen'
  },
  'toolChangeRole': {
    in_progress: 'Rol wisselen...',
    completed: 'Rol gewisseld',
    error: 'Fout bij wisselen van rol'
  },
  'toolClearChat': {
    in_progress: 'Chat wissen...',
    completed: 'Chat gewist',
    error: 'Fout bij wissen van chat'
  },
  // Multiple choice
  'toolCreateMultipleChoice': {
    in_progress: 'Meerkeuzevraag aanmaken...',
    completed: 'Meerkeuzevraag aangemaakt',
    error: 'Fout bij aanmaken van meerkeuzevraag'
  },
  'toolAnswerMultipleChoice': {
    in_progress: 'Meerkeuzevraag beantwoorden...',
    completed: 'Meerkeuzevraag beantwoord',
    error: 'Fout bij beantwoorden van meerkeuzevraag'
  },
  // PQI Audits
  'toolGetPQIAuditSubmissions': {
    in_progress: 'PQI-auditinzendingen ophalen...',
    completed: 'PQI-auditinzendingen opgehaald',
    error: 'Fout bij ophalen van PQI-auditinzendingen'
  },
  'toolGetPQIAuditTrends': {
    in_progress: 'PQI-audittrends ophalen...',
    completed: 'PQI-audittrends opgehaald',
    error: 'Fout bij ophalen van PQI-audittrends'
  },
  'toolGetPQIAuditObservations': {
    in_progress: 'PQI-auditwaarnemingen ophalen...',
    completed: 'PQI-auditwaarnemingen opgehaald',
    error: 'Fout bij ophalen van PQI-auditwaarnemingen'
  },
  'toolGetPQIAuditVehicleRanking': {
    in_progress: 'PQI-voertuigrangschikking ophalen...',
    completed: 'PQI-voertuigrangschikking opgehaald',
    error: 'Fout bij ophalen van PQI-voertuigrangschikking'
  }
};

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

async function addProgressMessages() {
  const toolFiles = getAllToolFiles('src/app/_chats/tools');

  for (const filePath of toolFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already has UIMessageStreamWriter
    if (content.includes('UIMessageStreamWriter')) {
      console.log(`✓ Skipping ${path.basename(filePath)} - already updated`);
      continue;
    }

    const toolName = path.basename(filePath, '.ts');
    const translation = translations[toolName];

    if (!translation) {
      console.log(`⚠ Skipping ${toolName} - no translation found`);
      continue;
    }

    console.log(`Processing ${toolName}...`);

    let newContent = content;

    // Add imports
    newContent = newContent.replace(
      /import { tool } from 'ai';/,
      `import { tool, UIMessageStreamWriter } from 'ai';`
    );

    newContent = newContent.replace(
      /import { ResponseError } from '@\/lib\/easylog\/generated-client';/,
      `import { ResponseError } from '@/lib/easylog/generated-client';\nimport { v4 as uuidv4 } from 'uuid';`
    );

    // Add parameter to function
    newContent = newContent.replace(
      new RegExp(`const ${toolName} = \\(userId: string\\) => {`, 'g'),
      `const ${toolName} = (\n  userId: string,\n  messageStreamWriter?: UIMessageStreamWriter\n) => {`
    );

    // Add progress message at start of execute
    newContent = newContent.replace(
      /execute: async \((.*?)\) => {/,
      `execute: async ($1) => {\n      const id = uuidv4();\n\n      messageStreamWriter?.write({\n        type: 'data-executing-tool',\n        id,\n        data: {\n          status: 'in_progress',\n          message: '${translation.in_progress}'\n        }\n      });`
    );

    // Add error handling for ResponseError
    newContent = newContent.replace(
      /if \(error instanceof ResponseError\) {\s*Sentry\.captureException\(error\);/,
      `if (error instanceof ResponseError) {\n        Sentry.captureException(error);\n        messageStreamWriter?.write({\n          type: 'data-executing-tool',\n          id,\n          data: {\n            status: 'completed',\n            message: '${translation.error}'\n          }\n        });`
    );

    // Add error handling for general errors
    newContent = newContent.replace(
      /if \(error\) {\s*Sentry\.captureException\(error\);/,
      `if (error) {\n        Sentry.captureException(error);\n        messageStreamWriter?.write({\n          type: 'data-executing-tool',\n          id,\n          data: {\n            status: 'completed',\n            message: \`${translation.error}: \${error.message}\`\n          }\n        });`
    );

    // Add completion message before final return
    const returnMatch = content.match(/return JSON\.stringify\(/);
    if (returnMatch) {
      newContent = newContent.replace(
        /return JSON\.stringify\(/,
        `messageStreamWriter?.write({\n        type: 'data-executing-tool',\n        id,\n        data: {\n          status: 'completed',\n          message: '${translation.completed}'\n        }\n      });\n\n      return JSON.stringify(`
      );
    }

    fs.writeFileSync(filePath, newContent);
    console.log(`✓ Updated ${toolName}`);
  }

  console.log('\nAll tools updated successfully!');
}

addProgressMessages().catch(console.error);
