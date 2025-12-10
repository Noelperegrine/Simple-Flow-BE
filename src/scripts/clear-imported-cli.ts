import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../utils/database';
import { ImportTracker } from '../utils/import-tracker';

// Load environment variables
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env' });

interface ClearOptions {
  models: string[];
  importType?: string;
  showSessions: boolean;
  confirmClear: boolean;
  dryRun: boolean;
}

async function parseArgs(): Promise<ClearOptions> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Usage: npm run clear-imported -- <models...> [options]');
    console.log('');
    console.log('🔧 Options:');
    console.log('   --type <import-type>    Only clear specific import type (bulk-import, manual, seed)');
    console.log('   --list                  List import sessions instead of clearing');
    console.log('   --dry-run               Show what would be deleted without actually deleting');
    console.log('   --force                 Skip confirmation prompt');
    console.log('');
    console.log('📊 Examples:');
    console.log('   npm run clear-imported -- customers users');
    console.log('   npm run clear-imported -- customers --type bulk-import');
    console.log('   npm run clear-imported -- --list');
    console.log('   npm run clear-imported -- customers --dry-run');
    process.exit(0);
  }

  const models: string[] = [];
  let importType: string | undefined;
  let showSessions = false;
  let confirmClear = true;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && i + 1 < args.length) {
      importType = args[++i];
    } else if (arg === '--list') {
      showSessions = true;
    } else if (arg === '--force') {
      confirmClear = false;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (!arg.startsWith('--')) {
      models.push(arg);
    }
  }

  return { models, importType, showSessions, confirmClear, dryRun };
}

async function getUserConfirmation(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${message} (y/N): `, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function clearImportedData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const options = await parseArgs();

    // Show import sessions
    if (options.showSessions) {
      console.log('\\n📋 IMPORT SESSIONS OVERVIEW');
      console.log('=' .repeat(50));
      
      if (options.models.length > 0) {
        for (const model of options.models) {
          await ImportTracker.listImportSessions(model);
        }
      } else {
        await ImportTracker.listImportSessions();
      }
      return;
    }

    if (options.models.length === 0) {
      console.log('❌ No models specified for clearing');
      process.exit(1);
    }

    console.log('\\n🗑️ SAFE IMPORT DATA CLEARING');
    console.log('=' .repeat(40));
    console.log('🎯 Models:', options.models.join(', '));
    if (options.importType) {
      console.log('📊 Import Type:', options.importType);
    }
    if (options.dryRun) {
      console.log('🏃 Mode: DRY RUN (no data will be deleted)');
    }

    // Process each model
    let totalDeleted = 0;
    let totalSessionsCleaned = 0;

    for (const model of options.models) {
      console.log(`\\n📊 Analyzing ${model.toUpperCase()} model...`);
      
      // Get imported IDs for this model
      const importedIds = await ImportTracker.getImportedIds(model, options.importType);
      
      if (importedIds.length === 0) {
        console.log(`ℹ️ No imported data found for ${model}`);
        continue;
      }

      console.log(`🔍 Found ${importedIds.length} imported records in ${model}`);
      
      if (options.dryRun) {
        console.log(`🏃 DRY RUN: Would delete ${importedIds.length} records from ${model}`);
        continue;
      }

      // Confirm deletion
      if (options.confirmClear) {
        const confirmMessage = `⚠️ Delete ${importedIds.length} imported records from ${model}?`;
        const confirmed = await getUserConfirmation(confirmMessage);
        
        if (!confirmed) {
          console.log(`⏭️ Skipping ${model}`);
          continue;
        }
      }

      // Clear the imported data
      console.log(`🗑️ Clearing imported data from ${model}...`);
      const result = await ImportTracker.clearImportedData(model, options.importType);
      
      console.log(`✅ Deleted ${result.deletedCount} records from ${model}`);
      console.log(`📋 Cleaned ${result.sessionsCleaned} import sessions`);
      
      totalDeleted += result.deletedCount;
      totalSessionsCleaned += result.sessionsCleaned;
    }

    console.log('\\n🎯 CLEARING COMPLETED');
    console.log('=' .repeat(30));
    console.log(`✅ Total records deleted: ${totalDeleted}`);
    console.log(`📋 Total sessions cleaned: ${totalSessionsCleaned}`);
    console.log('🔒 All genuine user data remains intact!');

  } catch (error: any) {
    console.error('❌ Clear operation failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the clear operation
clearImportedData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});