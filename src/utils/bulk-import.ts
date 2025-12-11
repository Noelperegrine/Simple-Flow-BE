import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import connectDB from './database';
import { Customer, User, AppConfig, ActivityLog } from '../models/mongodb';
import { ImportTracker } from './import-tracker';

// Load environment variables based on NODE_ENV only
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
}
// Load base .env for common variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface ImportConfig {
  model: 'customers' | 'users' | 'appconfigs' | 'activitylogs';
  filePath: string;
  format: 'json' | 'csv';
  batchSize?: number;
  clearExisting?: boolean;
  validateData?: boolean;
}

interface ImportStats {
  totalRecords: number;
  successfulInserts: number;
  failedInserts: number;
  skippedRecords: number;
  errors: Array<{ record: number; error: string; data?: any }>;
  startTime: Date;
  endTime?: Date;
  duration?: string;
}

class BulkImporter {
  private stats: ImportStats;
  private batchSize: number;
  private tracker?: ImportTracker;

  constructor(batchSize: number = 1000) {
    this.batchSize = batchSize;
    this.stats = {
      totalRecords: 0,
      successfulInserts: 0,
      failedInserts: 0,
      skippedRecords: 0,
      errors: [],
      startTime: new Date()
    };
  }

  /**
   * Main import function
   */
  async import(config: ImportConfig): Promise<ImportStats> {
    try {
      console.log(`🚀 Starting bulk import for ${config.model}`);
      console.log(`📁 File: ${config.filePath}`);
      console.log(`📊 Format: ${config.format}`);
      console.log(`⚙️ Batch size: ${config.batchSize || this.batchSize}`);
      
      // Initialize import tracker
      const fileName = path.basename(config.filePath);
      this.tracker = new ImportTracker(config.model, 'bulk-import', fileName, `Bulk import from ${fileName}`);
      console.log(`📋 Import session: ${this.tracker.getSessionInfo().sessionId}`);
      
      // Connect to database
      await connectDB();

      // Clear existing data if requested
      if (config.clearExisting) {
        await this.clearExistingData(config.model);
      }

      // Load and process data based on format
      const data = await this.loadData(config);
      
      // Process in batches
      await this.processBatches(data, config);

      // Finalize stats
      this.stats.endTime = new Date();
      this.stats.duration = this.calculateDuration();

      // Save import session for tracking
      if (this.tracker) {
        const status = this.stats.failedInserts > 0 ? 
          (this.stats.successfulInserts > 0 ? 'partial' : 'failed') : 'completed';
        await this.tracker.saveSession(status);
      }

      this.printFinalStats();
      return this.stats;

    } catch (error: any) {
      console.error('❌ Bulk import failed:', error);
      throw error;
    }
  }

  /**
   * Load data from file based on format
   */
  private async loadData(config: ImportConfig): Promise<any[]> {
    if (!fs.existsSync(config.filePath)) {
      throw new Error(`File not found: ${config.filePath}`);
    }

    console.log('📖 Loading data from file...');

    if (config.format === 'json') {
      return this.loadJSONData(config.filePath);
    } else {
      return this.loadCSVData(config.filePath);
    }
  }

