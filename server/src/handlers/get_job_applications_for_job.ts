import { db } from '../db';
import { jobApplicationsTable } from '../db/schema';
import { type JobApplication } from '../schema';
import { eq } from 'drizzle-orm';

export const getJobApplicationsForJob = async (jobPostingId: number): Promise<JobApplication[]> => {
  try {
    const results = await db.select()
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.job_posting_id, jobPostingId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch job applications for job posting:', error);
    throw error;
  }
};