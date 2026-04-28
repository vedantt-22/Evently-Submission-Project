import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../datasource';
import { User } from '../entities/User';
import { AppError } from '../middleware/errorHandler';

const userRepo = () => AppDataSource.getRepository(User);

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;

    const existing = await userRepo().findOne({ where: { email } });
    if (existing) throw new AppError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = userRepo().create({ name, email, password: hashed });
    await userRepo().save(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await userRepo().findOne({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError('Invalid email or password', 401);

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn } as any);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}
