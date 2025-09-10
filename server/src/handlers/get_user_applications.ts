import { db } from '../db';
import { jobApplicationsTable } from '../db/schema';
import { type JobApplication } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserApplications(jobSeekerId: number): Promise<JobApplication[]> {
  try {
    // Fetch all job applications for the given job seeker, ordered by most recent first
    const results = await db.select()
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.job_seeker_id, jobSeekerId))
      .orderBy(desc(jobApplicationsTable.applied_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch user applications:', error);
    throw error;
  }
}