import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    // Fetch all users from the database
    const result = await db.select()
      .from(usersTable)
      .execute();

    // Return the users - no numeric conversions needed for this table
    return result;
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
};