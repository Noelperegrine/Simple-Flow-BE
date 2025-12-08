import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './utils/database';

// Load environment-specific variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to .env if environment-specific file doesn't exist
dotenv.config();

// Route imports (will be created)
// import authRoutes from './routes/auth';
// import entityRoutes from './routes/entities';
// import integrationRoutes from './routes/integrations';
// import loggingRoutes from './routes/logging';
// import configRoutes from './routes/config';

const server = fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  } : true
});

async function build() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Register plugins
    await server.register(helmet);
    
    await server.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5174',
      credentials: true
    });

    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-fallback-secret'
    });

    await server.register(multipart);

    // Swagger documentation
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'Practice Flow API',
          description: 'Backend API for Practice Flow healthcare management',
          version: '1.0.0'
        },
        host: 'localhost:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    });

    await server.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      }
    });

    // Health check endpoint
    server.get('/health', async () => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    });

    // Register routes (placeholder - will be uncommented when routes are created)
    // await server.register(authRoutes, { prefix: '/api/auth' });
    // await server.register(entityRoutes, { prefix: '/api/entities' });
    // await server.register(integrationRoutes, { prefix: '/api/integrations' });
    // await server.register(loggingRoutes, { prefix: '/api/app-logs' });
    // await server.register(configRoutes, { prefix: '/prod' });

    return server;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

async function start() {
  try {
    const app = await build();
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    await app.listen({ port, host });
    console.log(`🚀 Server ready at http://${host}:${port}`);
    console.log(`📚 API Documentation at http://${host}:${port}/documentation`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

if (require.main === module) {
  start();
}

export default build;