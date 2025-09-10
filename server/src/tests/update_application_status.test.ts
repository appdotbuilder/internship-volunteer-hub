import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobSeekerProfilesTable, companyProfilesTable, jobPostingsTable, jobApplicationsTable } from '../db/schema';
import { type UpdateJobApplicationStatusInput } from '../schema';
import { updateApplicationStatus } from '../handlers/update_application_status';
import { eq } from 'drizzle-orm';

describe('updateApplicationStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update application status from pending to accepted', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Seeker'
      })
      .returning()
      .execute();

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

    const jobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user[0].id,
        bio: 'Experienced job seeker'
      })
      .returning()
      .execute();

    const companyProfile = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser[0].id,
        company_name: 'Test Company',
        description: 'A test company'
      })
      .returning()
      .execute();

    const jobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Software Intern',
        description: 'Great internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    // Create a job application with pending status
    const application = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting[0].id,
        job_seeker_id: jobSeekerProfile[0].id,
        cover_letter: 'I am interested in this position'
      })
      .returning()
      .execute();

    const input: UpdateJobApplicationStatusInput = {
      id: application[0].id,
      status: 'accepted'
    };

    const result = await updateApplicationStatus(input);

    // Verify the response
    expect(result.id).toEqual(application[0].id);
    expect(result.status).toEqual('accepted');
    expect(result.job_posting_id).toEqual(jobPosting[0].id);
    expect(result.job_seeker_id).toEqual(jobSeekerProfile[0].id);
    expect(result.cover_letter).toEqual('I am interested in this position');
    expect(result.applied_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.applied_at.getTime());
  });

  it('should update application status from pending to rejected', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'jobseeker2@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Seeker'
      })
      .returning()
      .execute();

    const companyUser = await db.insert(usersTable)
      .values({
        email: 'company2@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Company',
        last_name: 'Manager'
      })
      .returning()
      .execute();

    const jobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user[0].id,
        bio: 'Motivated job seeker'
      })
      .returning()
      .execute();

    const companyProfile = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser[0].id,
        company_name: 'Another Test Company',
        description: 'Another test company'
      })
      .returning()
      .execute();

    const jobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Volunteer Position',
        description: 'Community service opportunity',
        type: 'volunteer'
      })
      .returning()
      .execute();

    const application = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting[0].id,
        job_seeker_id: jobSeekerProfile[0].id,
        cover_letter: 'I would love to volunteer'
      })
      .returning()
      .execute();

    const input: UpdateJobApplicationStatusInput = {
      id: application[0].id,
      status: 'rejected'
    };

    const result = await updateApplicationStatus(input);

    expect(result.status).toEqual('rejected');
    expect(result.id).toEqual(application[0].id);
  });

  it('should update application status from accepted to withdrawn', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'jobseeker3@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Bob',
        last_name: 'Seeker'
      })
      .returning()
      .execute();

    const companyUser = await db.insert(usersTable)
      .values({
        email: 'company3@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Company',
        last_name: 'Owner'
      })
      .returning()
      .execute();

    const jobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user[0].id,
        bio: 'Dedicated job seeker'
      })
      .returning()
      .execute();

    const companyProfile = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser[0].id,
        company_name: 'Third Test Company',
        description: 'Third test company'
      })
      .returning()
      .execute();

    const jobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Research Intern',
        description: 'Research internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    // Create application with accepted status initially
    const application = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting[0].id,
        job_seeker_id: jobSeekerProfile[0].id,
        status: 'accepted',
        cover_letter: 'Thank you for considering me'
      })
      .returning()
      .execute();

    const input: UpdateJobApplicationStatusInput = {
      id: application[0].id,
      status: 'withdrawn'
    };

    const result = await updateApplicationStatus(input);

    expect(result.status).toEqual('withdrawn');
    expect(result.id).toEqual(application[0].id);
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'jobseeker4@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Alice',
        last_name: 'Seeker'
      })
      .returning()
      .execute();

    const companyUser = await db.insert(usersTable)
      .values({
        email: 'company4@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Company',
        last_name: 'HR'
      })
      .returning()
      .execute();

    const jobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user[0].id,
        bio: 'Skilled job seeker'
      })
      .returning()
      .execute();

    const companyProfile = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser[0].id,
        company_name: 'Fourth Test Company',
        description: 'Fourth test company'
      })
      .returning()
      .execute();

    const jobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Marketing Intern',
        description: 'Marketing internship opportunity',
        type: 'internship'
      })
      .returning()
      .execute();

    const application = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting[0].id,
        job_seeker_id: jobSeekerProfile[0].id,
        cover_letter: 'I am passionate about marketing'
      })
      .returning()
      .execute();

    const input: UpdateJobApplicationStatusInput = {
      id: application[0].id,
      status: 'accepted'
    };

    const result = await updateApplicationStatus(input);

    // Query database to verify the change was persisted
    const applications = await db.select()
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.id, result.id))
      .execute();

    expect(applications).toHaveLength(1);
    expect(applications[0].status).toEqual('accepted');
    expect(applications[0].updated_at).toBeInstanceOf(Date);
    expect(applications[0].updated_at.getTime()).toBeGreaterThan(applications[0].applied_at.getTime());
  });

  it('should throw error for non-existent application', async () => {
    const input: UpdateJobApplicationStatusInput = {
      id: 99999,
      status: 'accepted'
    };

    await expect(updateApplicationStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should handle all valid status transitions', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'jobseeker5@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Charlie',
        last_name: 'Seeker'
      })
      .returning()
      .execute();

    const companyUser = await db.insert(usersTable)
      .values({
        email: 'company5@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Company',
        last_name: 'Director'
      })
      .returning()
      .execute();

    const jobSeekerProfile = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: user[0].id,
        bio: 'Versatile job seeker'
      })
      .returning()
      .execute();

    const companyProfile = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUser[0].id,
        company_name: 'Fifth Test Company',
        description: 'Fifth test company'
      })
      .returning()
      .execute();

    const jobPosting = await db.insert(jobPostingsTable)
      .values({
        company_id: companyProfile[0].id,
        title: 'Data Analysis Volunteer',
        description: 'Data analysis volunteer opportunity',
        type: 'volunteer'
      })
      .returning()
      .execute();

    const application = await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobPosting[0].id,
        job_seeker_id: jobSeekerProfile[0].id,
        cover_letter: 'I love working with data'
      })
      .returning()
      .execute();

    // Test all valid status values
    const statuses = ['pending', 'accepted', 'rejected', 'withdrawn'] as const;
    
    for (const status of statuses) {
      const input: UpdateJobApplicationStatusInput = {
        id: application[0].id,
        status: status
      };

      const result = await updateApplicationStatus(input);
      expect(result.status).toEqual(status);
    }
  });
});