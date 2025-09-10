import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable } from '../db/schema';
import { type CreateCompanyProfileInput } from '../schema';
import { createCompanyProfile } from '../handlers/create_company_profile';
import { eq } from 'drizzle-orm';

// Test user to be created as prerequisite
const testUser = {
  email: 'company@test.com',
  password_hash: 'hashedpassword123',
  role: 'company' as const,
  first_name: 'John',
  last_name: 'Smith',
  phone: '+1234567890'
};

// Complete test input with all fields
const testInput: CreateCompanyProfileInput = {
  user_id: 1, // Will be set after user creation
  company_name: 'Tech Solutions Inc',
  description: 'A leading technology consulting company',
  website: 'https://techsolutions.com',
  location: 'San Francisco, CA',
  industry: 'Technology Consulting'
};

// Minimal test input
const minimalInput: CreateCompanyProfileInput = {
  user_id: 1, // Will be set after user creation
  company_name: 'Minimal Corp'
};

describe('createCompanyProfile', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    userId = userResult[0].id;
    testInput.user_id = userId;
    minimalInput.user_id = userId;
  });

  afterEach(resetDB);

  it('should create a company profile with all fields', async () => {
    const result = await createCompanyProfile(testInput);

    // Basic field validation
    expect(result.company_name).toEqual('Tech Solutions Inc');
    expect(result.description).toEqual('A leading technology consulting company');
    expect(result.website).toEqual('https://techsolutions.com');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.industry).toEqual('Technology Consulting');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a company profile with minimal required fields', async () => {
    const result = await createCompanyProfile(minimalInput);

    // Basic field validation
    expect(result.company_name).toEqual('Minimal Corp');
    expect(result.description).toBeNull();
    expect(result.website).toBeNull();
    expect(result.location).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save company profile to database', async () => {
    const result = await createCompanyProfile(testInput);

    // Query using proper drizzle syntax
    const profiles = await db.select()
      .from(companyProfilesTable)
      .where(eq(companyProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].company_name).toEqual('Tech Solutions Inc');
    expect(profiles[0].description).toEqual('A leading technology consulting company');
    expect(profiles[0].website).toEqual('https://techsolutions.com');
    expect(profiles[0].location).toEqual('San Francisco, CA');
    expect(profiles[0].industry).toEqual('Technology Consulting');
    expect(profiles[0].user_id).toEqual(userId);
    expect(profiles[0].created_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle undefined optional fields correctly', async () => {
    const inputWithUndefined: CreateCompanyProfileInput = {
      user_id: userId,
      company_name: 'Test Company',
      description: undefined,
      website: undefined,
      location: undefined,
      industry: undefined
    };

    const result = await createCompanyProfile(inputWithUndefined);

    expect(result.company_name).toEqual('Test Company');
    expect(result.description).toBeNull();
    expect(result.website).toBeNull();
    expect(result.location).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.user_id).toEqual(userId);
  });

  it('should throw error when referencing non-existent user', async () => {
    const invalidInput: CreateCompanyProfileInput = {
      ...testInput,
      user_id: 99999 // Non-existent user ID
    };

    await expect(createCompanyProfile(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle long company names', async () => {
    const longNameInput: CreateCompanyProfileInput = {
      user_id: userId,
      company_name: 'Very Long Company Name That Exceeds Normal Length But Should Still Work Fine'.repeat(2)
    };

    const result = await createCompanyProfile(longNameInput);
    
    expect(result.company_name).toEqual(longNameInput.company_name);
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
  });
});