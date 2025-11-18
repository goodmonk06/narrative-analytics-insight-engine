import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './lib/errors';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';
import contentRoutes from './routes/content';
import analysisRoutes from './routes/analysis';
import engagementRoutes from './routes/engagement';
import insightRoutes from './routes/insights';
import collectionRoutes from './routes/collections';
import tagRoutes from './routes/tags';
import trendRoutes from './routes/trends';
import recommendationRoutes from './routes/recommendations';

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: logger as any,
  disableRequestLogging: false,
});

// Register CORS
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
});

// Attach Prisma to Fastify instance
fastify.decorate('prisma', prisma);

// Set error handler
fastify.setErrorHandler(errorHandler);

// Health check with detailed info
fastify.get('/health', async () => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  } catch (error) {
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    };
  }
});

// Metrics endpoint
fastify.get('/metrics', async () => {
  return metrics.getMetrics();
});

// Register routes
fastify.register(contentRoutes, { prefix: '/api/content' });
fastify.register(analysisRoutes, { prefix: '/api/analysis' });
fastify.register(engagementRoutes, { prefix: '/api/engagement' });
fastify.register(insightRoutes, { prefix: '/api/insights' });
fastify.register(collectionRoutes, { prefix: '/api/collections' });
fastify.register(tagRoutes, { prefix: '/api/tags' });
fastify.register(trendRoutes, { prefix: '/api/trends' });
fastify.register(recommendationRoutes, { prefix: '/api/recommendations' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
