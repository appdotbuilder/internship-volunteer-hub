import { db } from '../db';
import { companyProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UploadCompanyCredentialsInput, type CompanyProfile } from '../schema';

export const uploadCompanyCredentials = async (input: UploadCompanyCredentialsInput): Promise<CompanyProfile> => {
  try {
    const result = await db.update(companyProfilesTable)
      .set({
        credentials_file_url: input.credentials_file_url,
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
    console.error('Company credentials upload failed:', error);
    throw error;
  }
};