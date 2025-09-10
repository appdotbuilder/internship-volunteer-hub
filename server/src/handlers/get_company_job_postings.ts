import { db } from '../db';
import { jobPostingsTable } from '../db/schema';
import { type JobPosting } from '../schema';
import { eq } from 'drizzle-orm';

export const getCompanyJobPostings = async (companyId: number): Promise<JobPosting[]> => {
  try {
    // Query job postings for the specific company
    const results = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.company_id, companyId))
      .execute();

    // Return results - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch company job postings:', error);
    throw error;
  }
};