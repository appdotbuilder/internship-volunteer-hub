import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobSeekerProfilesTable } from '../db/schema';
import { type CreateJobSeekerProfileInput } from '../schema';
import { createJobSeekerProfile } from '../handlers/create_job_seeker_profile';
import { eq } from 'drizzle-orm';

describe('createJobSeekerProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first since job seeker profile requires user_id
    const userResult = await db.insert(usersTable)
      .values({
        email: 'jobseeker@example.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a job seeker profile with all fields', async () => {
    const testInput: CreateJobSeekerProfileInput = {
      user_id: testUserId,
      bio: 'Passionate software developer looking for internships',
      skills: '["JavaScript", "Python", "React"]',
      education: 'Computer Science at University of Example',
      experience: '2 years of freelance web development',
      resume_url: 'https://example.com/resume.pdf'
    };

    const result = await createJobSeekerProfile(testInput);

    // Verify all fields are set correctly
    expect(result.user_id).toBe(testUserId);
    expect(result.bio).toBe(testInput.bio!);
    expect(result.skills).toBe(testInput.skills!);
    expect(result.education).toBe(testInput.education!);
    expect(result.experience).toBe(testInput.experience!);
    expect(result.resume_url).toBe(testInput.resume_url!);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a job seeker profile with minimal fields', async () => {
    const testInput: CreateJobSeekerProfileInput = {
      user_id: testUserId
    };

    const result = await createJobSeekerProfile(testInput);

    // Verify required fields and null optional fields
    expect(result.user_id).toBe(testUserId);
    expect(result.bio).toBeNull();
    expect(result.skills).toBeNull();
    expect(result.education).toBeNull();
    expect(result.experience).toBeNull();
    expect(result.resume_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a job seeker profile with partial fields', async () => {
    const testInput: CreateJobSeekerProfileInput = {
      user_id: testUserId,
      bio: 'Eager to learn and grow',
      skills: '["JavaScript", "HTML", "CSS"]'
      // Other fields are optional and not provided
    };

    const result = await createJobSeekerProfile(testInput);

    expect(result.user_id).toBe(testUserId);
    expect(result.bio).toBe(testInput.bio!);
    expect(result.skills).toBe(testInput.skills!);
    expect(result.education).toBeNull();
    expect(result.experience).toBeNull();
    expect(result.resume_url).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save job seeker profile to database', async () => {
    const testInput: CreateJobSeekerProfileInput = {
      user_id: testUserId,
      bio: 'Database test profile',
      skills: '["Testing", "SQL"]',
      education: 'Testing University',
      experience: '1 year testing experience',
      resume_url: 'https://example.com/test-resume.pdf'
    };

    const result = await createJobSeekerProfile(testInput);

    // Query database directly to verify the data was saved
    const profiles = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    const savedProfile = profiles[0];
    
    expect(savedProfile.user_id).toBe(testUserId);
    expect(savedProfile.bio).toBe(testInput.bio!);
    expect(savedProfile.skills).toBe(testInput.skills!);
    expect(savedProfile.education).toBe(testInput.education!);
    expect(savedProfile.experience).toBe(testInput.experience!);
    expect(savedProfile.resume_url).toBe(testInput.resume_url!);
    expect(savedProfile.created_at).toBeInstanceOf(Date);
    expect(savedProfile.updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty string fields as null', async () => {
    const testInput: CreateJobSeekerProfileInput = {
      user_id: testUserId,
      bio: '',
      skills: '',
      education: '',
      experience: '',
      resume_url: ''
    };

    const result = await createJobSeekerProfile(testInput);

    // Empty strings should be converted to null by the || null logic
    expect(result.user_id).toBe(testUserId);
    expect(result.bio).toBeNull();
    expect(result.skills).toBeNull();
    expect(result.education).toBeNull();
    expect(result.experience).toBeNull();
    expect(result.resume_url).toBeNull();
  });

  it('should throw error for non-existent user_id', async () => {
    const testInput: CreateJobSeekerProfileInput = {
      user_id: 99999, // Non-existent user ID
      bio: 'This should fail'
    };

    await expect(createJobSeekerProfile(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple profiles for different users', async () => {
    // Create a second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'jobseeker2@example.com',
        password_hash: 'hashed_password_2',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith'
      })
      .returning()
      .execute();
    
    const testUser2Id = user2Result[0].id;

    const profile1Input: CreateJobSeekerProfileInput = {
      user_id: testUserId,
      bio: 'First job seeker'
    };

    const profile2Input: CreateJobSeekerProfileInput = {
      user_id: testUser2Id,
      bio: 'Second job seeker'
    };

    const result1 = await createJobSeekerProfile(profile1Input);
    const result2 = await createJobSeekerProfile(profile2Input);

    expect(result1.user_id).toBe(testUserId);
    expect(result1.bio).toBe('First job seeker');
    expect(result2.user_id).toBe(testUser2Id);
    expect(result2.bio).toBe('Second job seeker');
    expect(result1.id).not.toBe(result2.id);
  });
});