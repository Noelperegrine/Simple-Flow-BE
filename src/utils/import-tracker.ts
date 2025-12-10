import mongoose, { Schema, Document } from 'mongoose';

// Import models to ensure they are registered
import '../models/mongodb';

// Import Session Interface
export interface IImportSession extends Document {
  sessionId: string;
  importType: 'bulk-import' | 'manual' | 'seed';
  modelName: string;
  fileName?: string;
  recordsImported: number;
  importedIds: string[];
  importDate: Date;
  description?: string;
  status: 'completed' | 'failed' | 'partial';
}

// Import Session Schema
const ImportSessionSchema = new Schema<IImportSession>({
  sessionId: { type: String, required: true, unique: true },
  importType: { 
    type: String, 
    required: true,
    enum: ['bulk-import', 'manual', 'seed'],
    default: 'bulk-import'
  },
  modelName: { type: String, required: true },
  fileName: { type: String },
  recordsImported: { type: Number, required: true, default: 0 },
  importedIds: [{ type: String, required: true }],
  importDate: { type: Date, default: Date.now },
  description: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: ['completed', 'failed', 'partial'],
    default: 'completed'
  }
}, {
  timestamps: true
});

export const ImportSession = mongoose.model<IImportSession>('ImportSession', ImportSessionSchema);

// Import Tracker Class
export class ImportTracker {
  private sessionId: string;
  private importType: 'bulk-import' | 'manual' | 'seed';
  private model: string;
  private fileName?: string;
  private importedIds: string[] = [];
  private description?: string;

  constructor(model: string, importType: 'bulk-import' | 'manual' | 'seed' = 'bulk-import', fileName?: string, description?: string) {
    this.sessionId = `${model}_${importType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.importType = importType;
    this.model = model;
    this.fileName = fileName;
    this.description = description;
  }

  // Track a single imported record
  trackRecord(recordId: string): void {
    if (!this.importedIds.includes(recordId)) {
      this.importedIds.push(recordId);
    }
  }

  // Track multiple imported records
  trackRecords(recordIds: string[]): void {
    recordIds.forEach(id => this.trackRecord(id));
  }

  // Save the import session to database
  async saveSession(status: 'completed' | 'failed' | 'partial' = 'completed'): Promise<void> {
    const session = new ImportSession({
      sessionId: this.sessionId,
      importType: this.importType,
      modelName: this.model,
      fileName: this.fileName,
      recordsImported: this.importedIds.length,
      importedIds: this.importedIds,
      description: this.description,
      status
    });

    await session.save();
    console.log(`📋 Import session saved: ${this.sessionId} (${this.importedIds.length} records)`);
  }

  // Get session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      importType: this.importType,
      model: this.model,
      fileName: this.fileName,
      recordsImported: this.importedIds.length,
      description: this.description
    };
  }

  // Static method to get all import sessions
  static async getAllSessions(): Promise<IImportSession[]> {
    return await ImportSession.find().sort({ importDate: -1 });
  }

  // Static method to get sessions by model
  static async getSessionsByModel(model: string): Promise<IImportSession[]> {
    return await ImportSession.find({ modelName: model }).sort({ importDate: -1 });
  }

  // Static method to get all imported IDs for a model
  static async getImportedIds(model: string, importType?: string): Promise<string[]> {
    const query: any = { modelName: model, status: { $in: ['completed', 'partial'] } };
    if (importType) {
      query.importType = importType;
    }

    const sessions = await ImportSession.find(query);
    const allIds: string[] = [];
    
    sessions.forEach(session => {
      allIds.push(...session.importedIds);
    });

    return [...new Set(allIds)]; // Remove duplicates
  }

  // Static method to clear imported data only
  static async clearImportedData(model: string, importType?: string): Promise<{ deletedCount: number, sessionsCleaned: number }> {
    const importedIds = await this.getImportedIds(model, importType);
    
    if (importedIds.length === 0) {
      return { deletedCount: 0, sessionsCleaned: 0 };
    }

    // Map model names to the actual mongoose models
    const modelMap: { [key: string]: any } = {
      'customers': 'Customer',
      'users': 'User',
      'appconfigs': 'AppConfig',
      'activitylogs': 'ActivityLog'
    };

    const mongooseModelName = modelMap[model.toLowerCase()];
    if (!mongooseModelName) {
      throw new Error(`Unknown model: ${model}. Supported models: ${Object.keys(modelMap).join(', ')}`);
    }

    // Get the appropriate mongoose model
    let MongooseModel;
    try {
      MongooseModel = mongoose.model(mongooseModelName);
    } catch (error) {
      throw new Error(`Model ${mongooseModelName} not found. Available models: ${Object.keys(mongoose.models).join(', ')}`);
    }

    // Delete only the imported records
    const result = await MongooseModel.deleteMany({ _id: { $in: importedIds } });
    
    // Clean up the import sessions
    const query: any = { modelName: model, status: { $in: ['completed', 'partial'] } };
    if (importType) {
      query.importType = importType;
    }
    
    const sessionResult = await ImportSession.deleteMany(query);

    return { 
      deletedCount: result.deletedCount || 0, 
      sessionsCleaned: sessionResult.deletedCount || 0 
    };
  }

  // Static method to list import sessions
  static async listImportSessions(model?: string): Promise<void> {
    const query = model ? { modelName: model } : {};
    const sessions = await ImportSession.find(query).sort({ importDate: -1 });

    if (sessions.length === 0) {
      console.log(`📋 No import sessions found${model ? ` for model: ${model}` : ''}`);
      return;
    }

    console.log(`\n📋 IMPORT SESSIONS${model ? ` for ${model.toUpperCase()}` : ''}`);
    console.log('=' .repeat(60));

    sessions.forEach(session => {
      console.log(`🆔 Session: ${session.sessionId}`);
      console.log(`📊 Model: ${session.modelName} | Type: ${session.importType} | Status: ${session.status}`);
      console.log(`📈 Records: ${session.recordsImported} | Date: ${session.importDate.toISOString().split('T')[0]}`);
      if (session.fileName) console.log(`📁 File: ${session.fileName}`);
      if (session.description) console.log(`📝 Description: ${session.description}`);
      console.log('-'.repeat(40));
    });
  }
}