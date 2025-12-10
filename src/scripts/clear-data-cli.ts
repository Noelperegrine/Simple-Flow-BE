#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import path from 'path';
import { BulkImporter } from '../utils/bulk-import';
import connectDB from '../utils/database';
import { Customer, User, AppConfig, ActivityLog } from '../models/mongodb';

// Load environment variables (same pattern as bulk-import-cli.ts)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to .env if environment-specific file doesn't exist
dotenv.config();

/**
 * Data Cleanup Tool
 * 
 * Usage Examples:
 * 
 * Clear all customers:
 * npm run clear-data -- customers
 * 
 * Clear all data:
 * npm run clear-data -- all
 * 
 * Clear specific models:
 * npm run clear-data -- customers users
 */

interface ClearStats {
  model: string;
  deletedCount: number;
  error?: string;
}

async function clearData(models: string[]): Promise<ClearStats[]> {
  const results: ClearStats[] = [];
  
  try {
    await connectDB();
    
    for (const modelName of models) {
      console.log(`🧹 Clearing ${modelName} data...`);
      
      try {
        const model = getModel(modelName);
        const result = await model.deleteMany({});
        
        results.push({
          model: modelName,
          deletedCount: result.deletedCount || 0
        });
        
        console.log(`✅ Cleared ${result.deletedCount} ${modelName} records`);
        
      } catch (error: any) {
        console.error(`❌ Failed to clear ${modelName}:`, error.message);
        results.push({
          model: modelName,
          deletedCount: 0,
          error: error.message
        });
      }
    }
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
  }
  
  return results;
}

function getModel(modelName: string): any {
  switch (modelName) {
    case 'customers':
      return Customer;
    case 'users':
      return User;
    case 'appconfigs':
      return AppConfig;
    case 'activitylogs':
      return ActivityLog;
    default:
      throw new Error(`Unknown model: ${modelName}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ No models specified');
    console.log('\n📖 Usage:');
    console.log('npm run clear-data -- <model1> [model2] [model3]...');
    console.log('\nModels:');
    console.log('  customers    - Clear all customer data');
    console.log('  users        - Clear all user data');
    console.log('  appconfigs   - Clear app configuration data');
    console.log('  activitylogs - Clear activity logs');
    console.log('  all          - Clear ALL data (use with caution!)');
    console.log('\n📝 Examples:');
    console.log('npm run clear-data -- customers');
    console.log('npm run clear-data -- customers users');
    console.log('npm run clear-data -- all');
    console.log('\n⚠️  WARNING: This will permanently delete data!');
    process.exit(1);
  }

  // Handle 'all' command
  const modelsToClean = args.includes('all') 
    ? ['customers', 'users', 'appconfigs', 'activitylogs']
    : args;

  // Validate models
  const validModels = ['customers', 'users', 'appconfigs', 'activitylogs'];
  const invalidModels = modelsToClean.filter(m => !validModels.includes(m));
  
  if (invalidModels.length > 0) {
    console.error(`❌ Invalid models: ${invalidModels.join(', ')}`);
    console.log(`Valid models: ${validModels.join(', ')}`);
    process.exit(1);
  }

  // Show warning for destructive operations
  if (args.includes('all') || modelsToClean.length > 1) {
    console.log('⚠️  WARNING: You are about to delete data from multiple collections!');
    console.log(`📊 Models to clear: ${modelsToClean.join(', ')}`);
    console.log('');
  }

  console.log('🗑️  DATA CLEANUP STARTING');
  console.log('========================');
  
  try {
    const results = await clearData(modelsToClean);
    
    console.log('\n📊 CLEANUP COMPLETED!');
    console.log('=====================');
    
    let totalDeleted = 0;
    let errors = 0;
    
    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.model}: ${result.error}`);
        errors++;
      } else {
        console.log(`✅ ${result.model}: ${result.deletedCount} records deleted`);
        totalDeleted += result.deletedCount;
      }
    });
    
    console.log('');
    console.log(`🎯 Total Records Deleted: ${totalDeleted}`);
    
    if (errors > 0) {
      console.log(`⚠️ ${errors} error(s) occurred`);
      process.exit(1);
    } else {
      console.log('🎉 All cleanup operations completed successfully!');
      process.exit(0);
    }
    
  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Cleanup interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Cleanup terminated');
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}