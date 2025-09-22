import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/navigation";
import { Calendar, Clock, MapPin, User, Plus, Trash2 } from "lucide-react";
import type { AncAppointment } from "@shared/schema";

export default function Schedule() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: {
      doctorName: string;
      appointmentDate: string;
      appointmentType: string;
      location: string;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Appointment scheduled successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<AncAppointment>) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment updated successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment cancelled successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const appointmentData = {
      doctorName: formData.get("doctorName") as string,
      appointmentDate: formData.get("appointmentDate") as string,
      appointmentType: formData.get("appointmentType") as string,
      location: formData.get("location") as string,
      notes: formData.get("notes") as string,
    };

    createAppointmentMutation.mutate(appointmentData);
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

  const upcomingAppointments = appointments?.filter(apt => new Date(apt.appointmentDate) >= new Date()) || [];
  const pastAppointments = appointments?.filter(apt => new Date(apt.appointmentDate) < new Date()) || [];

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="bg-card shadow-sm p-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-primary" />
          <span>Schedule</span>
        </h1>
        <p className="text-sm text-muted-foreground">Manage your ANC visits</p>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 space-y-6">
        {/* Quick Stats */}
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-primary" data-testid="text-upcoming-count">
                  {upcomingAppointments.length}
                </h3>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-accent" data-testid="text-completed-count">
                  {pastAppointments.length}
                </h3>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Schedule New Appointment Button */}
        <section>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" data-testid="button-schedule-appointment">
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule ANC Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input 
                    id="doctorName" 
                    name="doctorName" 
                    required 
                    placeholder="Dr. Jane Smith"
                    data-testid="input-doctor-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="appointmentDate">Appointment Date & Time</Label>
                  <Input 
                    id="appointmentDate" 
                    name="appointmentDate" 
                    type="datetime-local" 
                    required
                    data-testid="input-appointment-date"
                  />
                </div>

                <div>
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                  <Select name="appointmentType" required>
                    <SelectTrigger data-testid="select-appointment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine Checkup</SelectItem>
                      <SelectItem value="urgent">Urgent Visit</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    required 
                    placeholder="Hospital/Clinic name and address"
                    data-testid="input-location"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Any additional notes or preparations needed..."
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createAppointmentMutation.isPending}
                    data-testid="button-schedule"
                  >
                    {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {/* Upcoming Appointments */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Appointments</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <Card key={appointment.id} data-testid={`card-upcoming-appointment-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-foreground" data-testid={`text-appointment-type-${index}`}>
                            {appointment.appointmentType === 'routine' ? 'Routine Checkup' : 
                             appointment.appointmentType.charAt(0).toUpperCase() + appointment.appointmentType.slice(1)}
                          </h3>
                          <Badge 
                            variant={appointment.status === 'scheduled' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${index}`}
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span data-testid={`text-doctor-name-${index}`}>{appointment.doctorName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-date-${index}`}>
                              {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span data-testid={`text-time-${index}`}>
                              {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span data-testid={`text-location-${index}`}>{appointment.location}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-foreground mt-2" data-testid={`text-notes-${index}`}>
                            {appointment.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this appointment?")) {
                            deleteAppointmentMutation.mutate(appointment.id);
                          }
                        }}
                        disabled={deleteAppointmentMutation.isPending}
                        data-testid={`button-cancel-appointment-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          updateAppointmentMutation.mutate({
                            id: appointment.id,
                            status: 'completed'
                          });
                        }}
                        disabled={updateAppointmentMutation.isPending}
                        data-testid={`button-mark-completed-${index}`}
                      >
                        Mark Completed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2" data-testid="text-no-upcoming">
                  No upcoming appointments scheduled
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-schedule-first-appointment"
                >
                  Schedule your first appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Past Appointments</h2>
            <div className="space-y-3">
              {pastAppointments.slice(0, 5).map((appointment, index) => (
                <Card key={appointment.id} className="opacity-75" data-testid={`card-past-appointment-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground" data-testid={`text-past-appointment-type-${index}`}>
                          {appointment.appointmentType === 'routine' ? 'Routine Checkup' : 
                           appointment.appointmentType.charAt(0).toUpperCase() + appointment.appointmentType.slice(1)}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-past-doctor-${index}`}>
                          {appointment.doctorName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground" data-testid={`text-past-date-${index}`}>
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <Badge variant="secondary" data-testid={`badge-past-status-${index}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}
