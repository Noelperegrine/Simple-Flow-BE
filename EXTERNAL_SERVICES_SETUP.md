# External Services Setup Guide

Before implementing the backend, you need to configure these external services. The MongoDB database is already configured with your existing Atlas cluster.

## 🗄️ 1. Database Configuration

### **Development Environment**
- **Database:** Local MongoDB installation
- **Connection:** `mongodb://localhost:27017/practice-flow-dev`
- **Setup Required:** Install MongoDB locally or use Docker

**Local MongoDB Installation:**
```bash
# Windows (via Chocolatey)
choco install mongodb

# macOS (via Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Or use Docker
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

### **Production Environment**
- **✅ CONFIGURED:** Using existing MongoDB Atlas cluster
- **Connection String:** `mongodb+srv://username:password@cluster.mongodb.net/practice-flow`
- **Database Name:** `practice-flow` (separate from your EMS database)
- **Collections:** customers, users, appconfigs, activitylogs

**No action required for production** - database is ready to use!

---

## 🤖 2. LLM Integration - OpenAI

**Service:** OpenAI API
**Required for:** Executive Report generation, potential future AI features
**Usage:** GPT-4 for executive summaries and business insights

**Setup:**
1. Create account at https://platform.openai.com
2. Generate API key
3. Set up billing (pay-per-use)
4. Consider usage limits for cost control

**What you need:**
- `OPENAI_API_KEY=sk-...`

**Estimated cost:** $5-20/month depending on usage

---

## 📧 3. Email Service - Mailjet

**✅ CONFIGURED:** Using Mailjet email service
**Required for:** Email notifications, alerts, and communication features

**Setup Complete:**
- API Key: `your-mailjet-api-key`
- Secret Key: `your-mailjet-secret-key`
- Service ready for immediate use

**Features Available:**
- Simple email sending
- HTML email support
- Template-based emails
- Delivery tracking

**No action required** - Mailjet is configured and ready!

---

## 📱 4. SMS & WhatsApp Service - Twilio

**✅ CONFIGURED:** Using Twilio for SMS and WhatsApp messaging
**Required for:** SMS notifications, WhatsApp messaging, and mobile alerts

**Setup Complete:**
- Account SID: `your-twilio-account-sid`
- Auth Token: `your-twilio-auth-token`
- WhatsApp Number: `your-whatsapp-number`
- Both SMS and WhatsApp messaging ready

**Features Available:**
- SMS messaging to any phone number
- WhatsApp messaging (text and media)
- Message delivery tracking
- Phone number validation
- International messaging support

**No action required** - Twilio is configured and ready!

---

## 📁 5. File Storage - AWS S3

**Service:** AWS S3
**Required for:** File uploads, document storage
**Alternative:** Cloudinary, DigitalOcean Spaces

**Setup:**
1. Create AWS account
2. Create S3 bucket
3. Create IAM user with S3 permissions
4. Generate access keys
5. Configure CORS for frontend uploads

**What you need:**
- `AWS_ACCESS_KEY_ID=AKIA...`
- `AWS_SECRET_ACCESS_KEY=...`
- `AWS_REGION=us-east-1`
- `AWS_S3_BUCKET=practice-flow-files`

**Cost:** ~$1-5/month depending on storage

---

## 🎨 6. Image Generation

**Option A: OpenAI DALL-E**
- Use same OpenAI account
- $0.020 per image (1024x1024)
- High quality results

**Option B: Stability AI**
- Stable Diffusion API
- $0.002 per image
- Lower cost alternative

**Option C: Local Generation**
- Replicate API
- Self-hosted solutions
- More complex setup

**What you need:**
- Already covered by `OPENAI_API_KEY` if using DALL-E

---

## 🔐 7. Authentication & Security

**JWT Secret:**
- Generate a secure random string
- 64+ characters recommended
- Different for production/development

**Frontend CORS:**
- Development: `http://localhost:5174`
- Production: Your actual domain

**What you need:**
- `JWT_SECRET=your-super-secure-random-string`
- `FRONTEND_URL=https://your-domain.com`

---

## 💰 Estimated Monthly Costs

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| **MongoDB Atlas** | ✅ Configured | ✅ Current plan | Shared cluster |
| **OpenAI API** | No free tier | $5-20/month | Usage-based |
| **Mailjet Email** | ✅ Configured | 6k emails/month | Ready to use |
| **Twilio SMS/WhatsApp** | ✅ Configured | $0.0075/SMS | Ready to use |
| **AWS S3** | 5GB free | $1-5/month | Storage + transfer |
| **Render Hosting** | Free | $7/month | 512MB RAM |

**Total estimated cost:** $0-15/month depending on usage and tiers chosen.

---

## 🚀 Quick Start Checklist

- [x] **Database** (MongoDB Atlas configured)
- [x] **Email service** (Mailjet configured)
- [x] **SMS/WhatsApp service** (Twilio configured)
- [ ] **OpenAI API key** (required for Executive Reports)
- [ ] **AWS S3 bucket** (required for file uploads)
- [ ] **JWT secret** (generate random string)

## 📝 Environment Variables Summary

Copy this template to your `.env` file:

```bash
# Database (✅ CONFIGURED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/practice-flow

# JWT
JWT_SECRET=generate-a-super-secure-random-string-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Service - Mailjet (✅ CONFIGURED)
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key

# SMS/WhatsApp Service - Twilio (✅ CONFIGURED)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=your-whatsapp-number

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=practice-flow-files

# CORS
FRONTEND_URL=http://localhost:5174
```

---

## 🔧 Development vs Production

**Development:**
- Use free tiers for testing
- `FRONTEND_URL=http://localhost:5174`
- Local database (optional)

**Production:**
- Configure proper billing limits
- Use production domains
- Enable monitoring and alerts
- Regular backups

Once you have all these services configured, provide the API keys and we can proceed with the implementation!