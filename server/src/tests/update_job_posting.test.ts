import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable, jobPostingsTable } from '../db/schema';
import { type UpdateJobPostingInput } from '../schema';
import { updateJobPosting } from '../handlers/update_job_posting';
import { eq } from 'drizzle-orm';

describe('updateJobPosting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let companyId: number;
  let jobPostingId: number;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'company@test.com',
        password_hash: 'hashed_password',
        role: 'company',
        first_name: 'Test',
        last_name: 'Company'
      })
      .returning()
      .execute();
    
    userId = userResult[0].id;

    // Create a company profile
    const companyResult = await db.insert(companyProfilesTable)
      .values({
        user_id: userId,
        company_name: 'Test Company'
      })
      .returning()
      .execute();
    
    companyId = companyResult[0].id;

    // Create a job posting to update
    const jobResult = await db.insert(jobPostingsTable)
      .values({
        company_id: companyId,
        title: 'Original Title',
        description: 'Original description',
        type: 'internship'
      })
      .returning()
      .execute();
    
    jobPostingId = jobResult[0].id;
  });

  it('should update job posting title and description', async () => {
    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId,
      title: 'Updated Software Engineering Intern',
      description: 'Updated exciting internship opportunity'
    };

    const result = await updateJobPosting(updateInput);

    expect(result.id).toEqual(jobPostingId);
    expect(result.title).toEqual('Updated Software Engineering Intern');
    expect(result.description).toEqual('Updated exciting internship opportunity');
    expect(result.type).toEqual('internship'); // Should remain unchanged
    expect(result.company_id).toEqual(companyId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update all optional fields', async () => {
    const applicationDeadline = new Date('2024-06-01');
    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId,
      title: 'Full-Stack Developer Volunteer',
      description: 'Help build educational platform',
      type: 'volunteer',
      location: 'Remote',
      requirements: 'JavaScript, React, Node.js',
      duration: '6 months',
      compensation: 'Volunteer - No compensation',
      application_deadline: applicationDeadline,
      is_active: false
    };

    const result = await updateJobPosting(updateInput);

    expect(result.title).toEqual('Full-Stack Developer Volunteer');
    expect(result.description).toEqual('Help build educational platform');
    expect(result.type).toEqual('volunteer');
    expect(result.location).toEqual('Remote');
    expect(result.requirements).toEqual('JavaScript, React, Node.js');
    expect(result.duration).toEqual('6 months');
    expect(result.compensation).toEqual('Volunteer - No compensation');
    expect(result.application_deadline).toEqual(applicationDeadline);
    expect(result.is_active).toEqual(false);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId,
      location: 'San Francisco, CA',
      is_active: false
    };

    const result = await updateJobPosting(updateInput);

    // Updated fields
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.is_active).toEqual(false);

    // Fields that should remain unchanged
    expect(result.title).toEqual('Original Title');
    expect(result.description).toEqual('Original description');
    expect(result.type).toEqual('internship');
    expect(result.requirements).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.compensation).toBeNull();
  });

  it('should persist changes in database', async () => {
    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId,
      title: 'Database Updated Title',
      compensation: '$2000/month stipend'
    };

    await updateJobPosting(updateInput);

    // Verify changes are persisted
    const dbRecords = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobPostingId))
      .execute();

    expect(dbRecords).toHaveLength(1);
    const dbRecord = dbRecords[0];
    expect(dbRecord.title).toEqual('Database Updated Title');
    expect(dbRecord.compensation).toEqual('$2000/month stipend');
    expect(dbRecord.description).toEqual('Original description'); // Unchanged
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalRecord = await db.select()
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.id, jobPostingId))
      .execute();

    const originalTimestamp = originalRecord[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId,
      title: 'Timestamp Test'
    };

    const result = await updateJobPosting(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId,
      location: null,
      requirements: null,
      duration: null,
      compensation: null,
      application_deadline: null
    };

    const result = await updateJobPosting(updateInput);

    expect(result.location).toBeNull();
    expect(result.requirements).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.compensation).toBeNull();
    expect(result.application_deadline).toBeNull();
  });

  it('should throw error for non-existent job posting', async () => {
    const updateInput: UpdateJobPostingInput = {
      id: 99999,
      title: 'Non-existent Job'
    };

    await expect(updateJobPosting(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const updateInput: UpdateJobPostingInput = {
      id: jobPostingId
    };

    const result = await updateJobPosting(updateInput);

    // Should return the job posting with only updated_at changed
    expect(result.id).toEqual(jobPostingId);
    expect(result.title).toEqual('Original Title');
    expect(result.description).toEqual('Original description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});