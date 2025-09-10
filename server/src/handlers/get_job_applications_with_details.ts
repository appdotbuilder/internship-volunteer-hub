import { db } from '../db';
import { jobApplicationsTable, jobSeekerProfilesTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface JobApplicationWithDetails {
  id: number;
  job_seeker_name: string;
  job_seeker_email: string;
  cover_letter: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: Date;
  updated_at: Date;
}

export const getJobApplicationsWithDetails = async (jobPostingId: number): Promise<JobApplicationWithDetails[]> => {
  try {
    const results = await db
      .select({
        application_id: jobApplicationsTable.id,
        application_status: jobApplicationsTable.status,
        application_cover_letter: jobApplicationsTable.cover_letter,
        application_applied_at: jobApplicationsTable.applied_at,
        application_updated_at: jobApplicationsTable.updated_at,
        job_seeker_first_name: usersTable.first_name,
        job_seeker_last_name: usersTable.last_name,
        job_seeker_email: usersTable.email,
      })
      .from(jobApplicationsTable)
      .innerJoin(jobSeekerProfilesTable, eq(jobApplicationsTable.job_seeker_id, jobSeekerProfilesTable.id))
      .innerJoin(usersTable, eq(jobSeekerProfilesTable.user_id, usersTable.id))
      .where(eq(jobApplicationsTable.job_posting_id, jobPostingId))
      .execute();

    return results.map(result => ({
      id: result.application_id,
      job_seeker_name: `${result.job_seeker_first_name} ${result.job_seeker_last_name}`,
      job_seeker_email: result.job_seeker_email,
      cover_letter: result.application_cover_letter,
      status: result.application_status,
      applied_at: result.application_applied_at,
      updated_at: result.application_updated_at,
    }));
  } catch (error) {
    console.error('Failed to get job applications with details:', error);
    throw error;
  }
};