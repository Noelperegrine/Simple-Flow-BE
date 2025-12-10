import { BulkImporter, ImportConfig } from '../utils/bulk-import';
import path from 'path';

async function simpleParallelImport() {
  try {
    console.log('🚀 FAST ACTIVITY LOG IMPORT');
    console.log('===========================');
    
    const config: ImportConfig = {
      model: 'activitylogs' as any,
      filePath: path.resolve(process.cwd(), 'data/activity_logs_5years.csv'),
      format: 'csv' as any,
      batchSize: 25000, // Larger batch size for speed
      clearExisting: false
    };

    console.log('📁 File:', config.filePath);
    console.log('⚙️ Batch Size:', config.batchSize);
    console.log('🏃 Starting import...\n');

    const importer = new BulkImporter();
    const stats = await importer.import(config);
    
    if (stats.failedInserts > 0 || stats.skippedRecords > 0) {
      console.log('\n⚠️ Import completed with some issues.');
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

if (require.main === module) {
  simpleParallelImport().catch(console.error);
}