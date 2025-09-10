import { db } from '../db';
import { jobApplicationsTable, jobPostingsTable, jobSeekerProfilesTable } from '../db/schema';
import { type CreateJobApplicationInput, type JobApplication } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createJobApplication = async (input: CreateJobApplicationInput): Promise<JobApplication> => {
  try {
    // First, verify that the job posting exists and is active
    const jobPosting = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, input.job_posting_id))
      .execute();

    if (jobPosting.length === 0) {
      throw new Error('Job posting not found');
    }

    if (!jobPosting[0].is_active) {
      throw new Error('Job posting is not active');
    }

    // Verify that the job seeker profile exists
    const jobSeekerProfile = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.id, input.job_seeker_id))
      .execute();

    if (jobSeekerProfile.length === 0) {
      throw new Error('Job seeker profile not found');
    }

    // Check if the user has already applied for this job
    const existingApplication = await db.select()
      .from(jobApplicationsTable)
      .where(
        and(
          eq(jobApplicationsTable.job_posting_id, input.job_posting_id),
          eq(jobApplicationsTable.job_seeker_id, input.job_seeker_id)
        )
      )
      .execute();

    if (existingApplication.length > 0) {
      throw new Error('You have already applied for this job');
    }

    // Create the job application
    const result = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: input.job_posting_id,
        job_seeker_id: input.job_seeker_id,
        cover_letter: input.cover_letter || null,
        status: 'pending'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Job application creation failed:', error);
    throw error;
  }
};