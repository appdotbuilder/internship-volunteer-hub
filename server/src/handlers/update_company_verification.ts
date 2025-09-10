import { db } from '../db';
import { companyProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCompanyVerificationInput, type CompanyProfile } from '../schema';

export const updateCompanyVerification = async (input: UpdateCompanyVerificationInput): Promise<CompanyProfile> => {
  try {
    const result = await db.update(companyProfilesTable)
      .set({
        verification_status: input.status,
        updated_at: new Date()
      })
      .where(eq(companyProfilesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Company profile not found');
    }

    return result[0];
  } catch (error) {
    console.error('Company verification update failed:', error);
    throw error;
  }
};