import { serial, text, pgTable, timestamp, boolean, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['job_seeker', 'company', 'administrator']);
export const jobTypeEnum = pgEnum('job_type', ['internship', 'volunteer']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'accepted', 'rejected', 'withdrawn']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Job seeker profiles table
export const jobSeekerProfilesTable = pgTable('job_seeker_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  skills: text('skills'), // JSON string of skills array
  education: text('education'),
  experience: text('experience'),
  resume_url: text('resume_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Company profiles table
export const companyProfilesTable = pgTable('company_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  company_name: text('company_name').notNull(),
  description: text('description'),
  website: text('website'),
  location: text('location'),
  industry: text('industry'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Job postings table
export const jobPostingsTable = pgTable('job_postings', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').notNull().references(() => companyProfilesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: jobTypeEnum('type').notNull(),
  location: text('location'),
  requirements: text('requirements'),
  duration: text('duration'),
  compensation: text('compensation'),
  application_deadline: timestamp('application_deadline'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Job applications table
export const jobApplicationsTable = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  job_posting_id: integer('job_posting_id').notNull().references(() => jobPostingsTable.id, { onDelete: 'cascade' }),
  job_seeker_id: integer('job_seeker_id').notNull().references(() => jobSeekerProfilesTable.id, { onDelete: 'cascade' }),
  status: applicationStatusEnum('status').default('pending').notNull(),
  cover_letter: text('cover_letter'),
  applied_at: timestamp('applied_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  jobSeekerProfile: one(jobSeekerProfilesTable, {
    fields: [usersTable.id],
    references: [jobSeekerProfilesTable.user_id]
  }),
  companyProfile: one(companyProfilesTable, {
    fields: [usersTable.id],
    references: [companyProfilesTable.user_id]
  })
}));

export const jobSeekerProfilesRelations = relations(jobSeekerProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [jobSeekerProfilesTable.user_id],
    references: [usersTable.id]
  }),
  applications: many(jobApplicationsTable)
}));

export const companyProfilesRelations = relations(companyProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [companyProfilesTable.user_id],
    references: [usersTable.id]
  }),
  jobPostings: many(jobPostingsTable)
}));

export const jobPostingsRelations = relations(jobPostingsTable, ({ one, many }) => ({
  company: one(companyProfilesTable, {
    fields: [jobPostingsTable.company_id],
    references: [companyProfilesTable.id]
  }),
  applications: many(jobApplicationsTable)
}));

export const jobApplicationsRelations = relations(jobApplicationsTable, ({ one }) => ({
  jobPosting: one(jobPostingsTable, {
    fields: [jobApplicationsTable.job_posting_id],
    references: [jobPostingsTable.id]
  }),
  jobSeeker: one(jobSeekerProfilesTable, {
    fields: [jobApplicationsTable.job_seeker_id],
    references: [jobSeekerProfilesTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type JobSeekerProfile = typeof jobSeekerProfilesTable.$inferSelect;
export type NewJobSeekerProfile = typeof jobSeekerProfilesTable.$inferInsert;

export type CompanyProfile = typeof companyProfilesTable.$inferSelect;
export type NewCompanyProfile = typeof companyProfilesTable.$inferInsert;

export type JobPosting = typeof jobPostingsTable.$inferSelect;
export type NewJobPosting = typeof jobPostingsTable.$inferInsert;

export type JobApplication = typeof jobApplicationsTable.$inferSelect;
export type NewJobApplication = typeof jobApplicationsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  jobSeekerProfiles: jobSeekerProfilesTable,
  companyProfiles: companyProfilesTable,
  jobPostings: jobPostingsTable,
  jobApplications: jobApplicationsTable
};