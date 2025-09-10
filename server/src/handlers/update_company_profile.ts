import { db } from '../db';
import { companyProfilesTable } from '../db/schema';
import { type UpdateCompanyProfileInput, type CompanyProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCompanyProfile = async (input: UpdateCompanyProfileInput): Promise<CompanyProfile> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof companyProfilesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.company_name !== undefined) {
      updateData.company_name = input.company_name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.website !== undefined) {
      updateData.website = input.website;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    if (input.industry !== undefined) {
      updateData.industry = input.industry;
    }
    if (input.credentials_file_url !== undefined) {
      updateData.credentials_file_url = input.credentials_file_url;
    }

    // Update the company profile
    const result = await db.update(companyProfilesTable)
      .set(updateData)
      .where(eq(companyProfilesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Company profile with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Company profile update failed:', error);
    throw error;
  }
};