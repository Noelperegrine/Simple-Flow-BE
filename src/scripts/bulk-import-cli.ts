#!/usr/bin/env ts-node

import { BulkImporter, ImportConfig } from '../utils/bulk-import';
import path from 'path';

/**
 * Bulk Import CLI Tool
 * 
 * Usage Examples:
 * 
 * Import customers from JSON:
 * npm run bulk-import -- customers data/customers.json json
 * 
 * Import users from CSV with custom batch size:
 * npm run bulk-import -- users data/users.csv csv 500
 * 
 * Clear existing data and import:
 * npm run bulk-import -- customers data/customers.json json 1000 true
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('❌ Invalid arguments');
    console.log('\n📖 Usage:');
    console.log('npm run bulk-import -- <model> <file-path> <format> [batch-size] [clear-existing]');
    console.log('\nArguments:');
    console.log('  model         : customers | users | appconfigs | activitylogs');
    console.log('  file-path     : Path to your data file');
    console.log('  format        : json | csv');
    console.log('  batch-size    : Optional, default 1000');
    console.log('  clear-existing: Optional, true/false, default false');
    console.log('\n📝 Examples:');
    console.log('npm run bulk-import -- customers data/customers.json json');
    console.log('npm run bulk-import -- users data/users.csv csv 500');
    console.log('npm run bulk-import -- customers data/large-dataset.json json 2000 true');
    process.exit(1);
  }

  const [model, filePath, format, batchSizeStr, clearExistingStr] = args;
  
  // Validate model
  const validModels = ['customers', 'users', 'appconfigs', 'activitylogs'];
  if (!validModels.includes(model)) {
    console.error(`❌ Invalid model: ${model}`);
    console.log(`Valid models: ${validModels.join(', ')}`);
    process.exit(1);
  }

  // Validate format
  const validFormats = ['json', 'csv'];
  if (!validFormats.includes(format)) {
    console.error(`❌ Invalid format: ${format}`);
    console.log(`Valid formats: ${validFormats.join(', ')}`);
    process.exit(1);
  }

  // Parse optional arguments
  const batchSize = batchSizeStr ? parseInt(batchSizeStr) : 1000;
  const clearExisting = clearExistingStr === 'true';

  // Resolve file path (support both absolute and relative paths)
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  const config: ImportConfig = {
    model: model as any,
    filePath: resolvedPath,
    format: format as any,
    batchSize,
    clearExisting
  };

  console.log('🚀 BULK IMPORT STARTING');
  console.log('========================');
  console.log(`📊 Model: ${config.model}`);
  console.log(`📁 File: ${config.filePath}`);
  console.log(`📋 Format: ${config.format}`);
  console.log(`⚙️ Batch Size: ${config.batchSize}`);
  console.log(`🧹 Clear Existing: ${config.clearExisting}`);
  console.log('');

  try {
    const importer = new BulkImporter();
    const stats = await importer.import(config);
    
    if (stats.failedInserts > 0 || stats.skippedRecords > 0) {
      console.log('\n⚠️ Import completed with some issues. Check the error log above.');
      process.exit(1);
    } else {
      console.log('\n🎉 Import completed successfully!');
      process.exit(0);
    }
    
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Import interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Import terminated');
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}