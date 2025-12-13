import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Pencil, Trash2, Key, Search, Shield, Users, Loader2, AlertCircle, UserCog, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Supabase Client Setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cgvdwgdqawkvjehuqlao.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndmR3Z2RxYXdrdmplaHVxbGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDA2NDMsImV4cCI6MjA4MTExNjY0M30.Usu3U5pM_RBCS9-xaQ9cxsPpnPP9Zhu2A0dwc7SE5Vw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Department options
const DEPARTMENTS = [
  'Security Operations Center (SOC)',
  'IT Security',
  'Information Technology',
  'Network Operations',
  'Cybersecurity',
  'Digital Forensics',
  'Incident Response',
  'Compliance & Audit',
  'Risk Management',
  'Other'
];

// Types
type UserRole = 'admin' | 'manager' | 'investigator' | 'first_responder' | 'reporter';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const roleColors: Record<UserRole, string> = {
  reporter: 'bg-blue-500/20 text-blue-400',
  first_responder: 'bg-purple-500/20 text-purple-400',
  investigator: 'bg-yellow-500/20 text-yellow-400',
  manager: 'bg-green-500/20 text-green-400',
  admin: 'bg-red-500/20 text-red-400',
};

const roleLabels: Record<UserRole, string> = {
  reporter: 'Reporter',
  first_responder: 'First Responder',
  investigator: 'Investigator',
  manager: 'Manager',
  admin: 'Admin',
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'reporter' as UserRole,
    department: '',
    phone: '',
  });

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profilesData.map(profile => {
        const userRole = rolesData.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'reporter'
        };
      });

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add new user
  const handleAddUser = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      toast.error('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      toast.error('Email is required');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log('Creating user with email:', formData.email);

      // PENTING: Simpan session admin saat ini
      const { data: { session: currentAdminSession } } = await supabase.auth.getSession();

      // Create user via Supabase Auth
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            department: formData.department || null,
            phone: formData.phone || null,
            role: formData.role
          },
          emailRedirectTo: undefined,
        }
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        throw signupError;
      }

      console.log('User created:', signupData);

      // PENTING: Restore session admin
      if (currentAdminSession) {
        await supabase.auth.setSession({
          access_token: currentAdminSession.access_token,
          refresh_token: currentAdminSession.refresh_token
        });
      }

      if (signupData.user) {
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role })
          .eq('user_id', signupData.user.id);

        if (roleError) {
          console.error('Role update error:', roleError);
        }

        // Update profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            department: formData.department || null,
            phone: formData.phone || null
          })
          .eq('user_id', signupData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'reporter',
        department: '',
        phone: ''
      });
      
      setIsAddDialogOpen(false);
      
      toast.success('User created successfully!', {
        description: `User ${formData.full_name} has been added to the system.`
      });
      
      await fetchUsers();
      setError(null);
    } catch (err: any) {
      console.error('Error adding user:', err);
      
      let errorMessage = 'Failed to add user';
      
      if (err.message.includes('User already registered')) {
        errorMessage = 'This email is already registered';
      } else if (err.message.includes('invalid')) {
        errorMessage = 'Invalid email format';
      } else if (err.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user
  const handleEditUser = async () => {
    if (!editingUser || !formData.full_name) {
      setError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Update profile (tanpa email karena email tidak bisa diubah dari admin panel)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          department: formData.department || null,
          phone: formData.phone || null
        })
        .eq('user_id', editingUser.user_id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role })
        .eq('user_id', editingUser.user_id);

      if (roleError) throw roleError;

      setIsEditDialogOpen(false);
      setEditingUser(null);
      
      toast.success('User updated successfully');
      
      await fetchUsers();
      setError(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      setError(null);
      const { error: deactivateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) throw deactivateError;
      
      toast.success('User deactivated successfully');
      await fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // Reset password
  const handleResetPassword = async (user: UserWithRole) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast.success('Password reset link sent', {
        description: `Email sent to ${user.email}`
      });
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Failed to send reset link');
      toast.error(err.message || 'Failed to send reset link');
    }
  };

  // Open edit dialog
  const openEditDialog = (user: UserWithRole) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  // Calculate stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    investigators: users.filter(u => u.role === 'investigator').length,
    responders: users.filter(u => u.role === 'first_responder').length,
    reporters: users.filter(u => u.role === 'reporter').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Use a valid email address (e.g., user@gmail.com)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reporter">Reporter</SelectItem>
                    <SelectItem value="first_responder">First Responder</SelectItem>
                    <SelectItem value="investigator">Investigator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +62812345678"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.admins}</div>
            <p className="text-xs text-muted-foreground mt-1">System admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <UserCog className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.managers}</div>
            <p className="text-xs text-muted-foreground mt-1">Team managers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Investigators</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.investigators}</div>
            <p className="text-xs text-muted-foreground mt-1">Investigators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Responders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.responders}</div>
            <p className="text-xs text-muted-foreground mt-1">First responders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reporters</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.reporters}</div>
            <p className="text-xs text-muted-foreground mt-1">Basic users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="reporter">Reporter</SelectItem>
                <SelectItem value="first_responder">First Responder</SelectItem>
                <SelectItem value="investigator">Investigator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-sm">
                            {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResetPassword(user)}
                            className="h-8 w-8"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For security reasons, email cannot be changed by admin. User can update their own email from account settings.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="edit-full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email-display">Email (Read-only)</Label>
              <Input
                id="edit-email-display"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reporter">Reporter</SelectItem>
                  <SelectItem value="first_responder">First Responder</SelectItem>
                  <SelectItem value="investigator">Investigator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., +62812345678"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}