import { db } from '../db';
import { jobSeekerProfilesTable } from '../db/schema';
import { type CreateJobSeekerProfileInput, type JobSeekerProfile } from '../schema';

export const createJobSeekerProfile = async (input: CreateJobSeekerProfileInput): Promise<JobSeekerProfile> => {
  try {
    // Insert job seeker profile record
    const result = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: input.user_id,
        bio: input.bio || null,
        skills: input.skills || null,
        education: input.education || null,
        experience: input.experience || null,
        resume_url: input.resume_url || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Job seeker profile creation failed:', error);
    throw error;
  }
};