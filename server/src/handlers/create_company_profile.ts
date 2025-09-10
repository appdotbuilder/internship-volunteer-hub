import { db } from '../db';
import { companyProfilesTable } from '../db/schema';
import { type CreateCompanyProfileInput, type CompanyProfile } from '../schema';

export const createCompanyProfile = async (input: CreateCompanyProfileInput): Promise<CompanyProfile> => {
  try {
    // Insert company profile record
    const result = await db.insert(companyProfilesTable)
      .values({
        user_id: input.user_id,
        company_name: input.company_name,
        description: input.description ?? null,
        website: input.website ?? null,
        location: input.location ?? null,
        industry: input.industry ?? null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Company profile creation failed:', error);
    throw error;
  }
};