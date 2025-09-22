import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/navigation";
import { User, Calendar, Heart, Bell, LogOut, Edit, Save, X } from "lucide-react";

export default function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    pregnancyWeeks: "",
    dueDate: "",
    isPostpartum: false,
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        pregnancyWeeks: user.pregnancyWeeks?.toString() || "",
        dueDate: user.dueDate || "",
        isPostpartum: user.isPostpartum || false,
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      pregnancyWeeks?: number;
      dueDate?: string;
      isPostpartum?: boolean;
    }) => {
      const response = await apiRequest("PATCH", "/api/auth/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      isPostpartum: formData.isPostpartum,
    };

    if (formData.pregnancyWeeks) {
      updateData.pregnancyWeeks = parseInt(formData.pregnancyWeeks);
    }

    if (formData.dueDate) {
      updateData.dueDate = formData.dueDate;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        pregnancyWeeks: user.pregnancyWeeks?.toString() || "",
        dueDate: user.dueDate || "",
        isPostpartum: user.isPostpartum || false,
      });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="bg-card shadow-sm p-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center space-x-2">
          <User className="w-6 h-6 text-primary" />
          <span>Profile</span>
        </h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 space-y-6">
        {/* Profile Header */}
        <section className="mt-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground" data-testid="text-profile-name">
                {user?.firstName || user?.lastName 
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : 'MomCare User'
                }
              </h2>
              <p className="text-muted-foreground" data-testid="text-profile-email">
                {user?.email || 'No email provided'}
              </p>
              {user?.pregnancyWeeks && !user?.isPostpartum && (
                <p className="text-primary font-medium mt-2" data-testid="text-pregnancy-status">
                  {user.pregnancyWeeks} weeks pregnant
                </p>
              )}
              {user?.isPostpartum && (
                <p className="text-accent font-medium mt-2" data-testid="text-postpartum-status">
                  Postpartum journey
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Personal Information */}
        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Personal Information</CardTitle>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancel}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmit}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First name"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last name"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                      data-testid="input-email-disabled"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPostpartum"
                      checked={formData.isPostpartum}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPostpartum: checked }))}
                      data-testid="switch-postpartum"
                    />
                    <Label htmlFor="isPostpartum">I'm in postpartum period</Label>
                  </div>

                  {!formData.isPostpartum && (
                    <>
                      <div>
                        <Label htmlFor="pregnancyWeeks">Pregnancy Weeks</Label>
                        <Input
                          id="pregnancyWeeks"
                          type="number"
                          min="1"
                          max="42"
                          value={formData.pregnancyWeeks}
                          onChange={(e) => setFormData(prev => ({ ...prev, pregnancyWeeks: e.target.value }))}
                          placeholder="e.g., 32"
                          data-testid="input-pregnancy-weeks"
                        />
                      </div>

                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          data-testid="input-due-date"
                        />
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">First Name</p>
                      <p className="font-medium" data-testid="text-display-first-name">
                        {user?.firstName || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Name</p>
                      <p className="font-medium" data-testid="text-display-last-name">
                        {user?.lastName || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium" data-testid="text-display-email">
                      {user?.email || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium" data-testid="text-display-status">
                      {user?.isPostpartum 
                        ? 'Postpartum' 
                        : user?.pregnancyWeeks 
                        ? `${user.pregnancyWeeks} weeks pregnant`
                        : 'Pregnancy status not set'
                      }
                    </p>
                  </div>

                  {user?.dueDate && !user?.isPostpartum && (
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium" data-testid="text-display-due-date">
                        {new Date(user.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Preferences */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Appointment and vaccine reminders</p>
                  </div>
                </div>
                <Switch defaultChecked data-testid="switch-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Health Reminders</p>
                    <p className="text-sm text-muted-foreground">Daily health check-ins</p>
                  </div>
                </div>
                <Switch defaultChecked data-testid="switch-health-reminders" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Calendar Sync</p>
                    <p className="text-sm text-muted-foreground">Sync appointments to device calendar</p>
                  </div>
                </div>
                <Switch data-testid="switch-calendar-sync" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Account Actions */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                data-testid="button-privacy-settings"
              >
                <User className="w-4 h-4 mr-2" />
                Privacy Settings
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start"
                data-testid="button-data-export"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Export My Data
              </Button>

              <Separator />

              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* App Info */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <h3 className="font-medium text-foreground mb-2">MomCare</h3>
              <p className="text-sm text-muted-foreground mb-1">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground">
                Your trusted maternal health companion
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}
