import { db } from '../db';
import { jobPostingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteJobPosting(id: number): Promise<boolean> {
  try {
    // Delete the job posting by ID
    const result = await db.delete(jobPostingsTable)
      .where(eq(jobPostingsTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Job posting deletion failed:', error);
    throw error;
  }
}