  /**
   * Load JSON data
   */
  private async loadJSONData(filePath: string): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle both array and object with array property
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      throw new Error('JSON file must contain an array or an object with a "data" array property');
    }
  }

  /**
   * Load CSV data using Node.js built-in readline
   */
  private async loadCSVData(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let headers: string[] = [];
      let isFirstLine = true;

      rl.on('line', (line: string) => {
        const values = this.parseCSVLine(line);
        
        if (isFirstLine) {
          headers = values;
          isFirstLine = false;
          return;
        }

        const record: any = {};
        headers.forEach((header, index) => {
          record[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        results.push(record);
      });

      rl.on('close', () => resolve(results));
      rl.on('error', reject);
    });
  }

  /**
   * Simple CSV line parser
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Process data in batches
   */
  private async processBatches(data: any[], config: ImportConfig): Promise<void> {
    this.stats.totalRecords = data.length;
    const batchSize = config.batchSize || this.batchSize;
    
    console.log(`📊 Processing ${data.length} records in batches of ${batchSize}`);

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(data.length / batchSize);
      
      console.log(`⚙️ Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`);
      
      await this.processBatch(batch, config, i);
      
      // Progress update
      const progress = ((i + batch.length) / data.length * 100).toFixed(1);
      console.log(`📈 Progress: ${progress}% (${i + batch.length}/${data.length})`);
    }
  }

  /**
   * Process a single batch
   */
  private async processBatch(batch: any[], config: ImportConfig, startIndex: number): Promise<void> {
    try {
      // Validate and transform data
      const validatedBatch = batch.map((record, index) => {
        try {
          return this.validateAndTransformRecord(record, config.model);
        } catch (error: any) {
          this.stats.errors.push({
            record: startIndex + index + 1,
            error: error.message,
            data: record
          });
          this.stats.skippedRecords++;
          return null;
        }
      }).filter(record => record !== null);

      if (validatedBatch.length === 0) {
        console.log('⚠️ No valid records in this batch, skipping...');
        return;
      }

      // Insert batch into database
      const model = this.getModel(config.model);
      const result = await model.insertMany(validatedBatch, { 
        ordered: false, // Continue on individual errors
        maxTimeMS: 30000 // 30 second timeout
      });

      // Track the inserted record IDs
      if (this.tracker && result.length > 0) {
        const insertedIds = result.map((doc: any) => doc._id.toString());
        this.tracker.trackRecords(insertedIds);
      }

      this.stats.successfulInserts += result.length;
      console.log(`✅ Successfully inserted ${result.length} records`);

    } catch (error: any) {
      console.error(`❌ Batch insert failed:`, error.message);
      
      // If bulk insert fails, try individual inserts
      await this.fallbackIndividualInsert(batch, config, startIndex);
    }
  }

  /**
   * Fallback to individual inserts if batch fails
   */
  private async fallbackIndividualInsert(batch: any[], config: ImportConfig, startIndex: number): Promise<void> {
    console.log('🔄 Falling back to individual record insertion...');
    
    const model = this.getModel(config.model);
    
    for (let i = 0; i < batch.length; i++) {
      try {
        const validatedRecord = this.validateAndTransformRecord(batch[i], config.model);
        const savedDoc = await model.create(validatedRecord);
        
        // Track the individual record ID
        if (this.tracker) {
          this.tracker.trackRecord(savedDoc._id.toString());
        }
        
        this.stats.successfulInserts++;
      } catch (error: any) {
        this.stats.errors.push({
          record: startIndex + i + 1,
          error: error.message,
          data: batch[i]
        });
        this.stats.failedInserts++;
      }
    }
  }

  /**
   * Validate and transform record based on model
   */
  private validateAndTransformRecord(record: any, model: string): any {
    switch (model) {
      case 'customers':
        return this.validateCustomerRecord(record);
      case 'users':
        return this.validateUserRecord(record);
      case 'appconfigs':
        return this.validateAppConfigRecord(record);
      case 'activitylogs':
        return this.validateActivityLogRecord(record);
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  /**
   * Validate customer record
   */
  private validateCustomerRecord(record: any): any {
    if (!record.name || !record.email) {
      throw new Error('Customer must have name and email');
    }

    const validStatuses = ['active', 'at_risk', 'churned'];
    if (record.status && !validStatuses.includes(record.status)) {
      throw new Error(`Invalid status: ${record.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      name: record.name,
      email: record.email,
      status: record.status || 'active',
      health_score: parseInt(record.health_score) || 0,
      mrr: parseFloat(record.mrr) || 0,
      plan: record.plan || 'Starter',
      churn_date: record.churn_date ? new Date(record.churn_date) : null,
      feature_usage: {
        scheduling_appointments: parseInt(record.scheduling_appointments) || 0,
        telehealth_sessions: parseInt(record.telehealth_sessions) || 0,
        notes_created: parseInt(record.notes_created) || 0,
        billing_transactions: parseInt(record.billing_transactions) || 0,
        insurance_claims: parseInt(record.insurance_claims) || 0,
        claims_filed: parseInt(record.claims_filed || record.insurance_claims) || 0,
        client_portal_logins: parseInt(record.client_portal_logins) || 0,
        measurement_assessments: parseInt(record.measurement_assessments) || 0,
        treatment_plans: parseInt(record.treatment_plans) || 0
      }
    };
  }

  /**
   * Validate user record
   */
  private validateUserRecord(record: any): any {
    if (!record.email || !record.full_name) {
      throw new Error('User must have email and full_name');
    }

    const validRoles = ['admin', 'user'];
    if (record.role && !validRoles.includes(record.role)) {
      throw new Error(`Invalid role: ${record.role}. Must be one of: ${validRoles.join(', ')}`);
    }

    return {
      email: record.email,
      full_name: record.full_name,
      role: record.role || 'user'
    };
  }

  /**
   * Validate app config record
   */
  private validateAppConfigRecord(record: any): any {
    if (!record.app_id) {
      throw new Error('App config must have app_id');
    }

    return {
      app_id: record.app_id,
      public_settings: {
        app_name: record.app_name || 'Practice Flow',
        features_enabled: record.features_enabled || {},
        theme: record.theme || {}
      }
    };
  }

  /**
   * Validate activity log record
   */
  private validateActivityLogRecord(record: any): any {
    if (!record.user_id || !record.page_name) {
      throw new Error('Activity log must have user_id and page_name');
    }

    return {
      user_id: record.user_id,
      page_name: record.page_name,
      timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
      ip_address: record.ip_address || null,
      user_agent: record.user_agent || null
    };
  }

  /**
   * Get Mongoose model
   */
  private getModel(modelName: string): any {
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

  /**
   * Clear existing data
   */
  private async clearExistingData(model: string): Promise<void> {
    console.log(`🧹 Clearing existing ${model} data...`);
    
    const mongooseModel = this.getModel(model);
    const result = await mongooseModel.deleteMany({});
    
    console.log(`✅ Cleared ${result.deletedCount} existing records`);
  }

  /**
   * Calculate duration
   */
  private calculateDuration(): string {
    if (!this.stats.endTime) return 'Unknown';
    
    const durationMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Print final statistics
   */
  private printFinalStats(): void {
    console.log('\n📊 IMPORT COMPLETED!');
    console.log('================================');
    console.log(`⏱️ Duration: ${this.stats.duration}`);
    console.log(`📊 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulInserts}`);
    console.log(`❌ Failed: ${this.stats.failedInserts}`);
    console.log(`⚠️ Skipped: ${this.stats.skippedRecords}`);
    console.log(`🎯 Success Rate: ${(this.stats.successfulInserts / this.stats.totalRecords * 100).toFixed(1)}%`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.slice(0, 10).forEach(error => {
        console.log(`   Record ${error.record}: ${error.error}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
  }
}

export { BulkImporter, ImportConfig, ImportStats };