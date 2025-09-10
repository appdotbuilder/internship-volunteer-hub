import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import type { User, UserRole } from '../../server/src/schema';
import { JobSeekerDashboard } from '@/components/JobSeekerDashboard';
import { CompanyDashboard } from '@/components/CompanyDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AuthDialog } from '@/components/AuthDialog';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Demo login function for testing different roles
  const handleDemoLogin = (role: UserRole) => {
    const demoUsers: Record<UserRole, User> = {
      job_seeker: {
        id: 1,
        email: 'jobseeker@demo.com',
        password_hash: '',
        role: 'job_seeker',
        first_name: 'Alex',
        last_name: 'Johnson',
        phone: '+1-555-0123',
        created_at: new Date(),
        updated_at: new Date()
      },
      company: {
        id: 2,
        email: 'company@demo.com',
        password_hash: '',
        role: 'company',
        first_name: 'Sarah',
        last_name: 'Williams',
        phone: '+1-555-0124',
        created_at: new Date(),
        updated_at: new Date()
      },
      administrator: {
        id: 3,
        email: 'admin@demo.com',
        password_hash: '',
        role: 'administrator',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1-555-0125',
        created_at: new Date(),
        updated_at: new Date()
      }
    };
    setCurrentUser(demoUsers[role]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Show login screen if no user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              🌟 OpportunityHub
            </CardTitle>
            <p className="text-gray-600">Find Your Next Adventure</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center mb-6">
              Connect talent with opportunities. Whether you're seeking internships, volunteering, 
              or looking to hire - we've got you covered.
            </p>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Demo Login</h3>
              <Button
                onClick={() => handleDemoLogin('job_seeker')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                👨‍💻 Job Seeker Demo
              </Button>
              <Button
                onClick={() => handleDemoLogin('company')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🏢 Company Demo
              </Button>
              <Button
                onClick={() => handleDemoLogin('administrator')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                👑 Administrator Demo
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => setShowAuth(true)}
                variant="outline"
                className="w-full"
              >
                Login with Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <AuthDialog
          open={showAuth}
          onOpenChange={setShowAuth}
          onLoginSuccess={setCurrentUser}
        />
      </div>
    );
  }

  // Main application with role-based dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-800">🌟 OpportunityHub</h1>
              <Badge variant="secondary" className="capitalize">
                {currentUser.role.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.first_name} {currentUser.last_name}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'job_seeker' && (
          <JobSeekerDashboard user={currentUser} />
        )}
        {currentUser.role === 'company' && (
          <CompanyDashboard user={currentUser} />
        )}
        {currentUser.role === 'administrator' && (
          <AdminDashboard user={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;