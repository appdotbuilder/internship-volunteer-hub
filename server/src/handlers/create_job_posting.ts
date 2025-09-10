import { db } from '../db';
import { jobPostingsTable, companyProfilesTable } from '../db/schema';
import { type CreateJobPostingInput, type JobPosting } from '../schema';
import { eq } from 'drizzle-orm';

export async function createJobPosting(input: CreateJobPostingInput): Promise<JobPosting> {
  try {
    // Verify the company exists before creating the job posting
    const company = await db.select()
      .from(companyProfilesTable)
      .where(eq(companyProfilesTable.id, input.company_id))
      .execute();

    if (company.length === 0) {
      throw new Error(`Company with id ${input.company_id} not found`);
    }

    // Insert job posting record
    const result = await db.insert(jobPostingsTable)
      .values({
        company_id: input.company_id,
        title: input.title,
        description: input.description,
        type: input.type,
        location: input.location ?? null,
        requirements: input.requirements ?? null,
        duration: input.duration ?? null,
        compensation: input.compensation ?? null,
        application_deadline: input.application_deadline ?? null,
        is_active: true // Always set to true for new postings
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Job posting creation failed:', error);
    throw error;
  }
}