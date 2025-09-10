import { db } from '../db';
import { companyProfilesTable } from '../db/schema';
import { type CompanyProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const getCompanyProfile = async (userId: number): Promise<CompanyProfile | null> => {
  try {
    // Query company profile by user_id
    const results = await db.select()
      .from(companyProfilesTable)
      .where(eq(companyProfilesTable.user_id, userId))
      .execute();

    // Return null if no profile found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) result
    return results[0];
  } catch (error) {
    console.error('Failed to fetch company profile:', error);
    throw error;
  }
};