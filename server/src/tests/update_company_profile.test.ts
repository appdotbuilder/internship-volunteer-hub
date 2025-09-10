import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable } from '../db/schema';
import { type UpdateCompanyProfileInput } from '../schema';
import { updateCompanyProfile } from '../handlers/update_company_profile';
import { eq } from 'drizzle-orm';

// Test input for updating company profile
const testUpdateInput: UpdateCompanyProfileInput = {
  id: 1,
  company_name: 'Updated Tech Corp',
  description: 'An updated technology company focused on innovation',
  website: 'https://updated-tech-corp.com',
  location: 'San Francisco, CA',
  industry: 'Technology'
};

describe('updateCompanyProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a company profile', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company@example.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'John',
        last_name: 'Doe',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create initial company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Old Company Name',
        description: 'Old description',
        website: 'https://old-website.com',
        location: 'Old Location',
        industry: 'Old Industry'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Update the company profile
    const result = await updateCompanyProfile({
      id: companyId,
      company_name: testUpdateInput.company_name,
      description: testUpdateInput.description,
      website: testUpdateInput.website,
      location: testUpdateInput.location,
      industry: testUpdateInput.industry
    });

    // Verify updated fields
    expect(result.id).toEqual(companyId);
    expect(result.user_id).toEqual(userId);
    expect(result.company_name).toEqual('Updated Tech Corp');
    expect(result.description).toEqual('An updated technology company focused on innovation');
    expect(result.website).toEqual('https://updated-tech-corp.com');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.industry).toEqual('Technology');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company2@example.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create initial company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Original Company',
        description: 'Original description',
        website: 'https://original.com',
        location: 'Original Location',
        industry: 'Original Industry'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Update only company name and location
    const result = await updateCompanyProfile({
      id: companyId,
      company_name: 'Partially Updated Corp',
      location: 'New York, NY'
    });

    // Verify only specified fields were updated, others remain unchanged
    expect(result.company_name).toEqual('Partially Updated Corp');
    expect(result.location).toEqual('New York, NY');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.website).toEqual('https://original.com'); // Unchanged
    expect(result.industry).toEqual('Original Industry'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'persistence@example.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Test',
        last_name: 'User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create initial company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Pre-update Company',
        description: null,
        website: null,
        location: null,
        industry: null
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Update the company profile
    await updateCompanyProfile({
      id: companyId,
      company_name: 'Post-update Company',
      description: 'New description',
      website: 'https://new-website.com'
    });

    // Query database directly to verify persistence
    const savedProfiles = await db.select()
      .from(companyProfilesTable)
      .where(eq(companyProfilesTable.id, companyId))
      .execute();

    expect(savedProfiles).toHaveLength(1);
    const saved = savedProfiles[0];
    expect(saved.company_name).toEqual('Post-update Company');
    expect(saved.description).toEqual('New description');
    expect(saved.website).toEqual('https://new-website.com');
    expect(saved.location).toBeNull(); // Unchanged
    expect(saved.industry).toBeNull(); // Unchanged
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'null-test@example.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Null',
        last_name: 'Test',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create initial company profile with some values
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Company with Values',
        description: 'Has description',
        website: 'https://has-website.com',
        location: 'Has location',
        industry: 'Has industry'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Update profile to set some fields to null
    const result = await updateCompanyProfile({
      id: companyId,
      company_name: 'Updated Company',
      description: null,
      website: null
    });

    // Verify null values were set correctly
    expect(result.company_name).toEqual('Updated Company');
    expect(result.description).toBeNull();
    expect(result.website).toBeNull();
    expect(result.location).toEqual('Has location'); // Unchanged
    expect(result.industry).toEqual('Has industry'); // Unchanged
  });

  it('should throw error when company profile does not exist', async () => {
    const nonExistentId = 99999;

    await expect(updateCompanyProfile({
      id: nonExistentId,
      company_name: 'This should fail'
    })).rejects.toThrow(/Company profile with id 99999 not found/i);
  });

  it('should update the updated_at timestamp', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'timestamp@example.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Time',
        last_name: 'Stamp',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create initial company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Timestamp Company',
        description: 'Test timestamp updates',
        website: null,
        location: null,
        industry: null
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;
    const originalUpdatedAt = companyResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the company profile
    const result = await updateCompanyProfile({
      id: companyId,
      description: 'Updated description for timestamp test'
    });

    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.created_at).toEqual(companyResult[0].created_at); // Should remain unchanged
  });
});