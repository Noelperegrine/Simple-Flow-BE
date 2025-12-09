import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateToken, generateToken } from '../middleware/auth';
import { User } from '../models/mongodb';

// Authentication routes
export default async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/auth/me
  fastify.get('/me', {
    preHandler: [authenticateToken]
  }, async (request, reply) => {
    try {
      if (!request.currentUser) {
        return reply.status(401).send({
          success: false,
          data: null,
          error: {
            type: 'auth_required',
            message: 'Authentication required'
          }
        });
      }

      // Return user data in format expected by frontend
      return reply.send({
        success: true,
        data: {
          id: request.currentUser.id,
          email: request.currentUser.email,
          full_name: request.currentUser.full_name,
          role: request.currentUser.role
        },
        error: null
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        data: null,
        error: {
          type: 'server_error',
          message: 'Failed to get user information'
        }
      });
    }
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (request, reply) => {
    try {
      // Extract redirect_url from query parameters
      const query = request.query as { redirect_url?: string };
      const redirectUrl = query.redirect_url;

      // For JWT-based auth, logout is handled client-side by removing token
      // But we can blacklist tokens in future if needed
      
      const response = {
        success: true,
        data: {
          message: 'Logged out successfully'
        },
        error: null
      };

      // If redirect URL provided, include it in response
      if (redirectUrl) {
        (response.data as any).redirect_url = redirectUrl;
      }

      return reply.send(response);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        data: null,
        error: {
          type: 'logout_error',
          message: 'Failed to logout'
        }
      });
    }
  });

  // GET /api/auth/redirectToLogin
  fastify.get('/redirectToLogin', async (request, reply) => {
    try {
      const query = request.query as { return_url?: string };
      const returnUrl = query.return_url || '/';

      // In a real app, this would redirect to your login page
      // For now, return login URL for frontend to handle
      const loginUrl = process.env.FRONTEND_URL + '/login';
      
      return reply.send({
        success: true,
        data: {
          login_url: loginUrl,
          return_url: returnUrl,
          message: 'Redirect to login required'
        },
        error: null
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        data: null,
        error: {
          type: 'redirect_error',
          message: 'Failed to generate login redirect'
        }
      });
    }
  });

  // POST /api/auth/login - Simple login for testing
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string, password: string };
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            type: 'auth_failed',
            message: 'Invalid email or password'
          }
        });
      }

      // Simple password check for demo (use 'demo123' for any user)
      if (password !== 'demo123') {
        return reply.code(401).send({
          success: false,
          error: {
            type: 'auth_failed',
            message: 'Invalid email or password'
          }
        });
      }

      // Generate JWT token
      const token = generateToken(user._id.toString());

      reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          }
        }
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: {
          type: 'server_error',
          message: 'Login failed'
        }
      });
    }
  });
}