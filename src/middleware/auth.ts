import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/mongodb';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: AuthenticatedUser;
  }
}

/**
 * JWT Authentication Middleware
 * Validates Bearer tokens and attaches user to request
 */
export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          type: 'auth_required',
          message: 'Authentication required'
        }
      });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Look up user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          type: 'user_not_registered',
          message: 'User not registered'
        }
      });
    }

    // Attach user to request
    request.currentUser = {
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          type: 'invalid_token',
          message: 'Invalid authentication token'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({
        success: false,
        data: null,
        error: {
          type: 'token_expired',
          message: 'Authentication token expired'
        }
      });
    }

    return reply.status(500).send({
      success: false,
      data: null,
      error: {
        type: 'auth_error',
        message: 'Authentication failed'
      }
    });
  }
}/**
 * Generate JWT token for user
 */
export function generateToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, timestamp: Date.now() },
    jwtSecret,
    { expiresIn: '24h' }
  );
}