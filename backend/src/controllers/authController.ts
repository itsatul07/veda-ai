import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name and password are required',
      });
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    const user = new User({ name, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name and password are required',
      });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const isMatch = user.password === password;
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      data: {
        id: user.userId,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};