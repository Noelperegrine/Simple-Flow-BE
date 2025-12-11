#!/usr/bin/env ts-node

// Force production environment
process.env.NODE_ENV = 'production';

import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../utils/database';
import { Customer, User, AppConfig } from '../models/mongodb';

// Load production environment ONLY
console.log('🏭 PRODUCTION SEED - Loading production environment...');
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
// Load base .env for any common variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Final MONGODB_URI:', process.env.MONGODB_URI);

const seedData = async () => {
  try {
    console.log('🌱 Starting PRODUCTION database seeding...');
    
    // Connect to database
    await connectDB();
    
    console.log('🧹 Clearing existing data in PRODUCTION...');
    await Customer.deleteMany({});
    await User.deleteMany({});
    await AppConfig.deleteMany({});
    
    // Seed customers
    const customers = [
      {
        name: "Wellness Family Practice",
        email: "contact@wellnessfamily.com",
        status: "active",
        health_score: 85,
        mrr: 299,
        plan: "Plus",
        feature_usage: {
          scheduling_appointments: 145,
          telehealth_sessions: 32,
          notes_created: 89,
          billing_transactions: 156,
          insurance_claims: 45,
          claims_filed: 45,
          client_portal_logins: 234,
          measurement_assessments: 12,
          treatment_plans: 23
        }
      },
      {
        name: "Downtown Medical Center",
        email: "admin@downtownmedical.com",
        status: "at_risk",
        health_score: 65,
        mrr: 199,
        plan: "Essential",
        feature_usage: {
          scheduling_appointments: 89,
          telehealth_sessions: 12,
          notes_created: 45,
          billing_transactions: 78,
          insurance_claims: 23,
          claims_filed: 23,
          client_portal_logins: 123,
          measurement_assessments: 5,
          treatment_plans: 8
        }
      },
      {
        name: "Pediatric Care Associates",
        email: "info@pediatriccare.com",
        status: "active",
        health_score: 92,
        mrr: 399,
        plan: "Enterprise",
        feature_usage: {
          scheduling_appointments: 267,
          telehealth_sessions: 78,
          notes_created: 134,
          billing_transactions: 245,
          insurance_claims: 89,
          claims_filed: 89,
          client_portal_logins: 456,
          measurement_assessments: 34,
          treatment_plans: 45
        }
      },
      {
        name: "Sunset Physical Therapy",
        email: "contact@sunsetpt.com",
        status: "active",
        health_score: 78,
        mrr: 199,
        plan: "Essential",
        feature_usage: {
          scheduling_appointments: 123,
          telehealth_sessions: 15,
          notes_created: 67,
          billing_transactions: 89,
          insurance_claims: 34,
          claims_filed: 34,
          client_portal_logins: 178,
          measurement_assessments: 8,
          treatment_plans: 12
        }
      }
    ];

    await Customer.insertMany(customers);
    console.log(`👥 Seeded ${customers.length} customers`);

    // Seed users
    const users = [
      {
        email: "admin@practiceflow.com",
        full_name: "System Administrator",
        role: "admin"
      },
      {
        email: "manager@practiceflow.com",
        full_name: "Practice Manager",
        role: "user"
      },
      {
        email: "analyst@practiceflow.com",
        full_name: "Data Analyst",
        role: "user"
      }
    ];

    await User.insertMany(users);
    console.log(`👤 Seeded ${users.length} users`);

    // Seed app configuration
    const appConfig = {
      app_id: "practice-flow-app",
      public_settings: {
        app_name: "Practice Flow",
        features_enabled: {
          analytics: true,
          reporting: true,
          customer_management: true,
          user_management: true,
          churn_prediction: true
        },
        theme: {
          primary_color: "#3b82f6",
          secondary_color: "#6b7280"
        }
      }
    };

    await AppConfig.create(appConfig);
    console.log('⚙️ Seeded app configuration');

    console.log('✅ PRODUCTION Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding PRODUCTION database:', error);
    process.exit(1);
  }
};

seedData();