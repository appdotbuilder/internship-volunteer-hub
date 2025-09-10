import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test user inputs
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  role: 'job_seeker',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
};

const companyUserInput: CreateUserInput = {
  email: 'company@example.com',
  password: 'securePassword456',
  role: 'company',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: null
};

const adminUserInput: CreateUserInput = {
  email: 'admin@platform.com',
  password: 'adminSecure789',
  role: 'administrator',
  first_name: 'Admin',
  last_name: 'User'
  // phone is optional and omitted
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a job seeker user with all fields', async () => {
    const result = await createUser(testUserInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('job_seeker');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash).toBeTruthy();
    expect(result.password_hash.length).toBeGreaterThan(10);
  });

  it('should create a company user with null phone', async () => {
    const result = await createUser(companyUserInput);

    expect(result.email).toEqual('company@example.com');
    expect(result.role).toEqual('company');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.phone).toBeNull();
    expect(result.password_hash).not.toEqual('securePassword456');
  });

  it('should create an administrator user with undefined phone', async () => {
    const result = await createUser(adminUserInput);

    expect(result.email).toEqual('admin@platform.com');
    expect(result.role).toEqual('administrator');
    expect(result.first_name).toEqual('Admin');
    expect(result.last_name).toEqual('User');
    expect(result.phone).toBeNull(); // Should be converted to null
    expect(result.password_hash).not.toEqual('adminSecure789');
  });

  it('should save user to database correctly', async () => {
    const result = await createUser(testUserInput);

    // Query the database to verify the user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.role).toEqual('job_seeker');
    expect(savedUser.first_name).toEqual('John');
    expect(savedUser.last_name).toEqual('Doe');
    expect(savedUser.phone).toEqual('+1234567890');
    expect(savedUser.password_hash).toBeTruthy();
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should hash passwords securely', async () => {
    const user1 = await createUser({
      ...testUserInput,
      email: 'user1@example.com'
    });

    const user2 = await createUser({
      ...testUserInput,
      email: 'user2@example.com'
    });

    // Same password should produce different hashes
    expect(user1.password_hash).not.toEqual(user2.password_hash);
    
    // Hashes should be verifiable with Bun's password verify
    const isValid1 = await Bun.password.verify('password123', user1.password_hash);
    const isValid2 = await Bun.password.verify('password123', user2.password_hash);
    
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testUserInput);

    // Try to create another user with same email
    const duplicateUserInput: CreateUserInput = {
      ...testUserInput,
      first_name: 'Different',
      last_name: 'Person'
    };

    await expect(createUser(duplicateUserInput))
      .rejects.toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should handle all three user roles correctly', async () => {
    const jobSeekerResult = await createUser({
      ...testUserInput,
      email: 'jobseeker@test.com',
      role: 'job_seeker'
    });

    const companyResult = await createUser({
      ...testUserInput,
      email: 'company@test.com',
      role: 'company'
    });

    const adminResult = await createUser({
      ...testUserInput,
      email: 'admin@test.com',
      role: 'administrator'
    });

    expect(jobSeekerResult.role).toEqual('job_seeker');
    expect(companyResult.role).toEqual('company');
    expect(adminResult.role).toEqual('administrator');

    // Verify all users were saved with correct roles
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(3);
    
    const roles = allUsers.map(u => u.role).sort();
    expect(roles).toEqual(['administrator', 'company', 'job_seeker']);
  });
});