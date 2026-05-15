import { useEffect, useState } from 'react';
import { getSystemStats, getAllPolls, adminClosePoll, adminDeletePoll, getAllUsers, updateUserRole, adminDeleteUser, getSystemSettings, updateSystemSettings } from '@/api/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Users, BarChart2, Activity, PlayCircle, CheckCircle2, MoreHorizontal, Eye, XCircle, Trash2, Shield, ShieldOff, RefreshCw, Settings, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [polls, setPolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state for polls and users tabs (Issue #9)
  const [pollsPagination, setPollsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pollsPage, setPollsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    allowRegistrations: true,
    maintenanceMode: false,
    announcementMessage: ''
  });

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await getSystemStats();
      setStats(res.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load system statistics. Make sure you have admin privileges.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPolls = async (page = pollsPage) => {
    try {
      setLoadingPolls(true);
      const res = await getAllPolls({ page, limit: 20 });
      setPolls(res.data.data.polls);
      setPollsPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load polls');
    } finally {
      setLoadingPolls(false);
    }
  };

  const fetchUsers = async (page = usersPage) => {
    try {
      setLoadingUsers(true);
      const res = await getAllUsers({ page, limit: 20 });
      setUsers(res.data.data.users);
      setUsersPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await getSystemSettings();
      setSettings(res.data.data);
      setSettingsForm({
        allowRegistrations: res.data.data.allowRegistrations ?? true,
        maintenanceMode: res.data.data.maintenanceMode ?? false,
        announcementMessage: res.data.data.announcementMessage ?? ''
      });
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await adminClosePoll(pollId);
      toast.success('Poll forced closed');
      fetchPolls();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close poll');
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll? This cannot be undone.')) return;
    try {
      await adminDeletePoll(pollId);
      toast.success('Poll deleted');
      fetchPolls();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete poll');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and ALL their polls/responses? This cannot be undone.')) return;
    try {
      await adminDeleteUser(userId);
      toast.success('User and associated data deleted');
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSystemSettings(settingsForm);
      toast.success('Platform settings updated successfully');
      fetchSettings(); // Refresh from server
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loadingStats && !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive border border-destructive/20">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl pt-24 pb-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Platform-wide statistics and moderation.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchStats(); fetchPolls(); fetchUsers(); if(settings) fetchSettings(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={(val) => {
        if (val === 'polls' && polls.length === 0) fetchPolls();
        if (val === 'users' && users.length === 0) fetchUsers();
        if (val === 'settings' && !settings) fetchSettings();
      }}>
        <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-4 rounded-full">
          <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
          <TabsTrigger value="polls" className="rounded-full">Polls</TabsTrigger>
          <TabsTrigger value="users" className="rounded-full">Users</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-full flex items-center gap-2">
            <Settings className="h-4 w-4 hidden sm:block" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalResponses || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Answers submitted platform-wide</p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors border-border/50 lg:col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Polls Created</CardTitle>
                <BarChart2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalPolls || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all users</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Poll Status Breakdown</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
                <PlayCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.activePolls || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently accepting responses</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Closed Polls</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.closedPolls || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Manually closed or expired</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Drafts (Unpublished)</CardTitle>
                <div className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {(stats?.totalPolls || 0) - (stats?.publishedPolls || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Waiting to be published</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="polls">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>System Polls</CardTitle>
              <CardDescription>Manage and moderate all polls created on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPolls ? (
                 <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
              ) : polls.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No polls found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responses</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {polls.map((poll) => (
                        <TableRow key={poll._id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{poll.title}</TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-[150px]">
                            {poll.creator?.email || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={poll.status === 'active' ? 'default' : poll.status === 'published' ? 'secondary' : 'outline'} className="rounded-full">
                              {poll.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{poll.responseCount}</TableCell>
                          <TableCell>{format(new Date(poll.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => window.open(`/respond/${poll.shareId}`, '_blank')}>
                                    <Eye className="mr-2 h-4 w-4" /> View Public Page
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {poll.status === 'active' && (
                                    <DropdownMenuItem onClick={() => handleClosePoll(poll._id)}>
                                      <XCircle className="mr-2 h-4 w-4" /> Force Close
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleDeletePoll(poll._id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Poll
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Polls Pagination */}
              {pollsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">Showing {polls.length} of {pollsPagination.total} polls</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pollsPage <= 1} onClick={() => { const p = pollsPage - 1; setPollsPage(p); fetchPolls(p); }}>Previous</Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">{pollsPage} / {pollsPagination.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={pollsPage >= pollsPagination.totalPages} onClick={() => { const p = pollsPage + 1; setPollsPage(p); fetchPolls(p); }}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
           <Card className="border-border/50">
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage platform accounts and roles.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                 <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
              ) : users.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="rounded-full">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  {user.role === 'user' ? (
                                    <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'admin')}>
                                      <Shield className="mr-2 h-4 w-4" /> Promote to Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'user')}>
                                      <ShieldOff className="mr-2 h-4 w-4" /> Demote to User
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteUser(user._id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {/* Users Pagination */}
              {usersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">Showing {users.length} of {usersPagination.total} users</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={usersPage <= 1} onClick={() => { const p = usersPage - 1; setUsersPage(p); fetchUsers(p); }}>Previous</Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">{usersPage} / {usersPagination.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={usersPage >= usersPagination.totalPages} onClick={() => { const p = usersPage + 1; setUsersPage(p); fetchUsers(p); }}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Manage global behavior of the PollVault application.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSettings ? (
                <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
              ) : (
                <div className="space-y-8">
                  {/* Toggles */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-6 bg-card">
                      <div className="space-y-1">
                        <h3 className="font-medium leading-none">Allow Registrations</h3>
                        <p className="text-sm text-muted-foreground">
                          Allow new users to sign up. Turn off to restrict access.
                        </p>
                      </div>
                      <Switch 
                        checked={settingsForm.allowRegistrations}
                        onCheckedChange={(val) => setSettingsForm(prev => ({ ...prev, allowRegistrations: val }))}
                      />
                    </div>

                    <div className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-6 bg-card">
                      <div className="space-y-1">
                        <h3 className="font-medium leading-none text-destructive">Maintenance Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          (Future functionality) Put the app into read-only mode.
                        </p>
                      </div>
                      <Switch 
                        checked={settingsForm.maintenanceMode}
                        onCheckedChange={(val) => setSettingsForm(prev => ({ ...prev, maintenanceMode: val }))}
                      />
                    </div>
                  </div>

                  {/* Banner Setting */}
                  <div className="rounded-xl border border-border/50 p-6 bg-card space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-medium leading-none">Global Announcement Banner</h3>
                      <p className="text-sm text-muted-foreground">
                        Message displayed at the top of every page. Leave blank to hide.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input 
                        placeholder="e.g. Scheduled maintenance tonight at 10 PM UTC" 
                        value={settingsForm.announcementMessage}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, announcementMessage: e.target.value }))}
                        className="max-w-xl rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/20">
                    <Button onClick={handleSaveSettings} className="w-full rounded-full">
                      <Save className="mr-2 h-4 w-4" /> Save Settings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
