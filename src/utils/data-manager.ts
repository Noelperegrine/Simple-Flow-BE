import connectDB from '../utils/database';
import { Customer, User, AppConfig, ActivityLog } from '../models/mongodb';

/**
 * Advanced data management utilities
 */

interface QueryOptions {
  dateRange?: { start: Date; end: Date };
  status?: string;
  plan?: string;
  email?: string;
  limit?: number;
}

class DataManager {
  constructor() {}

  /**
   * Clear data with advanced filtering
   */
  async clearDataWithFilter(modelName: string, filter: any = {}): Promise<number> {
    try {
      await connectDB();
      const model = this.getModel(modelName);
      const result = await model.deleteMany(filter);
      return result.deletedCount || 0;
    } catch (error: any) {
      throw new Error(`Failed to clear ${modelName}: ${error.message}`);
    }
  }

  /**
   * Clear customers by specific criteria
   */
  async clearCustomers(options: QueryOptions = {}): Promise<number> {
    const filter: any = {};
    
    if (options.status) {
      filter.status = options.status;
    }
    
    if (options.plan) {
      filter.plan = options.plan;
    }
    
    if (options.email) {
      filter.email = { $regex: options.email, $options: 'i' };
    }
    
    if (options.dateRange) {
      filter.createdAt = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      };
    }

    console.log(`🧹 Clearing customers with filter:`, filter);
    return await this.clearDataWithFilter('customers', filter);
  }

  /**
   * Clear users by role
   */
  async clearUsersByRole(role: 'admin' | 'user'): Promise<number> {
    console.log(`🧹 Clearing users with role: ${role}`);
    return await this.clearDataWithFilter('users', { role });
  }

  /**
   * Clear activity logs older than specified days
   */
  async clearOldActivityLogs(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`🧹 Clearing activity logs older than ${daysOld} days (before ${cutoffDate.toISOString()})`);
    return await this.clearDataWithFilter('activitylogs', {
      timestamp: { $lt: cutoffDate }
    });
  }

  /**
   * Get data counts before clearing
   */
  async getDataCounts(): Promise<Record<string, number>> {
    try {
      await connectDB();
      
      const counts = {
        customers: await Customer.countDocuments(),
        users: await User.countDocuments(),
        appconfigs: await AppConfig.countDocuments(),
        activitylogs: await ActivityLog.countDocuments()
      };
      
      return counts;
    } catch (error: any) {
      throw new Error(`Failed to get data counts: ${error.message}`);
    }
  }

  /**
   * Backup data before clearing (export to JSON)
   */
  async backupData(modelName: string, filePath: string): Promise<number> {
    try {
      await connectDB();
      const model = this.getModel(modelName);
      const data = await model.find({}).lean();
      
      const fs = await import('fs');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      console.log(`💾 Backed up ${data.length} ${modelName} records to ${filePath}`);
      return data.length;
    } catch (error: any) {
      throw new Error(`Failed to backup ${modelName}: ${error.message}`);
    }
  }

  /**
   * Clear data with automatic backup
   */
  async clearDataWithBackup(modelName: string, filter: any = {}): Promise<{ deleted: number; backupFile?: string }> {
    try {
      // Create backup first
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup/${modelName}-backup-${timestamp}.json`;
      
      // Ensure backup directory exists
      const fs = await import('fs');
      const path = await import('path');
      
      const backupDir = path.dirname(backupFile);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      await this.backupData(modelName, backupFile);
      
      // Now clear the data
      const deletedCount = await this.clearDataWithFilter(modelName, filter);
      
      return {
        deleted: deletedCount,
        backupFile: backupFile
      };
    } catch (error: any) {
      throw new Error(`Failed to clear with backup: ${error.message}`);
    }
  }

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
}

export { DataManager, QueryOptions };