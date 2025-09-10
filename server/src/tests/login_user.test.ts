import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test data
const testUserData = {
  email: 'test@example.com',
  password: 'password123',
  role: 'job_seeker' as const,
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    // Create a test user - for this test, password is stored as plain text
    await db.insert(usersTable).values({
      email: testUserData.email,
      password_hash: testUserData.password, // In real app, this would be hashed
      role: testUserData.role,
      first_name: testUserData.first_name,
      last_name: testUserData.last_name,
      phone: testUserData.phone
    }).execute();

    // Attempt login
    const result = await loginUser(testLoginInput);

    // Verify user data
    expect(result.email).toEqual(testUserData.email);
    expect(result.role).toEqual(testUserData.role);
    expect(result.first_name).toEqual(testUserData.first_name);
    expect(result.last_name).toEqual(testUserData.last_name);
    expect(result.phone).toEqual(testUserData.phone);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toEqual(testUserData.password);
  });

  it('should throw error for non-existent email', async () => {
    const invalidLoginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidLoginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create a test user
    await db.insert(usersTable).values({
      email: testUserData.email,
      password_hash: testUserData.password,
      role: testUserData.role,
      first_name: testUserData.first_name,
      last_name: testUserData.last_name,
      phone: testUserData.phone
    }).execute();

    const invalidLoginInput: LoginInput = {
      email: testUserData.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidLoginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle user with null phone', async () => {
    // Create a test user with null phone
    await db.insert(usersTable).values({
      email: testUserData.email,
      password_hash: testUserData.password,
      role: testUserData.role,
      first_name: testUserData.first_name,
      last_name: testUserData.last_name,
      phone: null
    }).execute();

    const result = await loginUser(testLoginInput);

    expect(result.phone).toBeNull();
    expect(result.email).toEqual(testUserData.email);
    expect(result.first_name).toEqual(testUserData.first_name);
  });

  it('should work with different user roles', async () => {
    // Test company user
    const companyUserData = {
      ...testUserData,
      email: 'company@example.com',
      role: 'company' as const
    };

    await db.insert(usersTable).values({
      email: companyUserData.email,
      password_hash: companyUserData.password,
      role: companyUserData.role,
      first_name: companyUserData.first_name,
      last_name: companyUserData.last_name,
      phone: companyUserData.phone
    }).execute();

    const companyLoginInput: LoginInput = {
      email: companyUserData.email,
      password: companyUserData.password
    };

    const result = await loginUser(companyLoginInput);

    expect(result.role).toEqual('company');
    expect(result.email).toEqual(companyUserData.email);
  });

  it('should handle administrator role', async () => {
    // Test administrator user
    const adminUserData = {
      ...testUserData,
      email: 'admin@example.com',
      role: 'administrator' as const
    };

    await db.insert(usersTable).values({
      email: adminUserData.email,
      password_hash: adminUserData.password,
      role: adminUserData.role,
      first_name: adminUserData.first_name,
      last_name: adminUserData.last_name,
      phone: adminUserData.phone
    }).execute();

    const adminLoginInput: LoginInput = {
      email: adminUserData.email,
      password: adminUserData.password
    };

    const result = await loginUser(adminLoginInput);

    expect(result.role).toEqual('administrator');
    expect(result.email).toEqual(adminUserData.email);
  });

  it('should return correct timestamps', async () => {
    // Create a test user
    await db.insert(usersTable).values({
      email: testUserData.email,
      password_hash: testUserData.password,
      role: testUserData.role,
      first_name: testUserData.first_name,
      last_name: testUserData.last_name,
      phone: testUserData.phone
    }).execute();

    const result = await loginUser(testLoginInput);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    // created_at should be close to now (within last few seconds)
    const now = new Date();
    const timeDifference = now.getTime() - result.created_at.getTime();
    expect(timeDifference).toBeLessThan(5000); // Less than 5 seconds
  });
});