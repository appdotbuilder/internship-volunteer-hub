import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUserById } from '../handlers/get_user_by_id';

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create a test user
    const testUser = {
      email: 'test@example.com',
      password_hash: 'hashed_password_123',
      role: 'job_seeker' as const,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890'
    };

    const [createdUser] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Test getting the user by ID
    const result = await getUserById(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.password_hash).toEqual('hashed_password_123');
    expect(result!.role).toEqual('job_seeker');
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    // Try to get a user with an ID that doesn't exist
    const result = await getUserById(999);

    expect(result).toBeNull();
  });

  it('should handle user with null phone', async () => {
    // Create a test user with null phone
    const testUser = {
      email: 'nophone@example.com',
      password_hash: 'hashed_password_456',
      role: 'company' as const,
      first_name: 'Jane',
      last_name: 'Smith',
      phone: null
    };

    const [createdUser] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Test getting the user by ID
    const result = await getUserById(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('nophone@example.com');
    expect(result!.role).toEqual('company');
    expect(result!.first_name).toEqual('Jane');
    expect(result!.last_name).toEqual('Smith');
    expect(result!.phone).toBeNull();
  });

  it('should handle different user roles', async () => {
    // Create users with different roles
    const jobSeekerUser = {
      email: 'jobseeker@example.com',
      password_hash: 'hash1',
      role: 'job_seeker' as const,
      first_name: 'Alice',
      last_name: 'Johnson',
      phone: null
    };

    const companyUser = {
      email: 'company@example.com',
      password_hash: 'hash2',
      role: 'company' as const,
      first_name: 'Bob',
      last_name: 'Wilson',
      phone: null
    };

    const adminUser = {
      email: 'admin@example.com',
      password_hash: 'hash3',
      role: 'administrator' as const,
      first_name: 'Carol',
      last_name: 'Brown',
      phone: null
    };

    const [createdJobSeeker] = await db.insert(usersTable)
      .values(jobSeekerUser)
      .returning()
      .execute();

    const [createdCompany] = await db.insert(usersTable)
      .values(companyUser)
      .returning()
      .execute();

    const [createdAdmin] = await db.insert(usersTable)
      .values(adminUser)
      .returning()
      .execute();

    // Test each user type
    const jobSeekerResult = await getUserById(createdJobSeeker.id);
    expect(jobSeekerResult!.role).toEqual('job_seeker');

    const companyResult = await getUserById(createdCompany.id);
    expect(companyResult!.role).toEqual('company');

    const adminResult = await getUserById(createdAdmin.id);
    expect(adminResult!.role).toEqual('administrator');
  });

  it('should return user with valid timestamps', async () => {
    // Create a test user
    const testUser = {
      email: 'timestamp@example.com',
      password_hash: 'hashed_password_789',
      role: 'job_seeker' as const,
      first_name: 'Time',
      last_name: 'Stamp',
      phone: null
    };

    const [createdUser] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await getUserById(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are reasonable (within last few seconds)
    const now = new Date();
    const timeDiff = now.getTime() - result!.created_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds ago
  });
});