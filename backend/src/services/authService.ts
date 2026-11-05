import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, CreateUserInput } from '../models/User';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class AuthService {
  static async signup(input: CreateUserInput): Promise<AuthResponse> {
    const existingUser = await UserModel.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const user = await UserModel.create(input);
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await UserModel.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await UserModel.verifyPassword(user, input.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await UserModel.updateLastLogin(user.id);
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  private static generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

    return jwt.sign({ userId }, secret, { expiresIn });
  }

  static verifyToken(token: string): { userId: string } {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.verify(token, secret) as { userId: string };
  }
}
