import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../modules/auth/token.service';
import { COOKIE_NAMES } from '../modules/auth/cookie.helper';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  tenantId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      idempotencyKey?: string;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const payload = tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token has expired'));
    } else {
      next(new UnauthorizedError('Invalid access token'));
    }
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not authorized to access this resource`));
    }

    next();
  };
};

export const checkPermissions = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // Role-permission mapping matrix
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'],
      fleet_manager: ['fleet:read', 'driver:read', 'driver:update', 'ride:read'],
      driver: ['ride:read', 'ride:accept', 'ride:status', 'driver:location'],
      rider: ['ride:create', 'ride:read', 'ride:cancel', 'ride:rate'],
      support: ['ride:read', 'user:read'],
    };

    const userPerms = rolePermissions[req.user.role] || [];
    const hasPerm = userPerms.includes('*') || requiredPermissions.every((p) => userPerms.includes(p));

    if (!hasPerm) {
      return next(new ForbiddenError('Insufficient permissions for operation'));
    }

    next();
  };
};

export const enforceTenantIsolation = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(new UnauthorizedError());

  // If request targets or creates multi-tenant resource
  const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (requestedTenantId && req.user.role !== 'admin' && req.user.tenantId !== requestedTenantId) {
    return next(new ForbiddenError('Access to foreign tenant data is forbidden'));
  }

  next();
};
