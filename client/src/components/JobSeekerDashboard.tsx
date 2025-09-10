import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, JobPosting, JobApplication, SearchJobsInput, JobSeekerProfile, UpdateJobSeekerProfileInput } from '../../../server/src/schema';

interface JobSeekerDashboardProps {
  user: User;
}

export function JobSeekerDashboard({ user }: JobSeekerDashboardProps) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [userApplications, setUserApplications] = useState<JobApplication[]>([]);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Search filters
  const [searchFilters, setSearchFilters] = useState<SearchJobsInput>({
    query: '',
    type: undefined,
    location: '',
    limit: 20,
    offset: 0
  });

  // Application form
  const [applicationData, setApplicationData] = useState({
    cover_letter: ''
  });

  // Profile form
  const [profileForm, setProfileForm] = useState<UpdateJobSeekerProfileInput>({
    id: 0,
    bio: null,
    skills: null,
    education: null,
    experience: null,
    resume_url: null
  });

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const jobs = await trpc.searchJobPostings.query(searchFilters);
      setJobPostings(jobs);
      if (!selectedJob && jobs.length > 0) {
        setSelectedJob(jobs[0]);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchFilters, selectedJob]);

  const loadUserApplications = useCallback(async () => {
    try {
      const applications = await trpc.getUserApplications.query({ id: user.id });
      setUserApplications(applications);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }, [user.id]);

  const loadJobSeekerProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await trpc.getJobSeekerProfile.query({ userId: user.id });
      setJobSeekerProfile(profile);
      if (profile) {
        setProfileForm({
          id: profile.id,
          bio: profile.bio,
          skills: profile.skills,
          education: profile.education,
          experience: profile.experience,
          resume_url: profile.resume_url
        });
      }
    } catch (error) {
      console.error('Failed to load job seeker profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadUserApplications();
  }, [loadUserApplications]);

  useEffect(() => {
    loadJobSeekerProfile();
  }, [loadJobSeekerProfile]);

  const handleSearch = () => {
    loadJobs();
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsApplying(true);
    try {
      await trpc.createJobApplication.mutate({
        job_posting_id: selectedJob.id,
        job_seeker_id: user.id,
        cover_letter: applicationData.cover_letter || null
      });
      
      // Refresh applications
      await loadUserApplications();
      setShowApplicationForm(false);
      setApplicationData({ cover_letter: '' });
    } catch (error) {
      console.error('Failed to apply:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const isAlreadyApplied = (jobId: number) => {
    return userApplications.some((app: JobApplication) => app.job_posting_id === jobId);
  };

  const getApplicationStatus = (jobId: number) => {
    const application = userApplications.find((app: JobApplication) => app.job_posting_id === jobId);
    return application?.status;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobSeekerProfile) return;

    setIsUpdatingProfile(true);
    try {
      const updatedProfile = await trpc.updateJobSeekerProfile.mutate(profileForm);
      setJobSeekerProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          🔍 Discover Opportunities
        </h1>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {/* Search Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🎯 Find Your Perfect Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search jobs..."
                  value={searchFilters.query || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchFilters((prev: SearchJobsInput) => ({ ...prev, query: e.target.value || undefined }))
                  }
                />
                <Select
                  value={searchFilters.type || 'all'}
                  onValueChange={(value) =>
                    setSearchFilters((prev: SearchJobsInput) => ({ 
                      ...prev, 
                      type: value === 'all' ? undefined : value as 'internship' | 'volunteer'
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="internship">💼 Internships</SelectItem>
                    <SelectItem value="volunteer">🤝 Volunteer</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Location..."
                  value={searchFilters.location || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchFilters((prev: SearchJobsInput) => ({ ...prev, location: e.target.value || undefined }))
                  }
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* Job List Panel */}
            <div className="space-y-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-700">
                📋 Available Positions ({jobPostings.length})
              </h3>
              {jobPostings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    🔍 No jobs found. Try adjusting your search criteria.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {jobPostings.map((job: JobPosting) => (
                    <Card
                      key={job.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedJob?.id === job.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 line-clamp-1">
                            {job.title}
                          </h4>
                          <Badge variant={job.type === 'internship' ? 'default' : 'secondary'}>
                            {job.type === 'internship' ? '💼 Internship' : '🤝 Volunteer'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {job.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">📍 {job.location || 'Location TBD'}</span>
                          {isAlreadyApplied(job.id) && (
                            <Badge 
                              variant={getApplicationStatus(job.id) === 'accepted' ? 'default' : 
                                     getApplicationStatus(job.id) === 'rejected' ? 'destructive' : 'secondary'}
                            >
                              {getApplicationStatus(job.id)}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Job Details Panel */}
            <div className="overflow-y-auto">
              {selectedJob ? (
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{selectedJob.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={selectedJob.type === 'internship' ? 'default' : 'secondary'}>
                            {selectedJob.type === 'internship' ? '💼 Internship' : '🤝 Volunteer'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            📍 {selectedJob.location || 'Location TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">📋 Description</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>

                    {selectedJob.requirements && (
                      <div>
                        <h4 className="font-semibold mb-2">✅ Requirements</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {selectedJob.duration && (
                        <div>
                          <h4 className="font-semibold mb-1">⏰ Duration</h4>
                          <p className="text-gray-700">{selectedJob.duration}</p>
                        </div>
                      )}
                      {selectedJob.compensation && (
                        <div>
                          <h4 className="font-semibold mb-1">💰 Compensation</h4>
                          <p className="text-gray-700">{selectedJob.compensation}</p>
                        </div>
                      )}
                    </div>

                    {selectedJob.application_deadline && (
                      <div>
                        <h4 className="font-semibold mb-1">📅 Application Deadline</h4>
                        <p className="text-gray-700">
                          {selectedJob.application_deadline.toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      {isAlreadyApplied(selectedJob.id) ? (
                        <div className="text-center">
                          <Badge 
                            variant={getApplicationStatus(selectedJob.id) === 'accepted' ? 'default' : 
                                   getApplicationStatus(selectedJob.id) === 'rejected' ? 'destructive' : 'secondary'}
                            className="mb-2"
                          >
                            Application {getApplicationStatus(selectedJob.id)}
                          </Badge>
                          <p className="text-sm text-gray-600">You have already applied for this position</p>
                        </div>
                      ) : showApplicationForm ? (
                        <form onSubmit={handleApply} className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">✍️ Cover Letter (Optional)</h4>
                            <Textarea
                              placeholder="Tell us why you're interested in this position..."
                              value={applicationData.cover_letter}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setApplicationData({ cover_letter: e.target.value })
                              }
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={isApplying} className="flex-1">
                              {isApplying ? 'Submitting...' : 'Submit Application'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowApplicationForm(false);
                                setApplicationData({ cover_letter: '' });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <Button
                          onClick={() => setShowApplicationForm(true)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          🚀 Apply Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-gray-500">
                    👈 Select a job from the list to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              📄 My Applications ({userApplications.length})
            </h3>
            {userApplications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  📭 You haven't applied to any positions yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userApplications.map((application: JobApplication) => {
                  const job = jobPostings.find((j: JobPosting) => j.id === application.job_posting_id);
                  return (
                    <Card key={application.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">
                            {job ? job.title : `Job ID: ${application.job_posting_id}`}
                          </h4>
                          <Badge 
                            variant={application.status === 'accepted' ? 'default' : 
                                   application.status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {application.status}
                          </Badge>
                        </div>
                        {job && (
                          <p className="text-sm text-gray-600 mb-2">{job.location}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          Applied: {application.applied_at.toLocaleDateString()}
                        </div>
                        {application.cover_letter && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Cover Letter:</strong>
                            <p className="mt-1">{application.cover_letter}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="text-center text-gray-500">Loading profile...</div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Bio</label>
                      <Textarea
                        value={profileForm.bio || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setProfileForm((prev: UpdateJobSeekerProfileInput) => ({ 
                            ...prev, 
                            bio: e.target.value || null 
                          }))
                        }
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Skills</label>
                      <Textarea
                        value={profileForm.skills || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setProfileForm((prev: UpdateJobSeekerProfileInput) => ({ 
                            ...prev, 
                            skills: e.target.value || null 
                          }))
                        }
                        placeholder="List your skills (e.g., JavaScript, Python, Communication)"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Education</label>
                    <Textarea
                      value={profileForm.education || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setProfileForm((prev: UpdateJobSeekerProfileInput) => ({ 
                          ...prev, 
                          education: e.target.value || null 
                        }))
                      }
                      placeholder="Your educational background..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Experience</label>
                    <Textarea
                      value={profileForm.experience || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setProfileForm((prev: UpdateJobSeekerProfileInput) => ({ 
                          ...prev, 
                          experience: e.target.value || null 
                        }))
                      }
                      placeholder="Your work experience, internships, projects..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Resume URL</label>
                    <Input
                      type="url"
                      value={profileForm.resume_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileForm((prev: UpdateJobSeekerProfileInput) => ({ 
                          ...prev, 
                          resume_url: e.target.value || null 
                        }))
                      }
                      placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isUpdatingProfile} className="bg-green-600 hover:bg-green-700">
                      {isUpdatingProfile ? 'Updating...' : '💾 Update Profile'}
                    </Button>
                  </div>

                  {jobSeekerProfile && (
                    <div className="pt-4 border-t text-sm text-gray-500">
                      Profile last updated: {jobSeekerProfile.updated_at.toLocaleDateString()}
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}