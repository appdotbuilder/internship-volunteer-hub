import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, jobSeekerProfilesTable } from '../db/schema';
import { getJobSeekerProfile } from '../handlers/get_job_seeker_profile';

describe('getJobSeekerProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return job seeker profile when it exists', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'jobseeker@example.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'John',
        last_name: 'Doe',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a job seeker profile
    const profileResult = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: userId,
        bio: 'Passionate computer science student',
        skills: '["JavaScript", "TypeScript", "React"]',
        education: 'BS Computer Science',
        experience: 'Intern at Tech Corp',
        resume_url: 'https://example.com/resume.pdf'
      })
      .returning()
      .execute();

    const result = await getJobSeekerProfile(userId);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(profileResult[0].id);
    expect(result!.user_id).toEqual(userId);
    expect(result!.bio).toEqual('Passionate computer science student');
    expect(result!.skills).toEqual('["JavaScript", "TypeScript", "React"]');
    expect(result!.education).toEqual('BS Computer Science');
    expect(result!.experience).toEqual('Intern at Tech Corp');
    expect(result!.resume_url).toEqual('https://example.com/resume.pdf');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when profile does not exist', async () => {
    // Create a test user without a profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'noProfileUser@example.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getJobSeekerProfile(userId);

    expect(result).toBeNull();
  });

  it('should return null for non-existent user ID', async () => {
    const nonExistentUserId = 99999;

    const result = await getJobSeekerProfile(nonExistentUserId);

    expect(result).toBeNull();
  });

  it('should handle profile with nullable fields', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'minimal@example.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'Min',
        last_name: 'Imal',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a minimal profile with null optional fields
    const profileResult = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: userId,
        bio: null,
        skills: null,
        education: null,
        experience: null,
        resume_url: null
      })
      .returning()
      .execute();

    const result = await getJobSeekerProfile(userId);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(profileResult[0].id);
    expect(result!.user_id).toEqual(userId);
    expect(result!.bio).toBeNull();
    expect(result!.skills).toBeNull();
    expect(result!.education).toBeNull();
    expect(result!.experience).toBeNull();
    expect(result!.resume_url).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return only one profile even if multiple profiles exist for other users', async () => {
    // Create multiple users with profiles
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'User',
        last_name: 'One',
        phone: null
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        role: 'job_seeker',
        first_name: 'User',
        last_name: 'Two',
        phone: null
      })
      .returning()
      .execute();

    const userId1 = user1Result[0].id;
    const userId2 = user2Result[0].id;

    // Create profiles for both users
    await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: userId1,
        bio: 'User 1 bio',
        skills: '["Skill1"]',
        education: 'User 1 education',
        experience: 'User 1 experience',
        resume_url: 'https://example.com/user1-resume.pdf'
      })
      .execute();

    const user2ProfileResult = await db.insert(jobSeekerProfilesTable)
      .values({
        user_id: userId2,
        bio: 'User 2 bio',
        skills: '["Skill2"]',
        education: 'User 2 education',
        experience: 'User 2 experience',
        resume_url: 'https://example.com/user2-resume.pdf'
      })
      .returning()
      .execute();

    // Get profile for user 2
    const result = await getJobSeekerProfile(userId2);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(user2ProfileResult[0].id);
    expect(result!.user_id).toEqual(userId2);
    expect(result!.bio).toEqual('User 2 bio');
    expect(result!.skills).toEqual('["Skill2"]');
    expect(result!.education).toEqual('User 2 education');
    expect(result!.experience).toEqual('User 2 experience');
    expect(result!.resume_url).toEqual('https://example.com/user2-resume.pdf');
  });
});