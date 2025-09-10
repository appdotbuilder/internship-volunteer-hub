import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getAllUsers } from '../handlers/get_all_users';

describe('getAllUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getAllUsers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users when users exist', async () => {
    // Insert test users directly into database
    await db.insert(usersTable).values([
      {
        email: 'jobseeker@example.com',
        password_hash: 'hashed_password_1',
        role: 'job_seeker',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567890'
      },
      {
        email: 'company@example.com',
        password_hash: 'hashed_password_2',
        role: 'company',
        first_name: 'John',
        last_name: 'Corporate',
        phone: null
      },
      {
        email: 'admin@example.com',
        password_hash: 'hashed_password_3',
        role: 'administrator',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+9876543210'
      }
    ]).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(3);
    
    // Verify all users are returned with correct data
    const jobSeeker = result.find(user => user.email === 'jobseeker@example.com');
    expect(jobSeeker).toBeDefined();
    expect(jobSeeker?.role).toBe('job_seeker');
    expect(jobSeeker?.first_name).toBe('Jane');
    expect(jobSeeker?.last_name).toBe('Smith');
    expect(jobSeeker?.phone).toBe('+1234567890');
    expect(jobSeeker?.id).toBeDefined();
    expect(jobSeeker?.created_at).toBeInstanceOf(Date);
    expect(jobSeeker?.updated_at).toBeInstanceOf(Date);

    const company = result.find(user => user.email === 'company@example.com');
    expect(company).toBeDefined();
    expect(company?.role).toBe('company');
    expect(company?.first_name).toBe('John');
    expect(company?.last_name).toBe('Corporate');
    expect(company?.phone).toBeNull();

    const admin = result.find(user => user.email === 'admin@example.com');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('administrator');
    expect(admin?.phone).toBe('+9876543210');
  });

  it('should return users with correct data types', async () => {
    // Insert single test user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'job_seeker',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1111111111'
    }).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(1);
    
    const user = result[0];
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof user.first_name).toBe('string');
    expect(typeof user.last_name).toBe('string');
    expect(typeof user.phone).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should handle users with null phone numbers', async () => {
    // Insert user with null phone
    await db.insert(usersTable).values({
      email: 'nullphone@example.com',
      password_hash: 'hashed_password',
      role: 'company',
      first_name: 'No',
      last_name: 'Phone',
      phone: null
    }).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(1);
    expect(result[0].phone).toBeNull();
  });

  it('should return users in database insertion order', async () => {
    // Insert users in specific order
    await db.insert(usersTable).values({
      email: 'first@example.com',
      password_hash: 'hash1',
      role: 'job_seeker',
      first_name: 'First',
      last_name: 'User'
    }).execute();

    await db.insert(usersTable).values({
      email: 'second@example.com',
      password_hash: 'hash2',
      role: 'company',
      first_name: 'Second',
      last_name: 'User'
    }).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(2);
    expect(result[0].email).toBe('first@example.com');
    expect(result[1].email).toBe('second@example.com');
    
    // Verify IDs are sequential
    expect(result[1].id).toBe(result[0].id + 1);
  });
});