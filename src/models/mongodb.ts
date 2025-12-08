import mongoose, { Schema, Document } from 'mongoose';

// Feature Usage Schema
const FeatureUsageSchema = new Schema({
  scheduling_appointments: { type: Number, default: 0 },
  telehealth_sessions: { type: Number, default: 0 },
  notes_created: { type: Number, default: 0 },
  billing_transactions: { type: Number, default: 0 },
  insurance_claims: { type: Number, default: 0 },
  claims_filed: { type: Number, default: 0 }, // Legacy field for compatibility
  client_portal_logins: { type: Number, default: 0 },
  measurement_assessments: { type: Number, default: 0 },
  treatment_plans: { type: Number, default: 0 }
}, { _id: false });

// Customer Interface
export interface ICustomer extends Document {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'at_risk' | 'churned';
  health_score: number;
  mrr: number;
  plan: string;
  churn_date?: Date;
  feature_usage: {
    scheduling_appointments: number;
    telehealth_sessions: number;
    notes_created: number;
    billing_transactions: number;
    insurance_claims: number;
    claims_filed: number;
    client_portal_logins: number;
    measurement_assessments: number;
    treatment_plans: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Customer Schema
const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'at_risk', 'churned'],
    default: 'active'
  },
  health_score: { type: Number, default: 0, min: 0, max: 100 },
  mrr: { type: Number, default: 0, min: 0 },
  plan: { type: String, required: true },
  churn_date: { type: Date, default: null },
  feature_usage: { type: FeatureUsageSchema, default: () => ({}) }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// User Interface
export interface IUser extends Document {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['admin', 'user'],
    default: 'user'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// App Configuration Interface
export interface IAppConfig extends Document {
  id: string;
  app_id: string;
  public_settings: {
    app_name: string;
    features_enabled: Record<string, boolean>;
    theme?: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// App Configuration Schema
const AppConfigSchema = new Schema<IAppConfig>({
  app_id: { type: String, required: true, unique: true },
  public_settings: {
    app_name: { type: String, required: true },
    features_enabled: { type: Map, of: Boolean, default: new Map() },
    theme: { type: Map, of: String, default: new Map() }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Activity Log Interface
export interface IActivityLog extends Document {
  user_id: string;
  page_name: string;
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
}

// Activity Log Schema
const ActivityLogSchema = new Schema<IActivityLog>({
  user_id: { type: String, required: true },
  page_name: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ip_address: { type: String },
  user_agent: { type: String }
}, {
  timestamps: true
});

// Export Models
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const User = mongoose.model<IUser>('User', UserSchema);
export const AppConfig = mongoose.model<IAppConfig>('AppConfig', AppConfigSchema);
export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);