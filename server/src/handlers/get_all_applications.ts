import { db } from '../db';
import { jobApplicationsTable, jobPostingsTable, jobSeekerProfilesTable, usersTable, companyProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ApplicationWithDetails {
  id: number;
  job_title: string;
  company_name: string;
  company_verification_status: 'pending' | 'verified' | 'rejected';
  job_seeker_name: string;
  job_seeker_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  cover_letter: string | null;
  applied_at: Date;
  updated_at: Date;
}

export const getAllApplications = async (): Promise<ApplicationWithDetails[]> => {
  try {
    const results = await db
      .select({
        application_id: jobApplicationsTable.id,
        application_status: jobApplicationsTable.status,
        application_cover_letter: jobApplicationsTable.cover_letter,
        application_applied_at: jobApplicationsTable.applied_at,
        application_updated_at: jobApplicationsTable.updated_at,
        job_title: jobPostingsTable.title,
        company_name: companyProfilesTable.company_name,
        company_verification_status: companyProfilesTable.verification_status,
        job_seeker_first_name: usersTable.first_name,
        job_seeker_last_name: usersTable.last_name,
        job_seeker_email: usersTable.email,
      })
      .from(jobApplicationsTable)
      .innerJoin(jobPostingsTable, eq(jobApplicationsTable.job_posting_id, jobPostingsTable.id))
      .innerJoin(companyProfilesTable, eq(jobPostingsTable.company_id, companyProfilesTable.id))
      .innerJoin(jobSeekerProfilesTable, eq(jobApplicationsTable.job_seeker_id, jobSeekerProfilesTable.id))
      .innerJoin(usersTable, eq(jobSeekerProfilesTable.user_id, usersTable.id))
      .execute();

    return results.map(result => ({
      id: result.application_id,
      job_title: result.job_title,
      company_name: result.company_name,
      company_verification_status: result.company_verification_status,
      job_seeker_name: `${result.job_seeker_first_name} ${result.job_seeker_last_name}`,
      job_seeker_email: result.job_seeker_email,
      status: result.application_status,
      cover_letter: result.application_cover_letter,
      applied_at: result.application_applied_at,
      updated_at: result.application_updated_at,
    }));
  } catch (error) {
    console.error('Failed to get all applications:', error);
    throw error;
  }
};