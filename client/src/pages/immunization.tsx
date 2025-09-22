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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/navigation";
import { Syringe, Calendar, MapPin, Plus, CheckCircle, Clock, AlertCircle, Trash2 } from "lucide-react";
import type { Immunization } from "@shared/schema";

const commonVaccines = [
  { name: "Hepatitis B", ageInDays: 0, description: "Birth dose" },
  { name: "DTaP", ageInDays: 60, description: "2 months - Diphtheria, Tetanus, Pertussis" },
  { name: "Hib", ageInDays: 60, description: "2 months - Haemophilus influenzae type b" },
  { name: "IPV", ageInDays: 60, description: "2 months - Inactivated Poliovirus" },
  { name: "PCV13", ageInDays: 60, description: "2 months - Pneumococcal conjugate" },
  { name: "RV", ageInDays: 60, description: "2 months - Rotavirus" },
  { name: "DTaP", ageInDays: 120, description: "4 months" },
  { name: "Hib", ageInDays: 120, description: "4 months" },
  { name: "IPV", ageInDays: 120, description: "4 months" },
  { name: "PCV13", ageInDays: 120, description: "4 months" },
  { name: "RV", ageInDays: 120, description: "4 months" },
];

export default function ImmunizationPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<{ name: string; description: string } | null>(null);

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

  // Fetch immunizations
  const { data: immunizations, isLoading } = useQuery({
    queryKey: ["/api/immunizations"],
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

  // Create immunization mutation
  const createImmunizationMutation = useMutation({
    mutationFn: async (data: {
      childName: string;
      childBirthDate: string;
      vaccineName: string;
      scheduledDate: string;
      location: string;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/immunizations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/immunizations"] });
      setIsDialogOpen(false);
      setSelectedVaccine(null);
      toast({
        title: "Success",
        description: "Immunization scheduled successfully!",
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
        description: "Failed to schedule immunization. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update immunization mutation
  const updateImmunizationMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Immunization>) => {
      const response = await apiRequest("PATCH", `/api/immunizations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/immunizations"] });
      toast({
        title: "Success",
        description: "Immunization updated successfully!",
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
        description: "Failed to update immunization. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete immunization mutation
  const deleteImmunizationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/immunizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/immunizations"] });
      toast({
        title: "Success",
        description: "Immunization removed successfully!",
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
        description: "Failed to remove immunization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const immunizationData = {
      childName: formData.get("childName") as string,
      childBirthDate: formData.get("childBirthDate") as string,
      vaccineName: selectedVaccine ? selectedVaccine.name : (formData.get("vaccineName") as string),
      scheduledDate: formData.get("scheduledDate") as string,
      location: formData.get("location") as string,
      notes: formData.get("notes") as string,
    };

    createImmunizationMutation.mutate(immunizationData);
  };

  const handleQuickSchedule = (vaccine: { name: string; description: string }) => {
    setSelectedVaccine(vaccine);
    setIsDialogOpen(true);
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

  const upcomingImmunizations = immunizations?.filter(imm => imm.status === 'pending') || [];
  const completedImmunizations = immunizations?.filter(imm => imm.status === 'completed') || [];
  const overdueImmunizations = immunizations?.filter(imm => {
    return imm.status === 'pending' && new Date(imm.scheduledDate) < new Date();
  }) || [];

  const getStatusIcon = (status: string, scheduledDate: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-accent" />;
    if (status === 'overdue' || (status === 'pending' && new Date(scheduledDate) < new Date())) 
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, scheduledDate: string) => {
    if (status === 'completed') return <Badge variant="default">Completed</Badge>;
    if (status === 'overdue' || (status === 'pending' && new Date(scheduledDate) < new Date())) 
      return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="secondary">Scheduled</Badge>;
  };

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="bg-card shadow-sm p-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center space-x-2">
          <Syringe className="w-6 h-6 text-primary" />
          <span>Immunizations</span>
        </h1>
        <p className="text-sm text-muted-foreground">Track your child's vaccines</p>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 space-y-6">
        {/* Quick Stats */}
        <section className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-primary" data-testid="text-upcoming-count">
                  {upcomingImmunizations.length}
                </h3>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-destructive" data-testid="text-overdue-count">
                  {overdueImmunizations.length}
                </h3>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-accent" data-testid="text-completed-count">
                  {completedImmunizations.length}
                </h3>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Schedule Button */}
        <section>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" data-testid="button-schedule-immunization">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Immunization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Child Immunization</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="childName">Child's Name</Label>
                  <Input 
                    id="childName" 
                    name="childName" 
                    required 
                    placeholder="Baby's name"
                    data-testid="input-child-name"
                  />
                </div>

                <div>
                  <Label htmlFor="childBirthDate">Child's Birth Date</Label>
                  <Input 
                    id="childBirthDate" 
                    name="childBirthDate" 
                    type="date"
                    data-testid="input-birth-date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vaccineName">Vaccine Name</Label>
                  <Input 
                    id="vaccineName" 
                    name="vaccineName" 
                    required 
                    value={selectedVaccine?.name || ''}
                    onChange={(e) => setSelectedVaccine(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value, description: ''})}
                    placeholder="e.g., Hepatitis B, DTaP, etc."
                    data-testid="input-vaccine-name"
                  />
                  {selectedVaccine?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedVaccine.description}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input 
                    id="scheduledDate" 
                    name="scheduledDate" 
                    type="date" 
                    required
                    data-testid="input-scheduled-date"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    required 
                    placeholder="Clinic/Hospital name and address"
                    data-testid="input-location"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Any additional notes..."
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedVaccine(null);
                    }}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createImmunizationMutation.isPending}
                    data-testid="button-schedule"
                  >
                    {createImmunizationMutation.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {/* Common Vaccines Quick Schedule */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Common Vaccines</h2>
          <div className="space-y-2">
            {commonVaccines.slice(0, 6).map((vaccine, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between p-4 h-auto"
                onClick={() => handleQuickSchedule(vaccine)}
                data-testid={`button-quick-schedule-${index}`}
              >
                <div className="text-left">
                  <p className="font-medium">{vaccine.name}</p>
                  <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                </div>
                <Plus className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </section>

        {/* Overdue Immunizations */}
        {overdueImmunizations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 text-destructive">
              Overdue Immunizations
            </h2>
            <div className="space-y-3">
              {overdueImmunizations.map((immunization, index) => (
                <Card key={immunization.id} className="border-l-4 border-l-destructive" data-testid={`card-overdue-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <h3 className="font-medium text-foreground" data-testid={`text-overdue-vaccine-${index}`}>
                            {immunization.vaccineName}
                          </h3>
                          <Badge variant="destructive">Overdue</Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p data-testid={`text-overdue-child-${index}`}>Child: {immunization.childName}</p>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-overdue-date-${index}`}>
                              Due: {new Date(immunization.scheduledDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateImmunizationMutation.mutate({
                            id: immunization.id,
                            status: 'completed',
                            completedDate: new Date().toISOString().split('T')[0]
                          });
                        }}
                        data-testid={`button-mark-completed-overdue-${index}`}
                      >
                        Mark Done
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Immunizations */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Immunizations</h2>
          
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
          ) : upcomingImmunizations.length > 0 ? (
            <div className="space-y-3">
              {upcomingImmunizations.map((immunization, index) => (
                <Card key={immunization.id} data-testid={`card-upcoming-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(immunization.status, immunization.scheduledDate)}
                          <h3 className="font-medium text-foreground" data-testid={`text-upcoming-vaccine-${index}`}>
                            {immunization.vaccineName}
                          </h3>
                          {getStatusBadge(immunization.status, immunization.scheduledDate)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p data-testid={`text-upcoming-child-${index}`}>Child: {immunization.childName}</p>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-upcoming-date-${index}`}>
                              {new Date(immunization.scheduledDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span data-testid={`text-upcoming-location-${index}`}>{immunization.location}</span>
                          </div>
                        </div>

                        {immunization.notes && (
                          <p className="text-sm text-foreground mt-2" data-testid={`text-upcoming-notes-${index}`}>
                            {immunization.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateImmunizationMutation.mutate({
                              id: immunization.id,
                              status: 'completed',
                              completedDate: new Date().toISOString().split('T')[0]
                            });
                          }}
                          data-testid={`button-mark-completed-${index}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this immunization?")) {
                              deleteImmunizationMutation.mutate(immunization.id);
                            }
                          }}
                          data-testid={`button-delete-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2" data-testid="text-no-upcoming">
                  No upcoming immunizations scheduled
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-schedule-first"
                >
                  Schedule your child's first vaccine
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Completed Immunizations */}
        {completedImmunizations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Completed Immunizations</h2>
            <div className="space-y-3">
              {completedImmunizations.slice(0, 5).map((immunization, index) => (
                <Card key={immunization.id} className="opacity-75" data-testid={`card-completed-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <h3 className="font-medium text-foreground" data-testid={`text-completed-vaccine-${index}`}>
                            {immunization.vaccineName}
                          </h3>
                          <Badge variant="default">Completed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-completed-child-${index}`}>
                          {immunization.childName}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p data-testid={`text-completed-date-${index}`}>
                          {immunization.completedDate 
                            ? new Date(immunization.completedDate).toLocaleDateString() 
                            : 'Date unknown'
                          }
                        </p>
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
