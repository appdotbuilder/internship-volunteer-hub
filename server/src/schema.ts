import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['job_seeker', 'company', 'administrator']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Job types enum
export const jobTypeSchema = z.enum(['internship', 'volunteer']);
export type JobType = z.infer<typeof jobTypeSchema>;

// Application status enum
export const applicationStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'withdrawn']);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

// Verification status enum
export const verificationStatusSchema = z.enum(['pending', 'verified', 'rejected']);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Job seeker profile schema
export const jobSeekerProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  bio: z.string().nullable(),
  skills: z.string().nullable(), // JSON string of skills array
  education: z.string().nullable(),
  experience: z.string().nullable(),
  resume_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobSeekerProfile = z.infer<typeof jobSeekerProfileSchema>;

// Company profile schema
export const companyProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  company_name: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  location: z.string().nullable(),
  industry: z.string().nullable(),
  credentials_file_url: z.string().nullable(),
  verification_status: verificationStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

// Job posting schema
export const jobPostingSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  title: z.string(),
  description: z.string(),
  type: jobTypeSchema,
  location: z.string().nullable(),
  requirements: z.string().nullable(),
  duration: z.string().nullable(), // e.g., "3 months", "Summer 2024"
  compensation: z.string().nullable(), // Can be "Unpaid", "Stipend: $500/month", etc.
  application_deadline: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobPosting = z.infer<typeof jobPostingSchema>;

// Job application schema
export const jobApplicationSchema = z.object({
  id: z.number(),
  job_posting_id: z.number(),
  job_seeker_id: z.number(),
  status: applicationStatusSchema,
  cover_letter: z.string().nullable(),
  applied_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type JobApplication = z.infer<typeof jobApplicationSchema>;

// Input schemas for creating entities

// User registration input
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: userRoleSchema,
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// User login input
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Job seeker profile input
export const createJobSeekerProfileInputSchema = z.object({
  user_id: z.number(),
  bio: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional()
});

export type CreateJobSeekerProfileInput = z.infer<typeof createJobSeekerProfileInputSchema>;

export const updateJobSeekerProfileInputSchema = z.object({
  id: z.number(),
  bio: z.string().nullable().optional(),
  skills: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  resume_url: z.string().nullable().optional()
});

export type UpdateJobSeekerProfileInput = z.infer<typeof updateJobSeekerProfileInputSchema>;

// Company profile input
export const createCompanyProfileInputSchema = z.object({
  user_id: z.number(),
  company_name: z.string().min(1),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  credentials_file_url: z.string().nullable().optional()
});

export type CreateCompanyProfileInput = z.infer<typeof createCompanyProfileInputSchema>;

export const updateCompanyProfileInputSchema = z.object({
  id: z.number(),
  company_name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  credentials_file_url: z.string().nullable().optional()
});

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileInputSchema>;

// Job posting input
export const createJobPostingInputSchema = z.object({
  company_id: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  type: jobTypeSchema,
  location: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  compensation: z.string().nullable().optional(),
  application_deadline: z.coerce.date().nullable().optional()
});

export type CreateJobPostingInput = z.infer<typeof createJobPostingInputSchema>;

export const updateJobPostingInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: jobTypeSchema.optional(),
  location: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  compensation: z.string().nullable().optional(),
  application_deadline: z.coerce.date().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateJobPostingInput = z.infer<typeof updateJobPostingInputSchema>;

// Job application input
export const createJobApplicationInputSchema = z.object({
  job_posting_id: z.number(),
  job_seeker_id: z.number(),
  cover_letter: z.string().nullable().optional()
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationInputSchema>;

export const updateJobApplicationStatusInputSchema = z.object({
  id: z.number(),
  status: applicationStatusSchema
});

export type UpdateJobApplicationStatusInput = z.infer<typeof updateJobApplicationStatusInputSchema>;

// Search and filter inputs
export const searchJobsInputSchema = z.object({
  query: z.string().optional(),
  type: jobTypeSchema.optional(),
  location: z.string().optional(),
  company_id: z.number().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchJobsInput = z.infer<typeof searchJobsInputSchema>;

// ID parameter schemas
export const idParamSchema = z.object({
  id: z.number()
});

export type IdParam = z.infer<typeof idParamSchema>;

export const userIdParamSchema = z.object({
  userId: z.number()
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

// Company verification input
export const updateCompanyVerificationInputSchema = z.object({
  id: z.number(),
  status: verificationStatusSchema.refine(status => status === 'verified' || status === 'rejected', {
    message: "Status must be either 'verified' or 'rejected'"
  })
});

export type UpdateCompanyVerificationInput = z.infer<typeof updateCompanyVerificationInputSchema>;

// Company credentials upload input
export const uploadCompanyCredentialsInputSchema = z.object({
  id: z.number(),
  credentials_file_url: z.string()
});

export type UploadCompanyCredentialsInput = z.infer<typeof uploadCompanyCredentialsInputSchema>;