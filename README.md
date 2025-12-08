# Practice Flow Backend

Backend API for the Practice Flow healthcare management application. This server replaces Base44 services with a complete Fastify-based implementation.

## Project Status
🚧 **Ready for implementation** - Project structure and external services configured, implementing all 12 required endpoints per specification.

## Architecture
- **Framework:** Fastify + TypeScript
- **Database:** MongoDB Atlas
- **Deployment:** Render
- **Authentication:** JWT
- **External Services:** Mailjet (email), Twilio (SMS), MongoDB Atlas (storage)

## Implementation Plan

Based on the detailed `BACKEND_IMPLEMENTATION_SPEC.md`, Practice Flow requires **12 API endpoints across 5 categories**:

### Authentication (3 endpoints)
- `POST /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/redirectToLogin` - Redirect to login

### Entities (3 endpoints)
- `GET /api/entities/customers?limit=100` - List customers with complete analytics
- `GET /api/entities/users` - List users
- `GET /api/entities/query` - Query endpoint

### Integrations (6 endpoints)
- `POST /api/integrations/invoke-llm` - LLM integration (ChatGPT)
- `POST /api/integrations/send-email` - Email service (Mailjet)
- `POST /api/integrations/send-sms` - SMS service (Twilio)
- `POST /api/integrations/upload-file` - File upload (MongoDB GridFS)
- `POST /api/integrations/generate-image` - Image generation service
- `POST /api/integrations/extract-data-from-file` - Data extraction from files

### Logging (1 endpoint)
- `POST /api/app-logs/log-user-in-app` - User activity logging

### Configuration (1 endpoint)
- `GET /prod/public-settings/by-id/:appId` - App configuration

## External Services Configured

✅ **Mailjet** - Email service with template support  
✅ **Twilio** - SMS and WhatsApp messaging  
✅ **MongoDB Atlas** - Database and data storage  
✅ **Cloudinary** - Image and file storage  

**Services Ready for Implementation:**
- Authentication & customer/user data management
- Email and SMS integrations  
- File upload and storage
- Activity logging and configuration

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment is ready!** 
   - `.env` file is pre-configured with MongoDB Atlas
   - Just add your external API keys when needed

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Seed database with sample data:**
   ```bash
   npm run seed
   ```

5. **API Documentation:** http://localhost:3000/documentation

### Advanced Environment Setup (Optional)

If you need separate development/production configurations:

**Local MongoDB Development:**
```bash
cp .env.development .env
# Requires local MongoDB installation
```

**Production Configuration:**
```bash
cp .env.production .env
# Uses MongoDB Atlas with production settings
```

## Scripts
- `npm run dev` - Start development server (uses .env.development)
- `npm run dev:prod` - Start development server with production config
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run start:dev` - Start built app with development config
- `npm run seed` - Seed development database
- `npm run seed:prod` - Seed production database
- `npm run type-check` - TypeScript type checking

## Project Structure
```
src/
├── server.ts          # Main server file
├── routes/            # API route handlers
│   ├── auth.ts        # Authentication routes
│   ├── entities.ts    # Customer/User routes
│   ├── integrations.ts # External service routes
│   ├── logging.ts     # Activity logging routes
│   └── config.ts      # Configuration routes
├── services/          # Business logic services (TBD)
├── models/            # TypeScript interfaces
├── middleware/        # Custom middleware (TBD)
└── utils/             # Helper utilities (TBD)
```

## Deployment
Configured for automatic deployment on Render using `render.yaml`.

## External Services Required
See EXTERNAL_SERVICES_SETUP.md for detailed configuration instructions.