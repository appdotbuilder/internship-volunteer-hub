import { db } from '../db';
import { jobPostingsTable } from '../db/schema';
import { type SearchJobsInput, type JobPosting } from '../schema';
import { eq, and, or, ilike, desc, SQL } from 'drizzle-orm';

export const searchJobPostings = async (input: SearchJobsInput): Promise<JobPosting[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter for active job postings
    conditions.push(eq(jobPostingsTable.is_active, true));

    // Add search query filter (searches title and description)
    if (input.query) {
      const searchQuery = `%${input.query}%`;
      conditions.push(
        or(
          ilike(jobPostingsTable.title, searchQuery),
          ilike(jobPostingsTable.description, searchQuery)
        )!
      );
    }

    // Add job type filter
    if (input.type) {
      conditions.push(eq(jobPostingsTable.type, input.type));
    }

    // Add location filter (case-insensitive partial match)
    if (input.location) {
      const locationQuery = `%${input.location}%`;
      conditions.push(ilike(jobPostingsTable.location, locationQuery));
    }

    // Add company filter
    if (input.company_id) {
      conditions.push(eq(jobPostingsTable.company_id, input.company_id));
    }

    // Build the complete query
    const results = await db.select()
      .from(jobPostingsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(jobPostingsTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();
    
    return results;
  } catch (error) {
    console.error('Job search failed:', error);
    throw error;
  }
};