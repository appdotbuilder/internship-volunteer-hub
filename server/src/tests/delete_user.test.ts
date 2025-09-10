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
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a user that exists', async () => {
    // Create a test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-1234'
      })
      .returning()
      .execute();

    const result = await deleteUser(user.id);

    expect(result).toBe(true);

    // Verify user is deleted from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when user does not exist', async () => {
    const nonExistentUserId = 999;

    const result = await deleteUser(nonExistentUserId);

    expect(result).toBe(false);
  });

  it('should cascade delete job seeker profile', async () => {
    // Create a user with job seeker role
    const [user] = await db.insert(usersTable)
      .values({
        email: 'jobseeker@example.com',
        password_hash: 'hashedpassword',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-5678'
      })
      .returning()
      .execute();

    // Create a job seeker profile
    const [profile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user.id,
        bio: 'Experienced software developer',
        skills: '["JavaScript", "TypeScript", "React"]',
        education: 'BS Computer Science',
        experience: '3 years at tech company',
        resume_url: 'https://example.com/resume.pdf'
      })
      .returning()
      .execute();

    const result = await deleteUser(user.id);

    expect(result).toBe(true);

    // Verify both user and profile are deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    const profiles = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.id, profile.id))
      .execute();

    expect(users).toHaveLength(0);
    expect(profiles).toHaveLength(0);
  });

  it('should cascade delete company profile and job postings', async () => {
    // Create a company user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'company@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Company',
        last_name: 'Admin',
        phone: '555-9999'
      })
      .returning()
      .execute();

    // Create a company profile
    const [companyProfile] = await db.insert(companyProfilesTable)
      .values({
        user_id: user.id,
        company_name: 'Tech Corp',
        description: 'Leading technology company',
        website: 'https://techcorp.com',
        location: 'San Francisco, CA',
        industry: 'Technology'
      })
      .returning()
      .execute();

    // Create a job posting
    const [jobPosting] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Software Engineer Intern',
        description: 'Great internship opportunity',
        type: 'internship',
        location: 'San Francisco, CA',
        requirements: 'Computer Science major',
        duration: '3 months',
        compensation: 'Paid',
        application_deadline: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const result = await deleteUser(user.id);

    expect(result).toBe(true);

    // Verify user, company profile, and job posting are all deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    const companies = await db.select()
      .from(companyProfilesTable)
      .where(eq(companyProfilesTable.id, companyProfile.id))
      .execute();

    const jobs = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobPosting.id))
      .execute();

    expect(users).toHaveLength(0);
    expect(companies).toHaveLength(0);
    expect(jobs).toHaveLength(0);
  });

  it('should cascade delete job applications when job seeker is deleted', async () => {
    // Create job seeker user
    const [jobSeekerUser] = await db.insert(usersTable)
      .values({
        email: 'seeker@example.com',
        password_hash: 'hashedpassword',
        role: 'job_seeker',
        first_name: 'Job',
        last_name: 'Seeker',
        phone: '555-1111'
      })
      .returning()
      .execute();

    // Create company user
    const [companyUser] = await db.insert(usersTable)
      .values({
        email: 'employer@example.com',
        password_hash: 'hashedpassword',
        role: 'company',
        first_name: 'Employer',
        last_name: 'Rep',
        phone: '555-2222'
      })
      .returning()
      .execute();

    // Create job seeker profile
    const [jobSeekerProfile] = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeekerUser.id,
        bio: 'Looking for opportunities'
      })
      .returning()
      .execute();

    // Create company profile
    const [companyProfile] = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser.id,
        company_name: 'Hiring Company'
      })
      .returning()
      .execute();

    // Create job posting
    const [jobPosting] = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile.id,
        title: 'Developer Position',
        description: 'Great opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    // Create job application
    const [application] = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting.id,
        job_seeker_id: jobSeekerProfile.id,
        status: 'pending',
        cover_letter: 'I am interested in this position'
      })
      .returning()
      .execute();

    const result = await deleteUser(jobSeekerUser.id);

    expect(result).toBe(true);

    // Verify job seeker user and profile are deleted
    const seekerUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, jobSeekerUser.id))
      .execute();

    const seekerProfiles = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.id, jobSeekerProfile.id))
      .execute();

    // Verify application is deleted (cascade from job seeker profile)
    const applications = await db.select()
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.id, application.id))
      .execute();

    expect(seekerUsers).toHaveLength(0);
    expect(seekerProfiles).toHaveLength(0);
    expect(applications).toHaveLength(0);

    // Verify company user and job posting still exist
    const companyUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, companyUser.id))
      .execute();

    const jobs = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobPosting.id))
      .execute();

    expect(companyUsers).toHaveLength(1);
    expect(jobs).toHaveLength(1);
  });

  it('should handle deletion of administrator users', async () => {
    // Create an administrator user
    const [adminUser] = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        role: 'administrator',
        first_name: 'System',
        last_name: 'Admin',
        phone: '555-0000'
      })
      .returning()
      .execute();

    const result = await deleteUser(adminUser.id);

    expect(result).toBe(true);

    // Verify admin user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, adminUser.id))
      .execute();

    expect(users).toHaveLength(0);
  });
});