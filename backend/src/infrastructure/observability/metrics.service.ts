import { Request, Response, NextFunction } from 'express';
import v8 from 'v8';
import { redisService } from '../redis/redis.service';
import mongoose from 'mongoose';


interface MetricsRegistry {
  httpRequestsTotal: Map<string, number>;
  httpDurationSum: Map<string, number>;
}

const registry: MetricsRegistry = {
  httpRequestsTotal: new Map(),
  httpDurationSum: new Map(),
};

export const metricsCollector = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const key = `${req.method}_${route}_${res.statusCode}`;

    const currentCount = registry.httpRequestsTotal.get(key) || 0;
    registry.httpRequestsTotal.set(key, currentCount + 1);

    const currentSum = registry.httpDurationSum.get(key) || 0;
    registry.httpDurationSum.set(key, currentSum + duration);
  });

  next();
};

export const prometheusMetricsHandler = async (_req: Request, res: Response): Promise<void> => {
  const memUsage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();

  let metrics = '';

  metrics += `# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n`;
  metrics += `# TYPE process_cpu_user_seconds_total counter\n`;
  metrics += `process_cpu_user_seconds_total ${process.cpuUsage().user / 1000000}\n\n`;

  metrics += `# HELP process_resident_memory_bytes Resident memory size in bytes.\n`;
  metrics += `# TYPE process_resident_memory_bytes gauge\n`;
  metrics += `process_resident_memory_bytes ${memUsage.rss}\n\n`;

  metrics += `# HELP nodejs_heap_size_total_bytes Process heap size from Node.js in bytes.\n`;
  metrics += `# TYPE nodejs_heap_size_total_bytes gauge\n`;
  metrics += `nodejs_heap_size_total_bytes ${heapStats.total_heap_size}\n\n`;

  metrics += `# HELP http_requests_total Total number of HTTP requests.\n`;
  metrics += `# TYPE http_requests_total counter\n`;
  for (const [key, val] of registry.httpRequestsTotal.entries()) {
    const [method, route, code] = key.split('_');
    metrics += `http_requests_total{method="${method}",route="${route}",status="${code}"} ${val}\n`;
  }
  metrics += `\n`;

  metrics += `# HELP mongodb_connection_state Mongoose DB connection state (1=connected).\n`;
  metrics += `# TYPE mongodb_connection_state gauge\n`;
  metrics += `mongodb_connection_state ${mongoose.connection.readyState === 1 ? 1 : 0}\n\n`;

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
};
