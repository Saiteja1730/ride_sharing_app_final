import { Request, Response, NextFunction } from 'express';
import { AppError, HttpError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export { HttpError };


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req as any).requestId || 'N/A';

  if (err instanceof AppError) {
    logger.warn(`[${requestId}] ${err.statusCode} - ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
      },
      requestId,
    });
    return;
  }

  // Unhandled / Operational Failures
  logger.error(`[${requestId}] 500 - Unhandled Server Error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.isProduction ? 'An unexpected server error occurred' : err.message,
    },
    requestId,
  });
};

export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  const requestId = (req as any).requestId || 'N/A';
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route '${req.originalUrl}' not found`,
    },
    requestId,
  });
};
