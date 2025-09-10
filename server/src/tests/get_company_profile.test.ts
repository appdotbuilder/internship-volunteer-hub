import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable } from '../db/schema';
import { getCompanyProfile } from '../handlers/get_company_profile';
import { eq } from 'drizzle-orm';

describe('getCompanyProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return company profile when it exists', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a company profile
    const profileResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Tech Innovation Corp',
        description: 'Leading technology company focused on innovative solutions',
        website: 'https://techinnovation.com',
        location: 'San Francisco, CA',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const expectedProfile = profileResult[0];

    // Test the handler
    const result = await getCompanyProfile(userId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(expectedProfile.id);
    expect(result!.user_id).toBe(userId);
    expect(result!.company_name).toBe('Tech Innovation Corp');
    expect(result!.description).toBe('Leading technology company focused on innovative solutions');
    expect(result!.website).toBe('https://techinnovation.com');
    expect(result!.location).toBe('San Francisco, CA');
    expect(result!.industry).toBe('Technology');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when company profile does not exist', async () => {
    // Create a test user but no company profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Test the handler
    const result = await getCompanyProfile(userId);

    expect(result).toBeNull();
  });

  it('should return null for non-existent user id', async () => {
    const nonExistentUserId = 99999;

    // Test the handler
    const result = await getCompanyProfile(nonExistentUserId);

    expect(result).toBeNull();
  });

  it('should handle company profile with minimal fields', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'minimal@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Min',
        last_name: 'Company'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a company profile with only required fields
    const profileResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Minimal Corp'
        // All other fields are optional/nullable
      })
      .returning()
      .execute();

    const expectedProfile = profileResult[0];

    // Test the handler
    const result = await getCompanyProfile(userId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(expectedProfile.id);
    expect(result!.user_id).toBe(userId);
    expect(result!.company_name).toBe('Minimal Corp');
    expect(result!.description).toBeNull();
    expect(result!.website).toBeNull();
    expect(result!.location).toBeNull();
    expect(result!.industry).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify data persistence in database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'persist@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Persist',
        last_name: 'Test'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a company profile
    await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Persistent Corp',
        description: 'A company that persists',
        website: 'https://persistent.com',
        location: 'Remote',
        industry: 'Software'
      })
      .execute();

    // Get the profile using the handler
    const result = await getCompanyProfile(userId);

    // Verify the data exists in the database by querying directly
    const dbProfiles = await db.select()
      .from(companyProfilesTable)
      .where(eq(companyProfilesTable.user_id, userId))
      .execute();

    expect(dbProfiles).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(dbProfiles[0].id);
    expect(result!.company_name).toBe(dbProfiles[0].company_name);
    expect(result!.description).toBe(dbProfiles[0].description);
    expect(result!.website).toBe(dbProfiles[0].website);
    expect(result!.location).toBe(dbProfiles[0].location);
    expect(result!.industry).toBe(dbProfiles[0].industry);
  });
});