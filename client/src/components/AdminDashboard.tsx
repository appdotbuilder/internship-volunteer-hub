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

interface AdminDashboardProps {
  user: User;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdminDashboard(_: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');

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

  useEffect(() => {
    loadUsers();
    loadJobPostings();
  }, [loadUsers, loadJobPostings]);

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

  const userStats = getUserStats();
  const jobStats = getJobStats();

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="jobs">Job Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle>👥 User Management</CardTitle>
            </CardHeader>
            <CardContent>
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
      </Tabs>
    </div>
  );
}