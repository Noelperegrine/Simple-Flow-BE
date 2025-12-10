import dotenv from 'dotenv';
import connectDB from '../utils/database';
import { ImportTracker } from '../utils/import-tracker';

// Load environment variables
dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env' });

async function listImportSessions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\\n');

    const args = process.argv.slice(2);
    const model = args[0]; // Optional model filter

    if (model) {
      console.log(`📋 Import sessions for ${model.toUpperCase()}:`);
      await ImportTracker.listImportSessions(model);
    } else {
      console.log('📋 All import sessions:');
      await ImportTracker.listImportSessions();
    }

  } catch (error: any) {
    console.error('❌ Failed to list sessions:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

listImportSessions();