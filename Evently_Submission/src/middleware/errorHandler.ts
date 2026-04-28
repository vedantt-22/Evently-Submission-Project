import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Validation errors from express-validator are handled in controllers
  if (err.name === 'AppError') {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // TypeORM unique constraint
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({ message: 'A record with this value already exists' });
    return;
  }

  console.error('[Error]', err);
  res.status(500).json({ message: 'Internal server error' });
}
