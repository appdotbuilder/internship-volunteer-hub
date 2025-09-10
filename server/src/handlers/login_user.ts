import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // For this implementation, we'll assume passwords are stored as plain text
    // In a real application, this should use proper password hashing (bcrypt, argon2, etc.)
    if (input.password !== user.password_hash) {
      throw new Error('Invalid email or password');
    }

    // Return user data
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};