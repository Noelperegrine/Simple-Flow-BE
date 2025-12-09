import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateToken } from '../middleware/auth';
import { Customer, User } from '../models/mongodb';

// Entity management routes
export default async function entityRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/entities/customers
  fastify.get('/customers', {
    preHandler: [authenticateToken],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        required: ['limit']
      }
    }
  }, async (request, reply) => {
    try {
      const query = request.query as { limit: number };
      
      // Fetch customers from database
      const customers = await Customer.find({})
        .limit(query.limit)
        .sort({ created_at: -1 })
        .lean();

      // Format response to match frontend expectations
      const formattedCustomers = customers.map(customer => ({
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        status: customer.status,
        health_score: customer.health_score,
        mrr: customer.mrr,
        plan: customer.plan,
        churn_date: customer.churn_date,
        feature_usage: customer.feature_usage
      }));

      return reply.send(formattedCustomers);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        data: null,
        error: {
          type: 'database_error',
          message: 'Failed to fetch customers'
        }
      });
    }
  });

  // GET /api/entities/users
  fastify.get('/users', {
    preHandler: [authenticateToken]
  }, async (request, reply) => {
    try {
      // Fetch users from database
      const users = await User.find({})
        .select('email full_name role')
        .sort({ created_at: -1 })
        .lean();

      // Format response to match frontend expectations
      const formattedUsers = users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }));

      return reply.send(formattedUsers);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        data: null,
        error: {
          type: 'database_error',
          message: 'Failed to fetch users'
        }
      });
    }
  });

  // GET /api/entities/query
  fastify.get('/query', {
    preHandler: [authenticateToken]
  }, async (request, reply) => {
    // Placeholder endpoint - usage unclear from frontend analysis
    return reply.send({
      success: true,
      data: {
        message: 'Query endpoint placeholder'
      },
      error: null
    });
  });
}