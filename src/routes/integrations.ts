import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MailjetService } from '../services/mailjetService';
import TermiiService from '../services/termiiService';
import OpenAIService from '../services/openaiService';

// Integration service routes
export default async function integrationRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // POST /api/integrations/invoke-llm
  fastify.post('/invoke-llm', {
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string' },
          response_json_schema: { type: 'object' },
          model: { type: 'string' },
          temperature: { type: 'number' },
          max_tokens: { type: 'number' },
          custom_api_key: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as any;
      const openaiService = new OpenAIService(body.custom_api_key);
      const result = await openaiService.invokeLLM(body);
      
      if (result.success) {
        reply.send({
          success: true,
          data: result.data
        });
      } else {
        reply.code(500).send({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // POST /api/integrations/send-email
  fastify.post('/send-email', {
    schema: {
      body: {
        type: 'object',
        required: ['to', 'subject'],
        properties: {
          to: { type: 'string', format: 'email' },
          subject: { type: 'string' },
          body: { type: 'string' },
          html: { type: 'string' },
          from: { type: 'string', format: 'email' },
          fromName: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const mailjetService = new MailjetService();
      const { to, ...emailData } = request.body as any;
      const result = await mailjetService.sendMail(to, emailData);
      
      reply.send({
        success: true,
        message: 'Email sent successfully',
        data: result
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // POST /api/integrations/send-sms
  fastify.post('/send-sms', {
    schema: {
      body: {
        type: 'object',
        required: ['to', 'message'],
        properties: {
          to: { type: 'string' },
          message: { type: 'string', maxLength: 1600 },
          from: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const termiiService = new TermiiService();
      const result = await termiiService.sendSMS(request.body as any);
      
      reply.send({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // POST /api/integrations/send-whatsapp
  fastify.post('/send-whatsapp', {
    schema: {
      body: {
        type: 'object',
        required: ['to', 'message'],
        properties: {
          to: { type: 'string' },
          message: { type: 'string' },
          mediaUrl: { type: 'string', format: 'uri' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const termiiService = new TermiiService();
      const result = await termiiService.sendSMS(request.body as any);
      
      reply.send({
        success: true,
        message: 'WhatsApp message sent successfully',
        data: result
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // POST /api/integrations/upload-file
  fastify.post('/upload-file', async (request, reply) => {
    // TODO: Implement file upload
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  // POST /api/integrations/generate-image
  fastify.post('/generate-image', async (request, reply) => {
    // TODO: Implement image generation
    reply.code(501).send({ error: 'Not implemented yet' });
  });

  // POST /api/integrations/extract-data-from-file
  fastify.post('/extract-data-from-file', async (request, reply) => {
    // TODO: Implement data extraction
    reply.code(501).send({ error: 'Not implemented yet' });
  });
}