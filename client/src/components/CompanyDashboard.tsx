import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, JobPosting, JobApplication, CompanyProfile, CreateJobPostingInput, UpdateJobPostingInput, UpdateCompanyProfileInput } from '../../../server/src/schema';
import { exportToExcel, formatDateForExcel } from './ExcelExportUtils';
import type { JobApplicationWithDetails } from '../../../server/src/handlers/get_job_applications_with_details';

interface CompanyDashboardProps {
  user: User;
}

export function CompanyDashboard({ user }: CompanyDashboardProps) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [jobApplicationsWithDetails, setJobApplicationsWithDetails] = useState<JobApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Job posting form state
  const [jobForm, setJobForm] = useState<CreateJobPostingInput>({
    company_id: user.id, // This should be the company profile ID, but using user ID for demo
    title: '',
    description: '',
    type: 'internship',
    location: null,
    requirements: null,
    duration: null,
    compensation: null,
    application_deadline: null
  });

  // Company profile form state
  const [companyProfileForm, setCompanyProfileForm] = useState<UpdateCompanyProfileInput>({
    id: 0,
    company_name: undefined,
    description: null,
    website: null,
    location: null,
    industry: null
  });

  const loadCompanyProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await trpc.getCompanyProfile.query({ userId: user.id });
      setCompanyProfile(profile);
      if (profile) {
        setJobForm((prev: CreateJobPostingInput) => ({ ...prev, company_id: profile.id }));
        setCompanyProfileForm({
          id: profile.id,
          company_name: profile.company_name,
          description: profile.description,
          website: profile.website,
          location: profile.location,
          industry: profile.industry
        });
      }
    } catch (error) {
      console.error('Failed to load company profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user.id]);

  const loadJobPostings = useCallback(async () => {
    setIsLoading(true);
    try {
      const jobs = await trpc.getCompanyJobPostings.query({ id: user.id });
      setJobPostings(jobs);
      if (!selectedJob && jobs.length > 0) {
        setSelectedJob(jobs[0]);
      }
    } catch (error) {
      console.error('Failed to load job postings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, selectedJob]);

  const loadJobApplications = useCallback(async (jobId: number) => {
    try {
      const applications = await trpc.getJobApplicationsForJob.query({ id: jobId });
      const applicationsWithDetails = await trpc.getJobApplicationsWithDetails.query({ id: jobId });
      setJobApplications(applications);
      setJobApplicationsWithDetails(applicationsWithDetails);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }, []);

  useEffect(() => {
    loadCompanyProfile();
    loadJobPostings();
  }, [loadCompanyProfile, loadJobPostings]);

  useEffect(() => {
    if (selectedJob) {
      loadJobApplications(selectedJob.id);
    }
  }, [selectedJob, loadJobApplications]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newJob = await trpc.createJobPosting.mutate(jobForm);
      setJobPostings((prev: JobPosting[]) => [...prev, newJob]);
      setShowJobForm(false);
      resetJobForm();
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    setIsLoading(true);
    try {
      const updateData: UpdateJobPostingInput = {
        id: editingJob.id,
        title: jobForm.title,
        description: jobForm.description,
        type: jobForm.type,
        location: jobForm.location,
        requirements: jobForm.requirements,
        duration: jobForm.duration,
        compensation: jobForm.compensation,
        application_deadline: jobForm.application_deadline
      };

      const updatedJob = await trpc.updateJobPosting.mutate(updateData);
      setJobPostings((prev: JobPosting[]) => 
        prev.map((job: JobPosting) => job.id === updatedJob.id ? updatedJob : job)
      );
      setSelectedJob(updatedJob);
      setEditingJob(null);
      setShowJobForm(false);
      resetJobForm();
    } catch (error) {
      console.error('Failed to update job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await trpc.deleteJobPosting.mutate({ id: jobId });
      setJobPostings((prev: JobPosting[]) => prev.filter((job: JobPosting) => job.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, status: 'accepted' | 'rejected') => {
    try {
      await trpc.updateApplicationStatus.mutate({ id: applicationId, status });
      // Reload applications
      if (selectedJob) {
        loadJobApplications(selectedJob.id);
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const resetJobForm = () => {
    setJobForm({
      company_id: companyProfile?.id || user.id,
      title: '',
      description: '',
      type: 'internship',
      location: null,
      requirements: null,
      duration: null,
      compensation: null,
      application_deadline: null
    });
  };

  const startEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobForm({
      company_id: job.company_id,
      title: job.title,
      description: job.description,
      type: job.type,
      location: job.location,
      requirements: job.requirements,
      duration: job.duration,
      compensation: job.compensation,
      application_deadline: job.application_deadline
    });
    setShowJobForm(true);
  };

  const handleExportApplicants = async () => {
    if (!selectedJob) return;
    
    setIsExporting(true);
    try {
      const exportData = jobApplicationsWithDetails.map((application: JobApplicationWithDetails) => ({
        'Application ID': application.id,
        'Job Seeker Name': application.job_seeker_name,
        'Job Seeker Email': application.job_seeker_email,
        'Application Status': application.status.charAt(0).toUpperCase() + application.status.slice(1),
        'Cover Letter': application.cover_letter || '',
        'Applied Date': formatDateForExcel(application.applied_at),
        'Updated Date': formatDateForExcel(application.updated_at)
      }));
      
      const success = exportToExcel(
        exportData, 
        `${selectedJob.title}_applicants_${new Date().toISOString().split('T')[0]}`, 
        'Applicants'
      );
      
      if (!success) {
        alert('Failed to export applicants. Please try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export applicants. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyProfile) return;

    setIsUpdatingProfile(true);
    try {
      const updatedProfile = await trpc.updateCompanyProfile.mutate(companyProfileForm);
      setCompanyProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update company profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          🏢 Company Dashboard
        </h1>
        <Dialog open={showJobForm} onOpenChange={(open) => {
          setShowJobForm(open);
          if (!open) {
            setEditingJob(null);
            resetJobForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              ➕ Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingJob ? handleUpdateJob : handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={jobForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJobForm((prev: CreateJobPostingInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={jobForm.type || 'internship'}
                    onValueChange={(value: 'internship' | 'volunteer') =>
                      setJobForm((prev: CreateJobPostingInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">💼 Internship</SelectItem>
                      <SelectItem value="volunteer">🤝 Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={jobForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setJobForm((prev: CreateJobPostingInput) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location (Optional)</Label>
                  <Input
                    value={jobForm.location || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJobForm((prev: CreateJobPostingInput) => ({ ...prev, location: e.target.value || null }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Optional)</Label>
                  <Input
                    value={jobForm.duration || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJobForm((prev: CreateJobPostingInput) => ({ ...prev, duration: e.target.value || null }))
                    }
                    placeholder="e.g. 3 months, Summer 2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Requirements (Optional)</Label>
                <Textarea
                  value={jobForm.requirements || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setJobForm((prev: CreateJobPostingInput) => ({ ...prev, requirements: e.target.value || null }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compensation (Optional)</Label>
                  <Input
                    value={jobForm.compensation || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJobForm((prev: CreateJobPostingInput) => ({ ...prev, compensation: e.target.value || null }))
                    }
                    placeholder="e.g. Unpaid, $1000/month"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Deadline (Optional)</Label>
                  <Input
                    type="date"
                    value={jobForm.application_deadline ? new Date(jobForm.application_deadline).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJobForm((prev: CreateJobPostingInput) => ({ 
                        ...prev, 
                        application_deadline: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowJobForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">My Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* Job Postings List */}
            <div className="space-y-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-700">
                📋 Your Job Postings ({jobPostings.length})
              </h3>
              {jobPostings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    📝 You haven't posted any jobs yet. Create your first posting!
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
                          <div className="flex items-center gap-2">
                            <Badge variant={job.type === 'internship' ? 'default' : 'secondary'}>
                              {job.type === 'internship' ? '💼' : '🤝'}
                            </Badge>
                            {!job.is_active && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {job.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">📍 {job.location || 'Location TBD'}</span>
                          <span className="text-gray-500">
                            Posted: {job.created_at.toLocaleDateString()}
                          </span>
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
                          {!selectedJob.is_active && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditJob(selectedJob)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteJob(selectedJob.id)}
                        >
                          🗑️ Delete
                        </Button>
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
                      <p className="text-sm text-gray-500">
                        Created: {selectedJob.created_at.toLocaleDateString()} | 
                        Updated: {selectedJob.updated_at.toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-gray-500">
                    👈 Select a job posting to view details and manage applications
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className="space-y-4">
            {selectedJob ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                      📄 Applications for: {selectedJob.title}
                    </h3>
                    <Badge>{jobApplications.length} applications</Badge>
                  </div>
                  <Button
                    onClick={handleExportApplicants}
                    disabled={isExporting || jobApplicationsWithDetails.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    📊 Export Applicants to XLS
                  </Button>
                </div>
                {jobApplications.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      📭 No applications received yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {jobApplications.map((application: JobApplication) => (
                      <Card key={application.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">Application #{application.id}</h4>
                              <p className="text-sm text-gray-500">
                                Applied: {application.applied_at.toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant={application.status === 'accepted' ? 'default' : 
                                     application.status === 'rejected' ? 'destructive' : 'secondary'}
                            >
                              {application.status}
                            </Badge>
                          </div>
                          
                          {application.cover_letter && (
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                              <h5 className="font-medium mb-1">Cover Letter:</h5>
                              <p className="text-sm text-gray-700">{application.cover_letter}</p>
                            </div>
                          )}

                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateApplicationStatus(application.id, 'accepted')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                ✅ Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                              >
                                ❌ Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  👈 Select a job posting from the "My Job Postings" tab to view its applications
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏢 Company Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="text-center text-gray-500">Loading profile...</div>
              ) : (
                <form onSubmit={handleUpdateCompanyProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Company Name *</label>
                      <Input
                        value={companyProfileForm.company_name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompanyProfileForm((prev: UpdateCompanyProfileInput) => ({ 
                            ...prev, 
                            company_name: e.target.value 
                          }))
                        }
                        placeholder="Your company name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Industry</label>
                      <Input
                        value={companyProfileForm.industry || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompanyProfileForm((prev: UpdateCompanyProfileInput) => ({ 
                            ...prev, 
                            industry: e.target.value || null 
                          }))
                        }
                        placeholder="e.g., Technology, Healthcare, Education"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Company Description</label>
                    <Textarea
                      value={companyProfileForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCompanyProfileForm((prev: UpdateCompanyProfileInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Tell us about your company, mission, and values..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Website</label>
                      <Input
                        type="url"
                        value={companyProfileForm.website || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompanyProfileForm((prev: UpdateCompanyProfileInput) => ({ 
                            ...prev, 
                            website: e.target.value || null 
                          }))
                        }
                        placeholder="https://yourcompany.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <Input
                        value={companyProfileForm.location || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompanyProfileForm((prev: UpdateCompanyProfileInput) => ({ 
                            ...prev, 
                            location: e.target.value || null 
                          }))
                        }
                        placeholder="City, State/Country"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isUpdatingProfile} className="bg-green-600 hover:bg-green-700">
                      {isUpdatingProfile ? 'Updating...' : '💾 Update Profile'}
                    </Button>
                  </div>

                  {companyProfile && (
                    <div className="pt-4 border-t text-sm text-gray-500">
                      Profile last updated: {companyProfile.updated_at.toLocaleDateString()}
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