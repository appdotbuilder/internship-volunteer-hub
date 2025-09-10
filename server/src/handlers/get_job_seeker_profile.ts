import { db } from '../db';
import { jobSeekerProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type JobSeekerProfile } from '../schema';

export const getJobSeekerProfile = async (userId: number): Promise<JobSeekerProfile | null> => {
  try {
    const result = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.user_id, userId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get job seeker profile:', error);
    throw error;
  }
};