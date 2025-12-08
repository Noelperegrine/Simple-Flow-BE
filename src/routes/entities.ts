import { FastifyInstance, FastifyPluginOptions } from 'fastify';

// Entity management routes
export default async function entityRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/entities/customers
  fastify.get('/customers', {
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
    // TODO: Implement customer list retrieval
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  // GET /api/entities/users
  fastify.get('/users', async (request, reply) => {
    // TODO: Implement user list retrieval
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  // GET /api/entities/query
  fastify.get('/query', async (request, reply) => {
    // TODO: Implement query endpoint (usage unclear)
    reply.code(501).send({ error: 'Not implemented yet' });
  });
}