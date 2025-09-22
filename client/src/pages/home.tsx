import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { useLocation } from "wouter";
import { Calendar, Heart, Syringe, Users, Plus, Bell, Settings, User } from "lucide-react";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user appointments
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated,
  });

  // Fetch latest risk assessment
  const { data: riskAssessment } = useQuery({
    queryKey: ["/api/risk-assessments/latest"],
    enabled: isAuthenticated,
  });

  // Fetch community posts preview
  const { data: communityPosts } = useQuery({
    queryKey: ["/api/community/posts?limit=2"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const upcomingAppointments = (appointments as any)?.slice(0, 2) || [];
  const nextAppointment = upcomingAppointments[0];
  const daysUntilNext = nextAppointment 
    ? Math.ceil((new Date(nextAppointment.appointmentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="bg-card shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-username">
              {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : 'Welcome'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(user as any)?.pregnancyWeeks ? `${(user as any).pregnancyWeeks} weeks pregnant` : 'MomCare User'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {upcomingAppointments.length}
            </span>
          </button>
          <button 
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate("/profile")}
            data-testid="button-settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 space-y-6">
        {/* Welcome Section */}
        <section className="mt-6">
          <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-lg text-white">
            <h2 className="text-xl font-semibold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}! 👶
            </h2>
            <p className="text-primary-foreground/90 mb-4">
              {nextAppointment 
                ? `Your next ANC visit is in ${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}`
                : 'No upcoming appointments scheduled'
              }
            </p>
            <div className="flex space-x-4">
              <div className="bg-white/20 rounded-lg p-3 flex-1">
                <p className="text-sm font-medium">Risk Level</p>
                <p className="text-lg font-bold" data-testid="text-risk-level">
                  {riskAssessment?.riskLevel ? 
                    riskAssessment.riskLevel.charAt(0).toUpperCase() + riskAssessment.riskLevel.slice(1) 
                    : 'Unknown'}
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 flex-1">
                <p className="text-sm font-medium">Next Checkup</p>
                <p className="text-lg font-bold" data-testid="text-next-checkup">
                  {nextAppointment 
                    ? new Date(nextAppointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'None'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate("/schedule")}
              data-testid="button-schedule-anc"
            >
              <Calendar className="w-8 h-8 text-primary" />
              <div className="text-center">
                <h4 className="font-medium text-foreground">Schedule ANC</h4>
                <p className="text-sm text-muted-foreground">Book appointment</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate("/risk-assessment")}
              data-testid="button-risk-check"
            >
              <Heart className="w-8 h-8 text-accent" />
              <div className="text-center">
                <h4 className="font-medium text-foreground">Risk Check</h4>
                <p className="text-sm text-muted-foreground">AI assessment</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate("/immunization")}
              data-testid="button-baby-vaccines"
            >
              <Syringe className="w-8 h-8 text-primary" />
              <div className="text-center">
                <h4 className="font-medium text-foreground">Baby Vaccines</h4>
                <p className="text-sm text-muted-foreground">Schedule shots</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate("/community")}
              data-testid="button-community"
            >
              <Users className="w-8 h-8 text-secondary" />
              <div className="text-center">
                <h4 className="font-medium text-foreground">Community</h4>
                <p className="text-sm text-muted-foreground">Connect & share</p>
              </div>
            </Button>
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => navigate("/schedule")}
              data-testid="button-view-all-appointments"
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment, index) => (
                <Card key={appointment.id} className="border border-border" data-testid={`card-appointment-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground" data-testid={`text-appointment-title-${index}`}>
                            {appointment.appointmentType === 'routine' ? 'ANC Checkup' : appointment.appointmentType}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-appointment-doctor-${index}`}>
                            {appointment.doctorName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground" data-testid={`text-appointment-date-${index}`}>
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-appointment-time-${index}`}>
                          {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border border-border">
                <CardContent className="p-4 text-center text-muted-foreground">
                  <p data-testid="text-no-appointments">No upcoming appointments</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => navigate("/schedule")}
                    data-testid="button-schedule-first"
                  >
                    Schedule your first appointment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Health Insights */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Health Insights</h3>
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-foreground">Risk Assessment</h4>
                <Badge 
                  variant={riskAssessment?.riskLevel === 'high' ? 'destructive' : riskAssessment?.riskLevel === 'medium' ? 'secondary' : 'default'}
                  data-testid="badge-risk-level"
                >
                  {riskAssessment?.riskLevel ? 
                    riskAssessment.riskLevel.charAt(0).toUpperCase() + riskAssessment.riskLevel.slice(1) + ' Risk'
                    : 'No Assessment'
                  }
                </Badge>
              </div>
              
              {riskAssessment ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Blood Pressure</span>
                      <span className="text-foreground font-medium" data-testid="text-blood-pressure">
                        {riskAssessment.bloodPressure || 'Not recorded'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Weight</span>
                      <span className="text-foreground font-medium" data-testid="text-weight">
                        {riskAssessment.weight ? `${riskAssessment.weight} kg` : 'Not recorded'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Baby Movement</span>
                      <span className="text-foreground font-medium" data-testid="text-baby-movement">
                        {riskAssessment.babyMovement || 'Not recorded'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center" data-testid="text-no-assessment">
                  No recent assessment available
                </p>
              )}
              
              <Button 
                className="w-full mt-4"
                onClick={() => navigate("/risk-assessment")}
                data-testid="button-update-assessment"
              >
                {riskAssessment ? 'Update Assessment' : 'Take Assessment'}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Community Preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Community</h3>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => navigate("/community")}
              data-testid="button-join-discussion"
            >
              Join Discussion
            </Button>
          </div>
          
          <div className="space-y-3">
            {communityPosts && communityPosts.length > 0 ? (
              communityPosts.slice(0, 2).map((post, index) => (
                <Card key={post.id} className="border border-border" data-testid={`card-community-post-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground" data-testid={`text-post-author-${index}`}>
                            {post.user.firstName || 'Anonymous'}
                          </span>
                          <span className="text-muted-foreground text-sm" data-testid={`text-post-time-${index}`}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground text-sm mb-2" data-testid={`text-post-content-${index}`}>
                          {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                        </p>
                        <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                          <span className="flex items-center space-x-1" data-testid={`text-post-likes-${index}`}>
                            <Heart className="w-4 h-4" />
                            <span>{post.likes || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1" data-testid={`text-post-comments-${index}`}>
                            <Users className="w-4 h-4" />
                            <span>{post.commentCount || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border border-border">
                <CardContent className="p-4 text-center text-muted-foreground">
                  <p data-testid="text-no-posts">No recent community posts</p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => navigate("/community")}
                    data-testid="button-join-community"
                  >
                    Join the community
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-24 right-6 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all floating-action"
        onClick={() => navigate("/schedule")}
        data-testid="button-floating-action"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}
