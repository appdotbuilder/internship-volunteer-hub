import { db } from '../db';
import { jobPostingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type JobPosting } from '../schema';

export const getJobPosting = async (id: number): Promise<JobPosting | null> => {
  try {
    const results = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const jobPosting = results[0];
    return {
      ...jobPosting,
      // Convert date fields to proper Date objects
      created_at: jobPosting.created_at,
      updated_at: jobPosting.updated_at,
      application_deadline: jobPosting.application_deadline
    };
  } catch (error) {
    console.error('Failed to get job posting:', error);
    throw error;
  }
};