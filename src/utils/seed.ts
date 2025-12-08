import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../utils/database';
import { Customer, User, AppConfig } from '../models/mongodb';

// Load environment-specific variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to .env if environment-specific file doesn't exist
dotenv.config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();

    // Clear existing data (only in development)
    if (process.env.NODE_ENV !== 'production') {
      await Customer.deleteMany({});
      await User.deleteMany({});
      await AppConfig.deleteMany({});
      console.log('🧹 Cleared existing data');
    }

    // Seed Customers
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
        status: "churned",
        health_score: 0,
        mrr: 0,
        plan: "Starter",
        churn_date: new Date('2024-11-15'),
        feature_usage: {
          scheduling_appointments: 23,
          telehealth_sessions: 2,
          notes_created: 12,
          billing_transactions: 18,
          insurance_claims: 5,
          claims_filed: 5,
          client_portal_logins: 34,
          measurement_assessments: 1,
          treatment_plans: 2
        }
      }
    ];

    await Customer.insertMany(customers);
    console.log(`👥 Seeded ${customers.length} customers`);

    // Seed Users
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

    // Seed App Configuration
    const appConfig = {
      app_id: "practice-flow-app",
      public_settings: {
        app_name: "Practice Flow",
        features_enabled: {
          executive_reports: true,
          customer_success: true,
          churn_analysis: true,
          analytics: true,
          practice_health: true,
          product_usage: true
        },
        theme: {
          primary_color: "#F59E0B",
          secondary_color: "#10B981",
          accent_color: "#3B82F6"
        }
      }
    };

    await AppConfig.create(appConfig);
    console.log('⚙️ Seeded app configuration');

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

export default seedData;