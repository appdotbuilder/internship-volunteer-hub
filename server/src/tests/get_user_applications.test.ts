import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobSeekerProfilesTable, companyProfilesTable, jobPostingsTable, jobApplicationsTable } from '../db/schema';
import { getUserApplications } from '../handlers/get_user_applications';
import { eq } from 'drizzle-orm';

describe('getUserApplications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return applications for a specific job seeker ordered by applied_at desc', async () => {
    // Create test user and job seeker profile
    const [user] = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [jobSeekerProfile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user.id,
        bio: 'Test bio'
      })
      .returning()
      .execute();

    // Create company user and profile for job postings
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed',
        role: 'company',
        first_name: 'Company',
        last_name: 'Admin'
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

    // Create job postings
    const [jobPosting1] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Intern',
        description: 'Internship position',
        type: 'internship'
      })
      .returning()
      .execute();

    const [jobPosting2] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Volunteer Position',
        description: 'Volunteer opportunity',
        type: 'volunteer'
      })
      .returning()
      .execute();

    // Create job applications with different timestamps
    const baseTime = new Date('2024-01-01T10:00:00Z');
    const laterTime = new Date('2024-01-02T10:00:00Z');

    const [application1] = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting1.id,
        job_seeker_id: jobSeekerProfile.id,
        status: 'pending',
        cover_letter: 'First application',
        applied_at: baseTime
      })
      .returning()
      .execute();

    const [application2] = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting2.id,
        job_seeker_id: jobSeekerProfile.id,
        status: 'accepted',
        cover_letter: 'Second application',
        applied_at: laterTime
      })
      .returning()
      .execute();

    // Get applications
    const results = await getUserApplications(jobSeekerProfile.id);

    // Verify results
    expect(results).toHaveLength(2);
    
    // Should be ordered by applied_at desc (most recent first)
    expect(results[0].id).toBe(application2.id);
    expect(results[1].id).toBe(application1.id);

    // Verify first application (most recent)
    expect(results[0].job_posting_id).toBe(jobPosting2.id);
    expect(results[0].job_seeker_id).toBe(jobSeekerProfile.id);
    expect(results[0].status).toBe('accepted');
    expect(results[0].cover_letter).toBe('Second application');
    expect(results[0].applied_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);

    // Verify second application (older)
    expect(results[1].job_posting_id).toBe(jobPosting1.id);
    expect(results[1].job_seeker_id).toBe(jobSeekerProfile.id);
    expect(results[1].status).toBe('pending');
    expect(results[1].cover_letter).toBe('First application');
    expect(results[1].applied_at).toBeInstanceOf(Date);
    expect(results[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when job seeker has no applications', async () => {
    // Create test user and job seeker profile without applications
    const [user] = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [jobSeekerProfile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user.id,
        bio: 'Test bio'
      })
      .returning()
      .execute();

    const results = await getUserApplications(jobSeekerProfile.id);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return only applications for the specified job seeker', async () => {
    // Create two job seekers
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'jobseeker1@test.com',
        password_hash: 'hashed',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [jobSeekerProfile1] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user1.id,
        bio: 'Test bio 1'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'jobseeker2@test.com',
        password_hash: 'hashed',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();

    const [jobSeekerProfile2] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user2.id,
        bio: 'Test bio 2'
      })
      .returning()
      .execute();

    // Create company for job posting
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed',
        role: 'company',
        first_name: 'Company',
        last_name: 'Admin'
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

    const [jobPosting] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Intern',
        description: 'Internship position',
        type: 'internship'
      })
      .returning()
      .execute();

    // Create applications for both job seekers
    await db.insert(jobApplicationsTable)
      .values([
        {
          job_posting_id: jobPosting.id,
          job_seeker_id: jobSeekerProfile1.id,
          status: 'pending',
          cover_letter: 'Application from seeker 1'
        },
        {
          job_posting_id: jobPosting.id,
          job_seeker_id: jobSeekerProfile2.id,
          status: 'accepted',
          cover_letter: 'Application from seeker 2'
        }
      ])
      .execute();

    // Get applications for first job seeker only
    const results = await getUserApplications(jobSeekerProfile1.id);

    expect(results).toHaveLength(1);
    expect(results[0].job_seeker_id).toBe(jobSeekerProfile1.id);
    expect(results[0].cover_letter).toBe('Application from seeker 1');
    expect(results[0].status).toBe('pending');
  });

  it('should handle applications with different statuses', async () => {
    // Create test user and job seeker profile
    const [user] = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const [jobSeekerProfile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user.id,
        bio: 'Test bio'
      })
      .returning()
      .execute();

    // Create company and job postings
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed',
        role: 'company',
        first_name: 'Company',
        last_name: 'Admin'
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

    const jobPostings = await db.insert(jobPostingsTable)
      .values([
        {
          company_id: companyProfile.id,
          title: 'Job 1',
          description: 'Description 1',
          type: 'internship'
        },
        {
          company_id: companyProfile.id,
          title: 'Job 2',
          description: 'Description 2',
          type: 'volunteer'
        },
        {
          company_id: companyProfile.id,
          title: 'Job 3',
          description: 'Description 3',
          type: 'internship'
        },
        {
          company_id: companyProfile.id,
          title: 'Job 4',
          description: 'Description 4',
          type: 'volunteer'
        }
      ])
      .returning()
      .execute();

    // Create applications with all different statuses
    await db.insert(jobApplicationsTable)
      .values([
        {
          job_posting_id: jobPostings[0].id,
          job_seeker_id: jobSeekerProfile.id,
          status: 'pending',
          cover_letter: 'Pending application'
        },
        {
          job_posting_id: jobPostings[1].id,
          job_seeker_id: jobSeekerProfile.id,
          status: 'accepted',
          cover_letter: 'Accepted application'
        },
        {
          job_posting_id: jobPostings[2].id,
          job_seeker_id: jobSeekerProfile.id,
          status: 'rejected',
          cover_letter: 'Rejected application'
        },
        {
          job_posting_id: jobPostings[3].id,
          job_seeker_id: jobSeekerProfile.id,
          status: 'withdrawn',
          cover_letter: 'Withdrawn application'
        }
      ])
      .execute();

    const results = await getUserApplications(jobSeekerProfile.id);

    expect(results).toHaveLength(4);

    // Verify all statuses are present
    const statuses = results.map(app => app.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('accepted');
    expect(statuses).toContain('rejected');
    expect(statuses).toContain('withdrawn');
  });

  it('should return empty array for non-existent job seeker', async () => {
    const nonExistentJobSeekerId = 99999;
    const results = await getUserApplications(nonExistentJobSeekerId);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });
});