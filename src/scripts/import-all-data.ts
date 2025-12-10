import { BulkImporter } from '../utils/bulk-import';

/**
 * Example script for importing multiple data files
 * Customize this script for your specific data setup
 */

async function importAllData() {
  const importer = new BulkImporter(2000); // Larger batch size for better performance

  try {
    console.log('🚀 Starting complete data import...\n');

    // Import customers
    console.log('👥 IMPORTING CUSTOMERS');
    console.log('=====================');
    await importer.import({
      model: 'customers',
      filePath: 'data/customers.json', // Adjust path to your file
      format: 'json',
      clearExisting: true,
      batchSize: 2000
    });

    console.log('\n');

    // Import users
    console.log('👤 IMPORTING USERS');
    console.log('==================');
    await importer.import({
      model: 'users',
      filePath: 'data/users.csv', // Adjust path to your file
      format: 'csv',
      clearExisting: true,
      batchSize: 1000
    });

    console.log('\n');

    // Import activity logs (if you have them)
    console.log('📊 IMPORTING ACTIVITY LOGS');
    console.log('===========================');
    await importer.import({
      model: 'activitylogs',
      filePath: 'data/activity-logs.json', // Adjust path to your file
      format: 'json',
      clearExisting: true,
      batchSize: 5000 // Logs can be imported in larger batches
    });

    console.log('\n🎉 ALL DATA IMPORTED SUCCESSFULLY!');

  } catch (error: any) {
    console.error('\n❌ Data import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importAllData();
}