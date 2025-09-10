import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { User, UserRole, CreateUserInput, LoginInput } from '../../../server/src/schema';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (user: User) => void;
}

export function AuthDialog({ open, onOpenChange, onLoginSuccess }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState<CreateUserInput>({
    email: '',
    password: '',
    role: 'job_seeker',
    first_name: '',
    last_name: '',
    phone: null
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await trpc.loginUser.mutate(loginData);
      onLoginSuccess(result);
      onOpenChange(false);
      // Reset form
      setLoginData({ email: '', password: '' });
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await trpc.createUser.mutate(registerData);
      onLoginSuccess(result);
      onOpenChange(false);
      // Reset form
      setRegisterData({
        email: '',
        password: '',
        role: 'job_seeker',
        first_name: '',
        last_name: '',
        phone: null
      });
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Registration failed. Email might already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Welcome to OpportunityHub</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-first-name">First Name</Label>
                  <Input
                    id="register-first-name"
                    value={registerData.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: CreateUserInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-last-name">Last Name</Label>
                  <Input
                    id="register-last-name"
                    value={registerData.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: CreateUserInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-phone">Phone (Optional)</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  value={registerData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ 
                      ...prev, 
                      phone: e.target.value || null 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={registerData.role || 'job_seeker'}
                  onValueChange={(value: UserRole) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_seeker">👨‍💻 Job Seeker</SelectItem>
                    <SelectItem value="company">🏢 Company/Employer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}