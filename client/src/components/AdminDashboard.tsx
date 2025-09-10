import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, JobPosting } from '../../../server/src/schema';
import { exportToExcel, formatDateForExcel, formatBooleanForExcel } from './ExcelExportUtils';
import type { ApplicationWithDetails } from '../../../server/src/handlers/get_all_applications';

interface AdminDashboardProps {
  user: User;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdminDashboard(_: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [applicationFilter, setApplicationFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await trpc.getAllUsers.query();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadJobPostings = useCallback(async () => {
    try {
      const allJobs = await trpc.getAllJobPostings.query();
      setJobPostings(allJobs);
    } catch (error) {
      console.error('Failed to load job postings:', error);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const allApplications = await trpc.getAllApplications.query();
      setApplications(allApplications);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadJobPostings();
    loadApplications();
  }, [loadUsers, loadJobPostings, loadApplications]);

  const handleDeleteUser = async (userId: number) => {
    try {
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    try {
      await trpc.deleteJobPosting.mutate({ id: jobId });
      setJobPostings((prev: JobPosting[]) => prev.filter((job: JobPosting) => job.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Failed to delete job posting:', error);
    }
  };

  const filteredUsers = users.filter((u: User) => {
    if (userFilter === 'all') return true;
    return u.role === userFilter;
  });

  const filteredJobs = jobPostings.filter((job: JobPosting) => {
    if (jobFilter === 'all') return true;
    if (jobFilter === 'active') return job.is_active;
    if (jobFilter === 'inactive') return !job.is_active;
    return job.type === jobFilter;
  });

  const filteredApplications = applications.filter((app: ApplicationWithDetails) => {
    if (applicationFilter === 'all') return true;
    return app.status === applicationFilter;
  });

  const getUserStats = () => {
    const stats = users.reduce((acc, user: User) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const getJobStats = () => {
    const stats = {
      total: jobPostings.length,
      active: jobPostings.filter((job: JobPosting) => job.is_active).length,
      inactive: jobPostings.filter((job: JobPosting) => !job.is_active).length,
      internships: jobPostings.filter((job: JobPosting) => job.type === 'internship').length,
      volunteer: jobPostings.filter((job: JobPosting) => job.type === 'volunteer').length
    };
    return stats;
  };

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter((app: ApplicationWithDetails) => app.status === 'pending').length,
      accepted: applications.filter((app: ApplicationWithDetails) => app.status === 'accepted').length,
      rejected: applications.filter((app: ApplicationWithDetails) => app.status === 'rejected').length,
      withdrawn: applications.filter((app: ApplicationWithDetails) => app.status === 'withdrawn').length
    };
    return stats;
  };

  // Export functions
  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const exportData = filteredUsers.map((user: User) => ({
        ID: user.id,
        'First Name': user.first_name,
        'Last Name': user.last_name,
        Email: user.email,
        Role: user.role.replace('_', ' '),
        Phone: user.phone || '',
        'Created Date': formatDateForExcel(user.created_at),
        'Updated Date': formatDateForExcel(user.updated_at)
      }));
      
      const success = exportToExcel(exportData, `users_export_${new Date().toISOString().split('T')[0]}`, 'Users');
      if (!success) {
        alert('Failed to export users. Please try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJobs = async () => {
    setIsExporting(true);
    try {
      const exportData = filteredJobs.map((job: JobPosting) => ({
        ID: job.id,
        Title: job.title,
        Description: job.description,
        Type: job.type.charAt(0).toUpperCase() + job.type.slice(1),
        Location: job.location || '',
        Requirements: job.requirements || '',
        Duration: job.duration || '',
        Compensation: job.compensation || '',
        'Application Deadline': job.application_deadline ? formatDateForExcel(job.application_deadline) : '',
        'Company ID': job.company_id,
        'Is Active': formatBooleanForExcel(job.is_active),
        'Created Date': formatDateForExcel(job.created_at),
        'Updated Date': formatDateForExcel(job.updated_at)
      }));
      
      const success = exportToExcel(exportData, `job_postings_export_${new Date().toISOString().split('T')[0]}`, 'Job Postings');
      if (!success) {
        alert('Failed to export job postings. Please try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export job postings. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportApplications = async () => {
    setIsExporting(true);
    try {
      const exportData = filteredApplications.map((app: ApplicationWithDetails) => ({
        'Application ID': app.id,
        'Job Title': app.job_title,
        'Company Name': app.company_name,
        'Job Seeker Name': app.job_seeker_name,
        'Job Seeker Email': app.job_seeker_email,
        'Application Status': app.status.charAt(0).toUpperCase() + app.status.slice(1),
        'Cover Letter': app.cover_letter || '',
        'Applied Date': formatDateForExcel(app.applied_at),
        'Updated Date': formatDateForExcel(app.updated_at)
      }));
      
      const success = exportToExcel(exportData, `all_applications_export_${new Date().toISOString().split('T')[0]}`, 'Applications');
      if (!success) {
        alert('Failed to export applications. Please try again.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export applications. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const userStats = getUserStats();
  const jobStats = getJobStats();
  const applicationStats = getApplicationStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          👑 Administrator Dashboard
        </h1>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.job_seeker || 0}</div>
              <div className="text-sm text-gray-600">Job Seekers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.company || 0}</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{jobStats.active}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="jobs">Job Management</TabsTrigger>
          <TabsTrigger value="applications">Applications Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle>👥 User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="job_seeker">👨‍💻 Job Seekers</SelectItem>
                      <SelectItem value="company">🏢 Companies</SelectItem>
                      <SelectItem value="administrator">👑 Administrators</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                  </div>
                </div>
                <Button
                  onClick={handleExportUsers}
                  disabled={isExporting || filteredUsers.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📊 Export Users to XLS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'administrator' ? 'default' :
                          user.role === 'company' ? 'secondary' : 'outline'
                        }>
                          {user.role === 'job_seeker' ? '👨‍💻' : 
                           user.role === 'company' ? '🏢' : '👑'} {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>{user.created_at.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                👁️ View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}
                                    </div>
                                    <div>
                                      <strong>Role:</strong> 
                                      <Badge className="ml-2">
                                        {selectedUser.role.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    <div>
                                      <strong>Email:</strong> {selectedUser.email}
                                    </div>
                                    <div>
                                      <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Created:</strong> {selectedUser.created_at.toLocaleDateString()}
                                    </div>
                                    <div>
                                      <strong>Updated:</strong> {selectedUser.updated_at.toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {user.role !== 'administrator' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  🗑️ Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.first_name} {user.last_name}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {/* Job Filters */}
          <Card>
            <CardHeader>
              <CardTitle>💼 Job Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="active">🟢 Active Jobs</SelectItem>
                      <SelectItem value="inactive">🔴 Inactive Jobs</SelectItem>
                      <SelectItem value="internship">💼 Internships</SelectItem>
                      <SelectItem value="volunteer">🤝 Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600">
                    Showing {filteredJobs.length} of {jobPostings.length} job postings
                  </div>
                </div>
                <Button
                  onClick={handleExportJobs}
                  disabled={isExporting || filteredJobs.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📊 Export Job Postings to XLS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Job Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-blue-600">{jobStats.total}</div>
                <div className="text-sm text-gray-600">Total Jobs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-green-600">{jobStats.active}</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-purple-600">{jobStats.internships}</div>
                <div className="text-sm text-gray-600">Internships</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-orange-600">{jobStats.volunteer}</div>
                <div className="text-sm text-gray-600">Volunteer</div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job: JobPosting) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{job.title}</div>
                          <div className="text-sm text-gray-500">ID: {job.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.type === 'internship' ? 'default' : 'secondary'}>
                          {job.type === 'internship' ? '💼 Internship' : '🤝 Volunteer'}
                        </Badge>
                      </TableCell>
                      <TableCell>Company ID: {job.company_id}</TableCell>
                      <TableCell>{job.location || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={job.is_active ? 'default' : 'secondary'}>
                          {job.is_active ? '🟢 Active' : '🔴 Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.created_at.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedJob(job)}>
                                👁️ View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Job Posting Details</DialogTitle>
                              </DialogHeader>
                              {selectedJob && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <strong>Title:</strong> {selectedJob.title}
                                    </div>
                                    <div>
                                      <strong>Type:</strong> 
                                      <Badge className="ml-2">
                                        {selectedJob.type === 'internship' ? '💼 Internship' : '🤝 Volunteer'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <strong>Company ID:</strong> {selectedJob.company_id}
                                    </div>
                                    <div>
                                      <strong>Location:</strong> {selectedJob.location || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Duration:</strong> {selectedJob.duration || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Compensation:</strong> {selectedJob.compensation || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Status:</strong> 
                                      <Badge className="ml-2" variant={selectedJob.is_active ? 'default' : 'secondary'}>
                                        {selectedJob.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    <div>
                                      <strong>Deadline:</strong> {selectedJob.application_deadline?.toLocaleDateString() || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <strong>Description:</strong>
                                    <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{selectedJob.description}</p>
                                  </div>
                                  {selectedJob.requirements && (
                                    <div>
                                      <strong>Requirements:</strong>
                                      <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{selectedJob.requirements}</p>
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-500 pt-2 border-t">
                                    Created: {selectedJob.created_at.toLocaleString()} | 
                                    Updated: {selectedJob.updated_at.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                🗑️ Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the job posting "{job.title}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {/* Application Filters */}
          <Card>
            <CardHeader>
              <CardTitle>📄 Applications Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={applicationFilter} onValueChange={setApplicationFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="accepted">✅ Accepted</SelectItem>
                      <SelectItem value="rejected">❌ Rejected</SelectItem>
                      <SelectItem value="withdrawn">🔄 Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600">
                    Showing {filteredApplications.length} of {applications.length} applications
                  </div>
                </div>
                <Button
                  onClick={handleExportApplications}
                  disabled={isExporting || filteredApplications.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📊 Export All Applications to XLS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-blue-600">{applicationStats.total}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-yellow-600">{applicationStats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-green-600">{applicationStats.accepted}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-red-600">{applicationStats.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-purple-600">{applicationStats.withdrawn}</div>
                <div className="text-sm text-gray-600">Withdrawn</div>
              </CardContent>
            </Card>
          </div>

          {/* Applications Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Job Seeker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application: ApplicationWithDetails) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="font-medium">#{application.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{application.job_title}</div>
                      </TableCell>
                      <TableCell>{application.company_name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.job_seeker_name}</div>
                          <div className="text-sm text-gray-500">{application.job_seeker_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          application.status === 'accepted' ? 'default' :
                          application.status === 'rejected' ? 'destructive' :
                          application.status === 'withdrawn' ? 'secondary' : 'outline'
                        }>
                          {application.status === 'pending' && '⏳'}
                          {application.status === 'accepted' && '✅'}
                          {application.status === 'rejected' && '❌'}
                          {application.status === 'withdrawn' && '🔄'}
                          {' ' + application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{application.applied_at.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              👁️ View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Application ID:</strong> #{application.id}
                                </div>
                                <div>
                                  <strong>Status:</strong> 
                                  <Badge className="ml-2" variant={
                                    application.status === 'accepted' ? 'default' :
                                    application.status === 'rejected' ? 'destructive' : 'secondary'
                                  }>
                                    {application.status}
                                  </Badge>
                                </div>
                                <div>
                                  <strong>Job Title:</strong> {application.job_title}
                                </div>
                                <div>
                                  <strong>Company:</strong> {application.company_name}
                                </div>
                                <div>
                                  <strong>Applicant:</strong> {application.job_seeker_name}
                                </div>
                                <div>
                                  <strong>Email:</strong> {application.job_seeker_email}
                                </div>
                                <div>
                                  <strong>Applied:</strong> {application.applied_at.toLocaleDateString()}
                                </div>
                                <div>
                                  <strong>Updated:</strong> {application.updated_at.toLocaleDateString()}
                                </div>
                              </div>
                              {application.cover_letter && (
                                <div>
                                  <strong>Cover Letter:</strong>
                                  <p className="mt-1 p-2 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                                    {application.cover_letter}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}