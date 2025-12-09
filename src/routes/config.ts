import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AppConfig } from '../models/mongodb';

// Configuration routes
export default async function configRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /prod/public-settings/by-id/:appId
  fastify.get('/public-settings/by-id/:appId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          appId: { type: 'string' }
        },
        required: ['appId']
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { appId: string };
      
      // Look up app configuration in database
      let appConfig = await AppConfig.findOne({ app_id: params.appId });
      
      // If no config found, create default configuration
      if (!appConfig) {
        appConfig = new AppConfig({
          app_id: params.appId,
          public_settings: {
            app_name: "Practice Flow",
            features_enabled: {
              executive_reports: true,
              customer_success: true,
              churn_analysis: true,
              dashboard_analytics: true,
              user_management: true
            },
            theme: {
              primary_color: "#F59E0B",
              secondary_color: "#10B981",
              brand_logo: "https://base44.com/logo_v2.svg"
            },
            auth_required: true,
            max_users: 10
          }
        });
        
        await appConfig.save();
      }

      return reply.send({
        id: appConfig.app_id,
        public_settings: appConfig.public_settings
      });
    } catch (error: any) {
      console.error('App config error:', error);
      
      // Return default config if database fails
      return reply.send({
        id: (request.params as { appId: string }).appId,
        public_settings: {
          app_name: "Practice Flow",
          features_enabled: {
            executive_reports: true,
            customer_success: true,
            churn_analysis: true,
            dashboard_analytics: true,
            user_management: true
          },
          theme: {
            primary_color: "#F59E0B",
            secondary_color: "#10B981",
            brand_logo: "https://base44.com/logo_v2.svg"
          },
          auth_required: true,
          max_users: 10
        }
      });
    }
  });
}