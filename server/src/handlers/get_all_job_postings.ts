import { db } from '../db';
import { jobPostingsTable } from '../db/schema';
import { type JobPosting } from '../schema';

export const getAllJobPostings = async (): Promise<JobPosting[]> => {
  try {
    // Fetch all job postings from the database
    const results = await db.select()
      .from(jobPostingsTable)
      .execute();

    // Return the results - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch job postings:', error);
    throw error;
  }
};