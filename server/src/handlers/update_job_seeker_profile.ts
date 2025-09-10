import { db } from '../db';
import { jobSeekerProfilesTable } from '../db/schema';
import { type UpdateJobSeekerProfileInput, type JobSeekerProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobSeekerProfile = async (input: UpdateJobSeekerProfileInput): Promise<JobSeekerProfile> => {
  try {
    // Build the update object with only the provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    // Only include fields that are explicitly provided in the input
    if (input.bio !== undefined) {
      updateData['bio'] = input.bio;
    }
    
    if (input.skills !== undefined) {
      updateData['skills'] = input.skills;
    }
    
    if (input.education !== undefined) {
      updateData['education'] = input.education;
    }
    
    if (input.experience !== undefined) {
      updateData['experience'] = input.experience;
    }
    
    if (input.resume_url !== undefined) {
      updateData['resume_url'] = input.resume_url;
    }

    // Update the job seeker profile record
    const result = await db.update(jobSeekerProfilesTable)
      .set(updateData)
      .where(eq(jobSeekerProfilesTable.id, input.id))
      .returning()
      .execute();

    // Check if profile was found and updated
    if (result.length === 0) {
      throw new Error(`Job seeker profile with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Job seeker profile update failed:', error);
    throw error;
  }
};