import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable, jobPostingsTable } from '../db/schema';
import { getJobPosting } from '../handlers/get_job_posting';

describe('getJobPosting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a job posting by ID', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'John',
        last_name: 'Doe',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Test Company',
        description: 'A company for testing',
        website: 'https://test.com',
        location: 'San Francisco, CA',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create a test job posting
    const jobPostingResult = await db.insert(jobPostingsTable)
      .values({
        company_id: company.id,
        title: 'Software Engineer Intern',
        description: 'Join our engineering team for an exciting internship',
        type: 'internship',
        location: 'San Francisco, CA',
        requirements: 'Knowledge of JavaScript and React',
        duration: '3 months',
        compensation: 'Stipend: $3000/month',
        application_deadline: new Date('2024-12-31'),
        is_active: true
      })
      .returning()
      .execute();

    const createdJobPosting = jobPostingResult[0];

    // Test getting the job posting
    const result = await getJobPosting(createdJobPosting.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJobPosting.id);
    expect(result!.company_id).toEqual(company.id);
    expect(result!.title).toEqual('Software Engineer Intern');
    expect(result!.description).toEqual('Join our engineering team for an exciting internship');
    expect(result!.type).toEqual('internship');
    expect(result!.location).toEqual('San Francisco, CA');
    expect(result!.requirements).toEqual('Knowledge of JavaScript and React');
    expect(result!.duration).toEqual('3 months');
    expect(result!.compensation).toEqual('Stipend: $3000/month');
    expect(result!.application_deadline).toBeInstanceOf(Date);
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when job posting is not found', async () => {
    const result = await getJobPosting(999);
    expect(result).toBeNull();
  });

  it('should handle job posting with null optional fields', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company2@test.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: null
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Minimal Company',
        description: null,
        website: null,
        location: null,
        industry: null
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create a job posting with minimal required fields
    const jobPostingResult = await db.insert(jobPostingsTable)
      .values({
        company_id: company.id,
        title: 'Basic Job',
        description: 'A basic job description',
        type: 'volunteer',
        location: null,
        requirements: null,
        duration: null,
        compensation: null,
        application_deadline: null
      })
      .returning()
      .execute();

    const createdJobPosting = jobPostingResult[0];

    // Test getting the job posting
    const result = await getJobPosting(createdJobPosting.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJobPosting.id);
    expect(result!.title).toEqual('Basic Job');
    expect(result!.description).toEqual('A basic job description');
    expect(result!.type).toEqual('volunteer');
    expect(result!.location).toBeNull();
    expect(result!.requirements).toBeNull();
    expect(result!.duration).toBeNull();
    expect(result!.compensation).toBeNull();
    expect(result!.application_deadline).toBeNull();
    expect(result!.is_active).toEqual(true); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle inactive job posting', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company3@test.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Bob',
        last_name: 'Wilson'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Inactive Company',
        description: 'Company with inactive job'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create an inactive job posting
    const jobPostingResult = await db.insert(jobPostingsTable)
      .values({
        company_id: company.id,
        title: 'Inactive Job',
        description: 'This job is no longer active',
        type: 'internship',
        is_active: false
      })
      .returning()
      .execute();

    const createdJobPosting = jobPostingResult[0];

    // Test getting the inactive job posting - should still return it
    const result = await getJobPosting(createdJobPosting.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdJobPosting.id);
    expect(result!.title).toEqual('Inactive Job');
    expect(result!.is_active).toEqual(false);
  });
});