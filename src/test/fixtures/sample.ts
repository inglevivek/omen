import { Request, Response } from 'express';
import { Router } from 'express';

export interface UserDto {
  id: number;
  name: string;
  email: string;
}

/**
 * Handles user-related HTTP operations
 */
export class UserController {
  private router: Router;
  private baseUrl: string;

  constructor() {
    this.router = Router();
    this.baseUrl = '/api/users';
  }

  /**
   * Returns a list of all users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    res.json([]);
  }

  async createUser(req: Request, res: Response): Promise<void> {
    res.status(201).json({});
  }
}

/**
 * Standalone utility — formats a user display name
 */
export async function formatUserName(user: UserDto): Promise<string> {
  return `${user.name} <${user.email}>`;
}

export function getUserById(id: number): UserDto | null {
  return null;
}
