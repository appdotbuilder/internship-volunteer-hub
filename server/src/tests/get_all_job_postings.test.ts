import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable, jobPostingsTable } from '../db/schema';
import { getAllJobPostings } from '../handlers/get_all_job_postings';

describe('getAllJobPostings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no job postings exist', async () => {
    const result = await getAllJobPostings();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all job postings from database', async () => {
    // Create prerequisite data: user and company profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userResult[0].id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    // Create test job postings
    await db.insert(jobPostingsTable)
      .values([
        {
          company_id: companyResult[0].id,
          title: 'Software Engineering Intern',
          description: 'Great internship opportunity',
          type: 'internship',
          location: 'San Francisco, CA',
          requirements: 'CS background',
          duration: '3 months',
          compensation: 'Stipend: $3000/month',
          application_deadline: new Date('2024-12-15')
        },
        {
          company_id: companyResult[0].id,
          title: 'Environmental Cleanup Volunteer',
          description: 'Help preserve environment',
          type: 'volunteer',
          location: 'Austin, TX',
          requirements: 'Willingness to work outdoors',
          duration: 'Weekends',
          compensation: 'Unpaid',
          application_deadline: null,
          is_active: false
        }
      ])
      .execute();

    const result = await getAllJobPostings();

    // Verify we get both job postings
    expect(result).toHaveLength(2);
    expect(Array.isArray(result)).toBe(true);

    // Verify first job posting
    const internship = result.find(job => job.title === 'Software Engineering Intern');
    expect(internship).toBeDefined();
    expect(internship!.company_id).toEqual(companyResult[0].id);
    expect(internship!.description).toEqual('Great internship opportunity');
    expect(internship!.type).toEqual('internship');
    expect(internship!.location).toEqual('San Francisco, CA');
    expect(internship!.requirements).toEqual('CS background');
    expect(internship!.duration).toEqual('3 months');
    expect(internship!.compensation).toEqual('Stipend: $3000/month');
    expect(internship!.application_deadline).toBeInstanceOf(Date);
    expect(internship!.is_active).toBe(true); // Default value
    expect(internship!.id).toBeDefined();
    expect(internship!.created_at).toBeInstanceOf(Date);
    expect(internship!.updated_at).toBeInstanceOf(Date);

    // Verify second job posting
    const volunteer = result.find(job => job.title === 'Environmental Cleanup Volunteer');
    expect(volunteer).toBeDefined();
    expect(volunteer!.company_id).toEqual(companyResult[0].id);
    expect(volunteer!.description).toEqual('Help preserve environment');
    expect(volunteer!.type).toEqual('volunteer');
    expect(volunteer!.location).toEqual('Austin, TX');
    expect(volunteer!.requirements).toEqual('Willingness to work outdoors');
    expect(volunteer!.duration).toEqual('Weekends');
    expect(volunteer!.compensation).toEqual('Unpaid');
    expect(volunteer!.application_deadline).toBeNull();
    expect(volunteer!.is_active).toBe(false); // Explicitly set to false
    expect(volunteer!.id).toBeDefined();
    expect(volunteer!.created_at).toBeInstanceOf(Date);
    expect(volunteer!.updated_at).toBeInstanceOf(Date);
  });

  it('should return job postings with different company IDs', async () => {
    // Create two companies
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'company1@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'company2@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Bob',
        last_name: 'Wilson'
      })
      .returning()
      .execute();

    const company1Result = await db.insert(companyProfilesTable)
      .values({
        user_id: user1Result[0].id,
        company_name: 'Company One'
      })
      .returning()
      .execute();

    const company2Result = await db.insert(companyProfilesTable)
      .values({
        user_id: user2Result[0].id,
        company_name: 'Company Two'
      })
      .returning()
      .execute();

    // Create job postings for both companies
    await db.insert(jobPostingsTable)
      .values([
        {
          company_id: company1Result[0].id,
          title: 'Marketing Intern',
          description: 'Marketing opportunity',
          type: 'internship'
        },
        {
          company_id: company2Result[0].id,
          title: 'Community Volunteer',
          description: 'Community service opportunity',
          type: 'volunteer'
        }
      ])
      .execute();

    const result = await getAllJobPostings();

    expect(result).toHaveLength(2);
    
    // Verify different company IDs
    const companyIds = result.map(job => job.company_id);
    expect(companyIds).toContain(company1Result[0].id);
    expect(companyIds).toContain(company2Result[0].id);
    expect(new Set(companyIds).size).toBe(2); // Should have 2 unique company IDs
  });

  it('should handle job postings with minimal required fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'minimal@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userResult[0].id,
        company_name: 'Minimal Company'
      })
      .returning()
      .execute();

    // Create job posting with only required fields
    await db.insert(jobPostingsTable)
      .values({
        company_id: companyResult[0].id,
        title: 'Basic Job',
        description: 'Basic job description',
        type: 'internship'
        // All other fields should be null or use defaults
      })
      .execute();

    const result = await getAllJobPostings();

    expect(result).toHaveLength(1);
    const job = result[0];
    
    // Verify required fields
    expect(job.title).toEqual('Basic Job');
    expect(job.description).toEqual('Basic job description');
    expect(job.type).toEqual('internship');
    expect(job.company_id).toEqual(companyResult[0].id);
    expect(job.is_active).toBe(true); // Default value
    
    // Verify nullable fields are null
    expect(job.location).toBeNull();
    expect(job.requirements).toBeNull();
    expect(job.duration).toBeNull();
    expect(job.compensation).toBeNull();
    expect(job.application_deadline).toBeNull();
    
    // Verify auto-generated fields
    expect(job.id).toBeDefined();
    expect(job.created_at).toBeInstanceOf(Date);
    expect(job.updated_at).toBeInstanceOf(Date);
  });
});