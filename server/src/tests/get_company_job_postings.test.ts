import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable, jobPostingsTable } from '../db/schema';
import { getCompanyJobPostings } from '../handlers/get_company_job_postings';
import { eq } from 'drizzle-orm';

describe('getCompanyJobPostings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all job postings for a specific company', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'company@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Tech',
        last_name: 'Corp'
      })
      .returning()
      .execute();

    // Create company profile
    const [company] = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'TechCorp Inc',
        description: 'Leading technology company',
        location: 'San Francisco, CA'
      })
      .returning()
      .execute();

    // Create multiple job postings for this company
    const jobPostings = await db.insert(jobPostingsTable)
      .values([
        {
          company_id: company.id,
          title: 'Software Engineering Intern',
          description: 'Work with our development team',
          type: 'internship',
          location: 'San Francisco, CA',
          requirements: 'CS background',
          duration: '3 months',
          compensation: 'Stipend: $3000/month'
        },
        {
          company_id: company.id,
          title: 'Marketing Volunteer',
          description: 'Help with marketing campaigns',
          type: 'volunteer',
          location: 'Remote',
          duration: '6 months'
        },
        {
          company_id: company.id,
          title: 'Data Science Intern',
          description: 'Analyze user data and create insights',
          type: 'internship',
          location: 'San Francisco, CA',
          compensation: 'Paid internship'
        }
      ])
      .returning()
      .execute();

    // Test the handler
    const results = await getCompanyJobPostings(company.id);

    // Should return all 3 job postings
    expect(results).toHaveLength(3);

    // Verify all postings belong to the correct company
    results.forEach(posting => {
      expect(posting.company_id).toEqual(company.id);
    });

    // Verify specific job posting details
    const internshipPosting = results.find(p => p.title === 'Software Engineering Intern');
    expect(internshipPosting).toBeDefined();
    expect(internshipPosting!.description).toEqual('Work with our development team');
    expect(internshipPosting!.type).toEqual('internship');
    expect(internshipPosting!.location).toEqual('San Francisco, CA');
    expect(internshipPosting!.is_active).toEqual(true); // Default value

    const volunteerPosting = results.find(p => p.title === 'Marketing Volunteer');
    expect(volunteerPosting).toBeDefined();
    expect(volunteerPosting!.type).toEqual('volunteer');
    expect(volunteerPosting!.location).toEqual('Remote');
  });

  it('should return empty array when company has no job postings', async () => {
    // Create test user and company without job postings
    const [user] = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Empty',
        last_name: 'Company'
      })
      .returning()
      .execute();

    const [company] = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Empty Corp'
      })
      .returning()
      .execute();

    const results = await getCompanyJobPostings(company.id);

    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-existent company', async () => {
    const results = await getCompanyJobPostings(99999);

    expect(results).toHaveLength(0);
  });

  it('should only return job postings for the specified company', async () => {
    // Create two companies
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'company1@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Company',
        last_name: 'One'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'company2@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Company',
        last_name: 'Two'
      })
      .returning()
      .execute();

    const [company1] = await db.insert(companyProfilesTable)
      .values({
        user_id: user1.id,
        company_name: 'Company One Inc'
      })
      .returning()
      .execute();

    const [company2] = await db.insert(companyProfilesTable)
      .values({
        user_id: user2.id,
        company_name: 'Company Two LLC'
      })
      .returning()
      .execute();

    // Create job postings for both companies
    await db.insert(jobPostingsTable)
      .values([
        {
          company_id: company1.id,
          title: 'Company 1 Intern',
          description: 'Job at company 1',
          type: 'internship'
        },
        {
          company_id: company1.id,
          title: 'Company 1 Volunteer',
          description: 'Volunteer at company 1',
          type: 'volunteer'
        },
        {
          company_id: company2.id,
          title: 'Company 2 Intern',
          description: 'Job at company 2',
          type: 'internship'
        }
      ])
      .execute();

    // Get postings for company 1
    const company1Results = await getCompanyJobPostings(company1.id);

    // Should only return company 1's postings
    expect(company1Results).toHaveLength(2);
    company1Results.forEach(posting => {
      expect(posting.company_id).toEqual(company1.id);
      expect(posting.title).toContain('Company 1');
    });

    // Get postings for company 2
    const company2Results = await getCompanyJobPostings(company2.id);

    // Should only return company 2's posting
    expect(company2Results).toHaveLength(1);
    expect(company2Results[0].company_id).toEqual(company2.id);
    expect(company2Results[0].title).toEqual('Company 2 Intern');
  });

  it('should return job postings with correct timestamp fields', async () => {
    // Create test data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'timestamp@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const [company] = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Timestamp Corp'
      })
      .returning()
      .execute();

    const testDeadline = new Date('2024-12-31');
    await db.insert(jobPostingsTable)
      .values({
        company_id: company.id,
        title: 'Timestamp Test Job',
        description: 'Testing timestamp fields',
        type: 'internship',
        application_deadline: testDeadline
      })
      .execute();

    const results = await getCompanyJobPostings(company.id);

    expect(results).toHaveLength(1);
    const posting = results[0];
    
    // Verify timestamp fields
    expect(posting.created_at).toBeInstanceOf(Date);
    expect(posting.updated_at).toBeInstanceOf(Date);
    expect(posting.application_deadline).toBeInstanceOf(Date);
    expect(posting.application_deadline!.getTime()).toEqual(testDeadline.getTime());
  });

  it('should include both active and inactive job postings', async () => {
    // Create test data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'active@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Active',
        last_name: 'Company'
      })
      .returning()
      .execute();

    const [company] = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Active Corp'
      })
      .returning()
      .execute();

    // Create both active and inactive job postings
    await db.insert(jobPostingsTable)
      .values([
        {
          company_id: company.id,
          title: 'Active Job',
          description: 'This job is active',
          type: 'internship',
          is_active: true
        },
        {
          company_id: company.id,
          title: 'Inactive Job',
          description: 'This job is inactive',
          type: 'volunteer',
          is_active: false
        }
      ])
      .execute();

    const results = await getCompanyJobPostings(company.id);

    expect(results).toHaveLength(2);
    
    const activeJob = results.find(p => p.title === 'Active Job');
    const inactiveJob = results.find(p => p.title === 'Inactive Job');
    
    expect(activeJob).toBeDefined();
    expect(activeJob!.is_active).toEqual(true);
    
    expect(inactiveJob).toBeDefined();
    expect(inactiveJob!.is_active).toEqual(false);
  });
});