import { db } from '../db';
import { jobApplicationsTable } from '../db/schema';
import { type UpdateJobApplicationStatusInput, type JobApplication } from '../schema';
import { eq } from 'drizzle-orm';

export const updateApplicationStatus = async (input: UpdateJobApplicationStatusInput): Promise<JobApplication> => {
  try {
    // Update the application status and updated_at timestamp
    const result = await db.update(jobApplicationsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(jobApplicationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Job application with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Application status update failed:', error);
    throw error;
  }
};