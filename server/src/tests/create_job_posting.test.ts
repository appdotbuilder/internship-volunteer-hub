import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jobPostingsTable, usersTable, companyProfilesTable } from '../db/schema';
import { type CreateJobPostingInput } from '../schema';
import { createJobPosting } from '../handlers/create_job_posting';
import { eq } from 'drizzle-orm';

// Helper function to create a test company
const createTestCompany = async () => {
  // First create a user
  const userResult = await db.insert(usersTable)
    .values({
      email: 'company@test.com',
      password_hash: 'hashed_password',
      role: 'company' as const,
      first_name: 'Test',
      last_name: 'Company'
    })
    .returning()
    .execute();

  // Then create company profile
  const companyResult = await db.insert(companyProfilesTable)
    .values({
      user_id: userResult[0].id,
      company_name: 'Test Company'
    })
    .returning()
    .execute();

  return companyResult[0];
};

describe('createJobPosting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job posting with all fields', async () => {
    const company = await createTestCompany();
    
    const input: CreateJobPostingInput = {
      company_id: company.id,
      title: 'Software Engineering Internship',
      description: 'A great opportunity to learn software development',
      type: 'internship',
      location: 'San Francisco, CA',
      requirements: 'Computer Science major, basic programming knowledge',
      duration: '3 months',
      compensation: 'Paid internship - $2000/month',
      application_deadline: new Date('2024-12-31')
    };

    const result = await createJobPosting(input);

    // Verify basic field mapping
    expect(result.company_id).toEqual(company.id);
    expect(result.title).toEqual('Software Engineering Internship');
    expect(result.description).toEqual(input.description);
    expect(result.type).toEqual('internship');
    expect(typeof result.location).toBe('string');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a job posting with minimal fields', async () => {
    const company = await createTestCompany();
    
    const input: CreateJobPostingInput = {
      company_id: company.id,
      title: 'Volunteer Position',
      description: 'Help us with community outreach',
      type: 'volunteer'
    };

    const result = await createJobPosting(input);

    // Verify required fields
    expect(result.company_id).toEqual(company.id);
    expect(result.title).toEqual('Volunteer Position');
    expect(result.description).toEqual(input.description);
    expect(result.type).toEqual('volunteer');
    
    // Verify optional fields are null
    expect(result.location).toBeNull();
    expect(result.requirements).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.compensation).toBeNull();
    expect(result.application_deadline).toBeNull();
    
    // Verify defaults
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save job posting to database', async () => {
    const company = await createTestCompany();
    
    const input: CreateJobPostingInput = {
      company_id: company.id,
      title: 'Software Engineering Internship',
      description: 'A great opportunity to learn software development',
      type: 'internship',
      location: 'San Francisco, CA'
    };

    const result = await createJobPosting(input);

    // Query database to verify the job posting was saved
    const savedJobPostings = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, result.id))
      .execute();

    expect(savedJobPostings).toHaveLength(1);
    const savedJobPosting = savedJobPostings[0];
    
    expect(savedJobPosting.company_id).toEqual(company.id);
    expect(savedJobPosting.title).toEqual('Software Engineering Internship');
    expect(savedJobPosting.type).toEqual('internship');
    expect(savedJobPosting.is_active).toBe(true);
    expect(savedJobPosting.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when company does not exist', async () => {
    const input: CreateJobPostingInput = {
      company_id: 999,
      title: 'Software Engineering Internship',
      description: 'A great opportunity to learn software development',
      type: 'internship'
    };

    await expect(createJobPosting(input)).rejects.toThrow(/company with id 999 not found/i);
  });

  it('should handle date fields correctly', async () => {
    const company = await createTestCompany();
    const deadlineDate = new Date('2024-06-15T10:00:00Z');
    
    const input: CreateJobPostingInput = {
      company_id: company.id,
      title: 'Volunteer Position',
      description: 'Help us with community outreach',
      type: 'volunteer',
      application_deadline: deadlineDate
    };

    const result = await createJobPosting(input);

    expect(result.application_deadline).toBeInstanceOf(Date);
    expect(result.application_deadline?.getTime()).toEqual(deadlineDate.getTime());
  });
});