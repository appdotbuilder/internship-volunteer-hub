import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable, jobPostingsTable, jobSeekerProfilesTable, jobApplicationsTable } from '../db/schema';
import { deleteJobPosting } from '../handlers/delete_job_posting';
import { eq } from 'drizzle-orm';

describe('deleteJobPosting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing job posting', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'John',
        last_name: 'Doe',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    // Create company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userResult[0].id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    // Create job posting
    const jobResult = await db.insert(jobPostingsTable)
      .values({
        company_id: companyResult[0].id,
        title: 'Software Engineering Intern',
        description: 'Great internship opportunity',
        type: 'internship',
        location: 'New York, NY',
        requirements: 'Computer Science student',
        duration: '3 months',
        compensation: 'Paid',
        is_active: true
      })
      .returning()
      .execute();

    const jobId = jobResult[0].id;

    // Verify job posting exists
    const beforeDelete = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobId))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete the job posting
    const result = await deleteJobPosting(jobId);
    expect(result).toBe(true);

    // Verify job posting was deleted
    const afterDelete = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent job posting', async () => {
    const nonExistentId = 999999;

    // Attempt to delete non-existent job posting
    const result = await deleteJobPosting(nonExistentId);
    expect(result).toBe(false);
  });

  it('should handle deletion when job posting has applications', async () => {
    // Create test user (company)
    const companyUserResult = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Jane',
        last_name: 'Company',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    // Create job seeker user
    const jobSeekerUserResult = await db.insert(usersTable)
      .values({
        email: 'jobseeker@test.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Bob',
        last_name: 'Seeker',
        phone: '098-765-4321'
      })
      .returning()
      .execute();

    // Create company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: companyUserResult[0].id,
        company_name: 'Test Company'
      })
      .returning()
      .execute();

    // Create job seeker profile
    const jobSeekerProfileResult = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: jobSeekerUserResult[0].id
      })
      .returning()
      .execute();

    // Create job posting
    const jobResult = await db.insert(jobPostingsTable)
      .values({
        company_id: companyResult[0].id,
        title: 'Marketing Intern',
        description: 'Marketing internship',
        type: 'internship',
        is_active: true
      })
      .returning()
      .execute();

    // Create job application
    await db.insert(jobApplicationsTable)
      .values({
        job_posting_id: jobResult[0].id,
        job_seeker_id: jobSeekerProfileResult[0].id,
        status: 'pending',
        cover_letter: 'I am interested in this position'
      })
      .execute();

    const jobId = jobResult[0].id;

    // Delete the job posting (should cascade delete applications)
    const result = await deleteJobPosting(jobId);
    expect(result).toBe(true);

    // Verify job posting was deleted
    const afterDelete = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });
});