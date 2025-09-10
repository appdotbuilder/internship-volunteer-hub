import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companyProfilesTable, jobPostingsTable } from '../db/schema';
import { type SearchJobsInput } from '../schema';
import { searchJobPostings } from '../handlers/search_job_postings';

describe('searchJobPostings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Setup helper function to create test data
  const setupTestData = async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'company1@test.com',
          password_hash: 'hash1',
          role: 'company',
          first_name: 'Tech',
          last_name: 'Corp'
        },
        {
          email: 'company2@test.com',
          password_hash: 'hash2',
          role: 'company',
          first_name: 'Non',
          last_name: 'Profit'
        }
      ])
      .returning()
      .execute();

    // Create company profiles
    const companies = await db.insert(companyProfilesTable)
      .values([
        {
          user_id: users[0].id,
          company_name: 'Tech Corp',
          location: 'San Francisco, CA',
          industry: 'Technology'
        },
        {
          user_id: users[1].id,
          company_name: 'Community Helper',
          location: 'New York, NY',
          industry: 'Non-profit'
        }
      ])
      .returning()
      .execute();

    // Create job postings with different characteristics
    const jobPostings = await db.insert(jobPostingsTable)
      .values([
        {
          company_id: companies[0].id,
          title: 'Frontend Developer Intern',
          description: 'Join our team as a frontend developer intern working with React and JavaScript',
          type: 'internship',
          location: 'San Francisco, CA',
          requirements: 'JavaScript, React, CSS',
          duration: '3 months',
          compensation: 'Stipend: $2000/month',
          application_deadline: new Date('2024-12-31'),
          is_active: true
        },
        {
          company_id: companies[0].id,
          title: 'Backend Developer Intern',
          description: 'Work on server-side development with Node.js and databases',
          type: 'internship',
          location: 'Remote',
          requirements: 'Node.js, SQL, API development',
          duration: '6 months',
          compensation: 'Stipend: $2500/month',
          application_deadline: new Date('2024-11-30'),
          is_active: true
        },
        {
          company_id: companies[1].id,
          title: 'Community Outreach Volunteer',
          description: 'Help us make a difference in the community through outreach programs',
          type: 'volunteer',
          location: 'New York, NY',
          requirements: 'Good communication skills, passion for community service',
          duration: 'Flexible',
          compensation: 'Unpaid',
          application_deadline: null,
          is_active: true
        },
        {
          company_id: companies[1].id,
          title: 'Event Planning Volunteer',
          description: 'Assist with planning and organizing community events',
          type: 'volunteer',
          location: 'New York, NY',
          requirements: 'Organization skills, creativity',
          duration: 'Part-time',
          compensation: 'Unpaid',
          application_deadline: new Date('2024-10-15'),
          is_active: true
        },
        {
          company_id: companies[0].id,
          title: 'Inactive Position',
          description: 'This position is no longer active',
          type: 'internship',
          location: 'San Francisco, CA',
          requirements: 'Any',
          duration: '3 months',
          compensation: 'Paid',
          application_deadline: null,
          is_active: false // Inactive job posting
        }
      ])
      .returning()
      .execute();

    return { users, companies, jobPostings };
  };

  it('should return all active job postings with default pagination', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    // Should return 4 active job postings (excluding the inactive one)
    expect(results).toHaveLength(4);
    
    // Verify all returned jobs are active
    results.forEach(job => {
      expect(job.is_active).toBe(true);
    });

    // Verify ordering (most recent first)
    expect(results[0].created_at >= results[1].created_at).toBe(true);
    expect(results[1].created_at >= results[2].created_at).toBe(true);
  });

  it('should filter by search query in title', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      query: 'Frontend',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Frontend Developer Intern');
  });

  it('should filter by search query in description', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      query: 'community',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(2);
    results.forEach(job => {
      expect(job.description.toLowerCase()).toContain('community');
    });
  });

  it('should filter by job type', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      type: 'volunteer',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(2);
    results.forEach(job => {
      expect(job.type).toEqual('volunteer');
    });
  });

  it('should filter by location (case-insensitive partial match)', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      location: 'san francisco',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(1);
    expect(results[0].location).toEqual('San Francisco, CA');
  });

  it('should filter by company_id', async () => {
    const { companies } = await setupTestData();

    const input: SearchJobsInput = {
      company_id: companies[1].id,
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(2);
    results.forEach(job => {
      expect(job.company_id).toEqual(companies[1].id);
    });
  });

  it('should combine multiple filters correctly', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      query: 'developer',
      type: 'internship',
      location: 'remote',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Backend Developer Intern');
    expect(results[0].type).toEqual('internship');
    expect(results[0].location).toEqual('Remote');
  });

  it('should handle pagination correctly', async () => {
    await setupTestData();

    // Get first 2 results
    const firstPage = await searchJobPostings({
      limit: 2,
      offset: 0
    });

    expect(firstPage).toHaveLength(2);

    // Get next 2 results
    const secondPage = await searchJobPostings({
      limit: 2,
      offset: 2
    });

    expect(secondPage).toHaveLength(2);

    // Ensure no overlap between pages
    const firstPageIds = firstPage.map(job => job.id);
    const secondPageIds = secondPage.map(job => job.id);
    
    firstPageIds.forEach(id => {
      expect(secondPageIds).not.toContain(id);
    });
  });

  it('should return empty array when no matches found', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      query: 'nonexistent job',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when offset exceeds available results', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      limit: 20,
      offset: 100 // Way beyond available data
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(0);
  });

  it('should handle search with special characters', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      query: 'Node.js',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    expect(results).toHaveLength(1);
    expect(results[0].requirements).toContain('Node.js');
  });

  it('should exclude inactive job postings', async () => {
    await setupTestData();

    const input: SearchJobsInput = {
      query: 'Inactive',
      limit: 20,
      offset: 0
    };

    const results = await searchJobPostings(input);

    // Should not find the inactive job posting
    expect(results).toHaveLength(0);
  });
});