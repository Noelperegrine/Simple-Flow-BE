// Customer data model interfaces

export interface FeatureUsage {
  scheduling_appointments: number;
  telehealth_sessions: number;
  notes_created: number;
  billing_transactions: number;
  insurance_claims: number;
  claims_filed: number; // Legacy field for compatibility
  client_portal_logins: number;
  measurement_assessments: number;
  treatment_plans: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'at_risk' | 'churned';
  health_score: number;
  mrr: number;
  plan: string;
  churn_date: string | null;
  feature_usage: FeatureUsage;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
}

// Request/Response interfaces
export interface CustomerListQuery {
  limit: number;
}

export interface AppConfig {
  id: string;
  public_settings: {
    app_name: string;
    features_enabled: Record<string, boolean>;
    theme?: Record<string, string>;
  };
}