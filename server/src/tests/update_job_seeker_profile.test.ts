import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobSeekerProfilesTable } from '../db/schema';
import { type UpdateJobSeekerProfileInput, type CreateUserInput } from '../schema';
import { updateJobSeekerProfile } from '../handlers/update_job_seeker_profile';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (): Promise<number> => {
  const result = await db.insert(usersTable)
    .values({
      email: 'jobseeker@test.com',
      password_hash: 'hashed_password_123',
      role: 'job_seeker',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890'
    })
    .returning()
    .execute();

  return result[0].id;
};

// Helper function to create a test job seeker profile
const createTestJobSeekerProfile = async (userId: number): Promise<number> => {
  const result = await db.insert(jobSeekerProfilesTable)
    .values({
      user_id: userId,
      bio: 'Original bio',
      skills: 'JavaScript,TypeScript',
      education: 'Bachelor of Computer Science',
      experience: '2 years in web development',
      resume_url: 'https://example.com/resume.pdf'
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateJobSeekerProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a job seeker profile', async () => {
    // Create test user and profile
    const userId = await createTestUser();
    const profileId = await createTestJobSeekerProfile(userId);

    const updateInput: UpdateJobSeekerProfileInput = {
      id: profileId,
      bio: 'Updated bio with new information',
      skills: 'JavaScript,TypeScript,React,Node.js',
      education: 'Master of Computer Science',
      experience: '5 years in full-stack development',
      resume_url: 'https://example.com/new-resume.pdf'
    };

    const result = await updateJobSeekerProfile(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(profileId);
    expect(result.user_id).toEqual(userId);
    expect(result.bio).toEqual('Updated bio with new information');
    expect(result.skills).toEqual('JavaScript,TypeScript,React,Node.js');
    expect(result.education).toEqual('Master of Computer Science');
    expect(result.experience).toEqual('5 years in full-stack development');
    expect(result.resume_url).toEqual('https://example.com/new-resume.pdf');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create test user and profile
    const userId = await createTestUser();
    const profileId = await createTestJobSeekerProfile(userId);

    // Update only bio and skills
    const updateInput: UpdateJobSeekerProfileInput = {
      id: profileId,
      bio: 'Updated bio only',
      skills: 'JavaScript,Python,Go'
    };

    const result = await updateJobSeekerProfile(updateInput);

    // Verify specified fields were updated
    expect(result.bio).toEqual('Updated bio only');
    expect(result.skills).toEqual('JavaScript,Python,Go');
    
    // Verify other fields remain unchanged
    expect(result.education).toEqual('Bachelor of Computer Science');
    expect(result.experience).toEqual('2 years in web development');
    expect(result.resume_url).toEqual('https://example.com/resume.pdf');
  });

  it('should handle null values correctly', async () => {
    // Create test user and profile
    const userId = await createTestUser();
    const profileId = await createTestJobSeekerProfile(userId);

    const updateInput: UpdateJobSeekerProfileInput = {
      id: profileId,
      bio: null,
      skills: null,
      resume_url: null
    };

    const result = await updateJobSeekerProfile(updateInput);

    // Verify null values were set
    expect(result.bio).toBeNull();
    expect(result.skills).toBeNull();
    expect(result.resume_url).toBeNull();
    
    // Verify other fields remain unchanged
    expect(result.education).toEqual('Bachelor of Computer Science');
    expect(result.experience).toEqual('2 years in web development');
  });

  it('should persist changes to database', async () => {
    // Create test user and profile
    const userId = await createTestUser();
    const profileId = await createTestJobSeekerProfile(userId);

    const updateInput: UpdateJobSeekerProfileInput = {
      id: profileId,
      bio: 'Database persistence test',
      education: 'PhD in Computer Science'
    };

    await updateJobSeekerProfile(updateInput);

    // Query database directly to verify changes were persisted
    const profiles = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.id, profileId))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].bio).toEqual('Database persistence test');
    expect(profiles[0].education).toEqual('PhD in Computer Science');
    expect(profiles[0].skills).toEqual('JavaScript,TypeScript'); // Unchanged
  });

  it('should update the updated_at timestamp', async () => {
    // Create test user and profile
    const userId = await createTestUser();
    const profileId = await createTestJobSeekerProfile(userId);

    // Get original timestamps
    const originalProfile = await db.select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.id, profileId))
      .execute();

    const originalUpdatedAt = originalProfile[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateJobSeekerProfileInput = {
      id: profileId,
      bio: 'Timestamp test update'
    };

    const result = await updateJobSeekerProfile(updateInput);

    // Verify updated_at timestamp was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    
    // Verify created_at remains unchanged
    expect(result.created_at).toEqual(originalProfile[0].created_at);
  });

  it('should throw error when profile does not exist', async () => {
    const updateInput: UpdateJobSeekerProfileInput = {
      id: 99999, // Non-existent profile ID
      bio: 'This should fail'
    };

    await expect(updateJobSeekerProfile(updateInput)).rejects.toThrow(/profile with id 99999 not found/i);
  });

  it('should handle minimal updates', async () => {
    // Create test user and profile
    const userId = await createTestUser();
    const profileId = await createTestJobSeekerProfile(userId);

    // Update with minimal input (only ID provided, no fields to update)
    const updateInput: UpdateJobSeekerProfileInput = {
      id: profileId
    };

    const result = await updateJobSeekerProfile(updateInput);

    // Should return the profile with only updated_at changed
    expect(result.id).toEqual(profileId);
    expect(result.bio).toEqual('Original bio'); // Unchanged
    expect(result.skills).toEqual('JavaScript,TypeScript'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});