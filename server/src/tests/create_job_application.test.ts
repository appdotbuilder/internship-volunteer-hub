import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  jobSeekerProfilesTable, 
  companyProfilesTable, 
  jobPostingsTable, 
  jobApplicationsTable 
} from '../db/schema';
import { type CreateJobApplicationInput } from '../schema';
import { createJobApplication } from '../handlers/create_job_application';
import { eq, and } from 'drizzle-orm';

describe('createJobApplication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let jobSeekerId: number;
  let jobPostingId: number;

  beforeEach(async () => {
    // Create a job seeker user
    const jobSeekerUser = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    // Create job seeker profile
    const jobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeekerUser[0].id,
        bio: 'Experienced job seeker',
        skills: '["JavaScript", "TypeScript"]'
      })
      .returning()
      .execute();

    jobSeekerId = jobSeekerProfile[0].id;

    // Create a company user
    const companyUser = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Company',
        last_name: 'Admin'
      })
      .returning()
      .execute();

    // Create company profile
    const companyProfile = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser[0].id,
        company_name: 'Test Company',
        description: 'A test company'
      })
      .returning()
      .execute();

    // Create job posting
    const jobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Software Engineer Intern',
        description: 'Great internship opportunity',
        type: 'internship',
        location: 'San Francisco, CA',
        is_active: true
      })
      .returning()
      .execute();

    jobPostingId = jobPosting[0].id;
  });

  const testInput: CreateJobApplicationInput = {
    job_posting_id: 0, // Will be set in test
    job_seeker_id: 0, // Will be set in test
    cover_letter: 'I am very interested in this position and believe I would be a great fit.'
  };

  it('should create a job application successfully', async () => {
    const input = {
      ...testInput,
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId
    };

    const result = await createJobApplication(input);

    // Verify basic fields
    expect(result.job_posting_id).toEqual(jobPostingId);
    expect(result.job_seeker_id).toEqual(jobSeekerId);
    expect(result.status).toEqual('pending');
    expect(result.cover_letter).toEqual(input.cover_letter || null);
    expect(result.id).toBeDefined();
    expect(result.applied_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save job application to database', async () => {
    const input = {
      ...testInput,
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId
    };

    const result = await createJobApplication(input);

    // Verify the application was saved to database
    const applications = await db.select()
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].job_posting_id).toEqual(jobPostingId);
    expect(applications[0].job_seeker_id).toEqual(jobSeekerId);
    expect(applications[0].status).toEqual('pending');
    expect(applications[0].cover_letter).toEqual(input.cover_letter || null);
    expect(applications[0].applied_at).toBeInstanceOf(Date);
    expect(applications[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create application without cover letter', async () => {
    const input = {
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId
      // No cover_letter provided
    };

    const result = await createJobApplication(input);

    expect(result.cover_letter).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.job_posting_id).toEqual(jobPostingId);
    expect(result.job_seeker_id).toEqual(jobSeekerId);
  });

  it('should reject application for non-existent job posting', async () => {
    const input = {
      ...testInput,
      job_posting_id: 99999, // Non-existent ID
      job_seeker_id: jobSeekerId
    };

    await expect(createJobApplication(input))
      .rejects.toThrow(/job posting not found/i);
  });

  it('should reject application for non-existent job seeker', async () => {
    const input = {
      ...testInput,
      job_posting_id: jobPostingId,
      job_seeker_id: 99999 // Non-existent ID
    };

    await expect(createJobApplication(input))
      .rejects.toThrow(/job seeker profile not found/i);
  });

  it('should reject application for inactive job posting', async () => {
    // Deactivate the job posting
    await db.update(jobPostingsTable)
      .set({ is_active: false })
      .where(eq(jobPostingsTable.id, jobPostingId))
      .execute();

    const input = {
      ...testInput,
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId
    };

    await expect(createJobApplication(input))
      .rejects.toThrow(/job posting is not active/i);
  });

  it('should reject duplicate application', async () => {
    const input = {
      ...testInput,
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId
    };

    // Create first application
    await createJobApplication(input);

    // Try to create duplicate application
    await expect(createJobApplication(input))
      .rejects.toThrow(/already applied for this job/i);
  });

  it('should allow same job seeker to apply for different jobs', async () => {
    // Create another job posting
    const companyProfile = await db.select()
      .from(companyProfilesTable)
      .execute();

    const secondJobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Data Analyst Intern',
        description: 'Another great opportunity',
        type: 'internship',
        is_active: true
      })
      .returning()
      .execute();

    const firstApplication = await createJobApplication({
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId,
      cover_letter: 'First application'
    });

    const secondApplication = await createJobApplication({
      job_posting_id: secondJobPosting[0].id,
      job_seeker_id: jobSeekerId,
      cover_letter: 'Second application'
    });

    expect(firstApplication.id).not.toEqual(secondApplication.id);
    expect(firstApplication.job_posting_id).toEqual(jobPostingId);
    expect(secondApplication.job_posting_id).toEqual(secondJobPosting[0].id);
    expect(firstApplication.job_seeker_id).toEqual(jobSeekerId);
    expect(secondApplication.job_seeker_id).toEqual(jobSeekerId);
  });

  it('should allow different job seekers to apply for same job', async () => {
    // Create another job seeker
    const anotherJobSeekerUser = await db.insert(usersTable)
      .values({
        email: 'another@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const anotherJobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: anotherJobSeekerUser[0].id,
        bio: 'Another job seeker'
      })
      .returning()
      .execute();

    const firstApplication = await createJobApplication({
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId,
      cover_letter: 'First application'
    });

    const secondApplication = await createJobApplication({
      job_posting_id: jobPostingId,
      job_seeker_id: anotherJobSeekerProfile[0].id,
      cover_letter: 'Second application'
    });

    expect(firstApplication.id).not.toEqual(secondApplication.id);
    expect(firstApplication.job_posting_id).toEqual(jobPostingId);
    expect(secondApplication.job_posting_id).toEqual(jobPostingId);
    expect(firstApplication.job_seeker_id).toEqual(jobSeekerId);
    expect(secondApplication.job_seeker_id).toEqual(anotherJobSeekerProfile[0].id);
  });
});