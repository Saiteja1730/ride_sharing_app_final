import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { z, ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors';

export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        next(new BadRequestError(`Validation error: ${issues}`));
      } else {
        next(err);
      }
    }
  };
};

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: string[] = [];
  errors.array().map((err: any) => extractedErrors.push(err.msg));
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: extractedErrors.join('. '),
    }
  });
};
