import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateToken } from '../middleware/auth';
import { ActivityLog } from '../models/mongodb';

// Logging routes
export default async function loggingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // POST /api/app-logs/log-user-in-app
  fastify.post('/log-user-in-app', {
    preHandler: [authenticateToken],
    schema: {
      body: {
        type: 'object',
        properties: {
          page_name: { type: 'string' },
          timestamp: { type: 'string' }
        },
        required: ['page_name']
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as { page_name: string; timestamp?: string };
      
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

      // Create activity log entry
      const activityLog = new ActivityLog({
        user_id: request.currentUser.id,
        action_type: 'page_view',
        page_name: body.page_name,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        metadata: {
          user_agent: request.headers['user-agent'] || '',
          ip_address: request.ip || ''
        }
      });

      await activityLog.save();

      return reply.send({
        success: true,
        data: {
          message: 'Activity logged successfully',
          log_id: activityLog._id.toString()
        },
        error: null
      });
    } catch (error: any) {
      // Don't fail the app for logging errors
      console.error('Activity logging error:', error);
      
      return reply.send({
        success: true,
        data: {
          message: 'Activity log recorded (with errors)'
        },
        error: null
      });
    }
  });
}