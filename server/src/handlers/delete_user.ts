import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteUser(id: number): Promise<boolean> {
  try {
    // Delete the user by ID - cascade deletion will handle associated data
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    // Return true if a user was actually deleted, false if user didn't exist
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}