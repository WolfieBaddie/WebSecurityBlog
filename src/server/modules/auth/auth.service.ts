import { authRepository } from './auth.repository';
import { verifyPassword } from './password';
import { AppError } from '../../common/response';
import type { UserRole } from '../../middleware/auth';

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

function toPublicUser(row: { id: string; username: string; email: string; role: string }): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role as UserRole,
  };
}

export class AuthService {
  async login(identifier: string, password: string): Promise<PublicUser> {
    if (!identifier || !password) {
      throw AppError.badRequest('Username/email and password are required');
    }

    const user = await authRepository.findByIdentifier(identifier);
    if (!user) {
      // Same message for unknown user and wrong password (no account enumeration)
      throw AppError.unauthorized('Invalid credentials');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized('Invalid credentials');
    }

    return toPublicUser(user);
  }

  async getProfile(id: string): Promise<PublicUser> {
    const user = await authRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return toPublicUser(user);
  }
}

export const authService = new AuthService();
