import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobSeekerProfilesTable, companyProfilesTable, jobPostingsTable, jobApplicationsTable } from '../db/schema';
import { getJobApplicationsForJob } from '../handlers/get_job_applications_for_job';
import { eq } from 'drizzle-orm';

describe('getJobApplicationsForJob', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all applications for a specific job posting', async () => {
    // Create test users
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Tech',
        last_name: 'Corp'
      })
      .returning()
      .execute();

    const [jobSeeker1] = await db.insert(usersTable)
      .values({
        email: 'jobseeker1@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [jobSeeker2] = await db.insert(usersTable)
      .values({
        email: 'jobseeker2@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    // Create profiles
    const [companyProfile] = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser.id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const [jobSeekerProfile1] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeeker1.id
      })
      .returning()
      .execute();

    const [jobSeekerProfile2] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeeker2.id
      })
      .returning()
      .execute();

    // Create job postings
    const [jobPosting1] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Intern',
        description: 'Great internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    const [jobPosting2] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Marketing Volunteer',
        description: 'Volunteer opportunity',
        type: 'volunteer'
      })
      .returning()
      .execute();

    // Create applications for job posting 1
    await db.insert(jobApplicationsTable)
      .values([
        {
          job_posting_id: jobPosting1.id,
          job_seeker_id: jobSeekerProfile1.id,
          status: 'pending',
          cover_letter: 'I am very interested in this position'
        },
        {
          job_posting_id: jobPosting1.id,
          job_seeker_id: jobSeekerProfile2.id,
          status: 'accepted',
          cover_letter: 'Please consider my application'
        }
      ])
      .execute();

    // Create application for job posting 2 (should not appear in results)
    await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting2.id,
        job_seeker_id: jobSeekerProfile1.id,
        status: 'pending',
        cover_letter: 'Different job application'
      })
      .execute();

    // Test the handler
    const applications = await getJobApplicationsForJob(jobPosting1.id);

    expect(applications).toHaveLength(2);
    expect(applications[0].job_posting_id).toBe(jobPosting1.id);
    expect(applications[1].job_posting_id).toBe(jobPosting1.id);
    
    // Verify all applications belong to the correct job posting
    applications.forEach(app => {
      expect(app.job_posting_id).toBe(jobPosting1.id);
      expect(app.id).toBeDefined();
      expect(app.job_seeker_id).toBeDefined();
      expect(app.status).toBeDefined();
      expect(app.applied_at).toBeInstanceOf(Date);
      expect(app.updated_at).toBeInstanceOf(Date);
    });

    // Verify the specific applications exist
    const statuses = applications.map(app => app.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('accepted');
  });

  it('should return empty array for job posting with no applications', async () => {
    // Create test user and company
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Tech',
        last_name: 'Corp'
      })
      .returning()
      .execute();

    const [companyProfile] = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser.id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    // Create job posting without applications
    const [jobPosting] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Intern',
        description: 'Great internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    const applications = await getJobApplicationsForJob(jobPosting.id);

    expect(applications).toHaveLength(0);
    expect(Array.isArray(applications)).toBe(true);
  });

  it('should return empty array for non-existent job posting', async () => {
    const nonExistentJobId = 99999;
    
    const applications = await getJobApplicationsForJob(nonExistentJobId);

    expect(applications).toHaveLength(0);
    expect(Array.isArray(applications)).toBe(true);
  });

  it('should return applications with correct data types and structure', async () => {
    // Create test data
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Tech',
        last_name: 'Corp'
      })
      .returning()
      .execute();

    const [jobSeekerUser] = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [companyProfile] = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser.id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const [jobSeekerProfile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeekerUser.id
      })
      .returning()
      .execute();

    const [jobPosting] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Intern',
        description: 'Great internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting.id,
        job_seeker_id: jobSeekerProfile.id,
        status: 'pending',
        cover_letter: 'Test cover letter'
      })
      .execute();

    const applications = await getJobApplicationsForJob(jobPosting.id);

    expect(applications).toHaveLength(1);
    
    const application = applications[0];
    expect(typeof application.id).toBe('number');
    expect(typeof application.job_posting_id).toBe('number');
    expect(typeof application.job_seeker_id).toBe('number');
    expect(typeof application.status).toBe('string');
    expect(['pending', 'accepted', 'rejected', 'withdrawn']).toContain(application.status);
    expect(typeof application.cover_letter).toBe('string');
    expect(application.applied_at).toBeInstanceOf(Date);
    expect(application.updated_at).toBeInstanceOf(Date);
    
    // Verify the specific values
    expect(application.job_posting_id).toBe(jobPosting.id);
    expect(application.job_seeker_id).toBe(jobSeekerProfile.id);
    expect(application.status).toBe('pending');
    expect(application.cover_letter).toBe('Test cover letter');
  });

  it('should handle applications with null cover letter', async () => {
    // Create test data
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Tech',
        last_name: 'Corp'
      })
      .returning()
      .execute();

    const [jobSeekerUser] = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [companyProfile] = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser.id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    const [jobSeekerProfile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeekerUser.id
      })
      .returning()
      .execute();

    const [jobPosting] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Intern',
        description: 'Great internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    // Create application without cover letter
    await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting.id,
        job_seeker_id: jobSeekerProfile.id,
        status: 'pending',
        cover_letter: null
      })
      .execute();

    const applications = await getJobApplicationsForJob(jobPosting.id);

    expect(applications).toHaveLength(1);
    expect(applications[0].cover_letter).toBeNull();
  });
});