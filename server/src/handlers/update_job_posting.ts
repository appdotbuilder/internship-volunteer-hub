import { db } from '../db';
import { jobPostingsTable } from '../db/schema';
import { type UpdateJobPostingInput, type JobPosting } from '../schema';
import { eq } from 'drizzle-orm';

export const updateJobPosting = async (input: UpdateJobPostingInput): Promise<JobPosting> => {
  try {
    // Build update data object, only including fields that are provided
    const updateData: Partial<typeof jobPostingsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.location !== undefined) {
      updateData.location = input.location;
    }

    if (input.requirements !== undefined) {
      updateData.requirements = input.requirements;
    }

    if (input.duration !== undefined) {
      updateData.duration = input.duration;
    }

    if (input.compensation !== undefined) {
      updateData.compensation = input.compensation;
    }

    if (input.application_deadline !== undefined) {
      updateData.application_deadline = input.application_deadline;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the job posting
    const result = await db.update(jobPostingsTable)
      .set(updateData)
      .where(eq(jobPostingsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Job posting with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Job posting update failed:', error);
    throw error;
  }
};