import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import {
  createUserInputSchema,
  loginInputSchema,
  createJobSeekerProfileInputSchema,
  updateJobSeekerProfileInputSchema,
  createCompanyProfileInputSchema,
  updateCompanyProfileInputSchema,
  createJobPostingInputSchema,
  updateJobPostingInputSchema,
  createJobApplicationInputSchema,
  updateJobApplicationStatusInputSchema,
  searchJobsInputSchema,
  idParamSchema,
  userIdParamSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getUserById } from './handlers/get_user_by_id';
import { createJobSeekerProfile } from './handlers/create_job_seeker_profile';
import { updateJobSeekerProfile } from './handlers/update_job_seeker_profile';
import { getJobSeekerProfile } from './handlers/get_job_seeker_profile';
import { createCompanyProfile } from './handlers/create_company_profile';
import { updateCompanyProfile } from './handlers/update_company_profile';
import { getCompanyProfile } from './handlers/get_company_profile';
import { createJobPosting } from './handlers/create_job_posting';
import { updateJobPosting } from './handlers/update_job_posting';
import { deleteJobPosting } from './handlers/delete_job_posting';
import { getJobPosting } from './handlers/get_job_posting';
import { searchJobPostings } from './handlers/search_job_postings';
import { getCompanyJobPostings } from './handlers/get_company_job_postings';
import { createJobApplication } from './handlers/create_job_application';
import { updateApplicationStatus } from './handlers/update_application_status';
import { getJobApplicationsForJob } from './handlers/get_job_applications_for_job';
import { getUserApplications } from './handlers/get_user_applications';
import { getAllUsers } from './handlers/get_all_users';
import { deleteUser } from './handlers/delete_user';
import { getAllJobPostings } from './handlers/get_all_job_postings';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUserById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getUserById(input.id)),

  // Job Seeker Profile management
  createJobSeekerProfile: publicProcedure
    .input(createJobSeekerProfileInputSchema)
    .mutation(({ input }) => createJobSeekerProfile(input)),

  updateJobSeekerProfile: publicProcedure
    .input(updateJobSeekerProfileInputSchema)
    .mutation(({ input }) => updateJobSeekerProfile(input)),

  getJobSeekerProfile: publicProcedure
    .input(userIdParamSchema)
    .query(({ input }) => getJobSeekerProfile(input.userId)),

  // Company Profile management
  createCompanyProfile: publicProcedure
    .input(createCompanyProfileInputSchema)
    .mutation(({ input }) => createCompanyProfile(input)),

  updateCompanyProfile: publicProcedure
    .input(updateCompanyProfileInputSchema)
    .mutation(({ input }) => updateCompanyProfile(input)),

  getCompanyProfile: publicProcedure
    .input(userIdParamSchema)
    .query(({ input }) => getCompanyProfile(input.userId)),

  // Job Posting management
  createJobPosting: publicProcedure
    .input(createJobPostingInputSchema)
    .mutation(({ input }) => createJobPosting(input)),

  updateJobPosting: publicProcedure
    .input(updateJobPostingInputSchema)
    .mutation(({ input }) => updateJobPosting(input)),

  deleteJobPosting: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteJobPosting(input.id)),

  getJobPosting: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getJobPosting(input.id)),

  // Job searching and browsing
  searchJobPostings: publicProcedure
    .input(searchJobsInputSchema)
    .query(({ input }) => searchJobPostings(input)),

  getCompanyJobPostings: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getCompanyJobPostings(input.id)),

  // Job Application management
  createJobApplication: publicProcedure
    .input(createJobApplicationInputSchema)
    .mutation(({ input }) => createJobApplication(input)),

  updateApplicationStatus: publicProcedure
    .input(updateJobApplicationStatusInputSchema)
    .mutation(({ input }) => updateApplicationStatus(input)),

  getJobApplicationsForJob: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getJobApplicationsForJob(input.id)),

  getUserApplications: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getUserApplications(input.id)),

  // Admin functions
  getAllUsers: publicProcedure
    .query(() => getAllUsers()),

  deleteUser: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteUser(input.id)),

  getAllJobPostings: publicProcedure
    .query(() => getAllJobPostings()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();