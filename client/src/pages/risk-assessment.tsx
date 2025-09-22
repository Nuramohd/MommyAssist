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
import Navigation from "@/components/navigation";
import { Heart, TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import type { RiskAssessment } from "@shared/schema";

export default function RiskAssessmentPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isFormVisible, setIsFormVisible] = useState(false);

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

  // Fetch risk assessments
  const { data: assessments, isLoading } = useQuery({
    queryKey: ["/api/risk-assessments"],
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

  // Create risk assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: {
      bloodPressure?: string;
      weight?: number;
      babyMovement?: string;
      symptoms?: string;
    }) => {
      const response = await apiRequest("POST", "/api/risk-assessments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/risk-assessments/latest"] });
      setIsFormVisible(false);
      toast({
        title: "Assessment Complete",
        description: "Your risk assessment has been updated successfully!",
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
        description: "Failed to complete assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const assessmentData = {
      bloodPressure: formData.get("bloodPressure") as string,
      weight: formData.get("weight") ? parseInt(formData.get("weight") as string) : undefined,
      babyMovement: formData.get("babyMovement") as string,
      symptoms: formData.get("symptoms") as string,
    };

    createAssessmentMutation.mutate(assessmentData);
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

  const latestAssessment = assessments?.[0];

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <TrendingUp className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="bg-card shadow-sm p-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center space-x-2">
          <Heart className="w-6 h-6 text-accent" />
          <span>Risk Assessment</span>
        </h1>
        <p className="text-sm text-muted-foreground">AI-powered health monitoring</p>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 space-y-6">
        {/* Current Risk Status */}
        <section className="mt-6">
          {latestAssessment ? (
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getRiskIcon(latestAssessment.riskLevel)}
                    <h2 className="text-lg font-semibold text-foreground">Current Risk Level</h2>
                  </div>
                  <Badge 
                    variant={getRiskBadgeVariant(latestAssessment.riskLevel)}
                    className="text-sm"
                    data-testid="badge-current-risk"
                  >
                    {latestAssessment.riskLevel.charAt(0).toUpperCase() + latestAssessment.riskLevel.slice(1)} Risk
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Current Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Blood Pressure</p>
                        <p className="font-medium" data-testid="text-current-bp">
                          {latestAssessment.bloodPressure || 'Not recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="font-medium" data-testid="text-current-weight">
                          {latestAssessment.weight ? `${latestAssessment.weight} kg` : 'Not recorded'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Baby Movement</p>
                        <p className="font-medium capitalize" data-testid="text-current-movement">
                          {latestAssessment.babyMovement || 'Not recorded'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {latestAssessment.riskFactors && Array.isArray(latestAssessment.riskFactors) && latestAssessment.riskFactors.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Identified Risk Factors</h3>
                      <div className="flex flex-wrap gap-2">
                        {latestAssessment.riskFactors.map((factor, index) => (
                          <Badge key={index} variant="outline" data-testid={`badge-risk-factor-${index}`}>
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestAssessment.recommendations && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Recommendations</h3>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm" data-testid="text-recommendations">
                          {latestAssessment.recommendations}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(latestAssessment.assessmentDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">No Assessment Yet</h2>
                <p className="text-muted-foreground mb-4" data-testid="text-no-assessment">
                  Complete your first risk assessment to get personalized health insights
                </p>
                <Button onClick={() => setIsFormVisible(true)} data-testid="button-start-assessment">
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* New Assessment Form */}
        <section>
          {!isFormVisible ? (
            <Button 
              className="w-full" 
              onClick={() => setIsFormVisible(true)}
              data-testid="button-new-assessment"
            >
              <Heart className="w-4 h-4 mr-2" />
              Take New Assessment
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>New Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="bloodPressure">Blood Pressure</Label>
                    <Input 
                      id="bloodPressure" 
                      name="bloodPressure" 
                      placeholder="e.g., 120/80 mmHg"
                      data-testid="input-blood-pressure"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="weight">Current Weight (kg)</Label>
                    <Input 
                      id="weight" 
                      name="weight" 
                      type="number"
                      step="0.1"
                      placeholder="e.g., 65.5"
                      data-testid="input-weight"
                    />
                  </div>

                  <div>
                    <Label htmlFor="babyMovement">Baby Movement</Label>
                    <Select name="babyMovement">
                      <SelectTrigger data-testid="select-baby-movement">
                        <SelectValue placeholder="Select movement level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Very Active</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="reduced">Reduced</SelectItem>
                        <SelectItem value="none">No Movement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="symptoms">Current Symptoms (optional)</Label>
                    <Textarea 
                      id="symptoms" 
                      name="symptoms" 
                      placeholder="Describe any symptoms you're experiencing..."
                      rows={3}
                      data-testid="textarea-symptoms"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsFormVisible(false)}
                      className="flex-1"
                      data-testid="button-cancel-assessment"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createAssessmentMutation.isPending}
                      data-testid="button-submit-assessment"
                    >
                      {createAssessmentMutation.isPending ? "Analyzing..." : "Submit Assessment"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Assessment History */}
        {assessments && assessments.length > 1 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Assessment History</h2>
            <div className="space-y-3">
              {assessments.slice(1, 6).map((assessment, index) => (
                <Card key={assessment.id} data-testid={`card-history-assessment-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {getRiskIcon(assessment.riskLevel)}
                          <Badge 
                            variant={getRiskBadgeVariant(assessment.riskLevel)}
                            size="sm"
                            data-testid={`badge-history-risk-${index}`}
                          >
                            {assessment.riskLevel.charAt(0).toUpperCase() + assessment.riskLevel.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-history-date-${index}`}>
                          {new Date(assessment.assessmentDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        {assessment.bloodPressure && (
                          <div data-testid={`text-history-bp-${index}`}>
                            BP: {assessment.bloodPressure}
                          </div>
                        )}
                        {assessment.weight && (
                          <div data-testid={`text-history-weight-${index}`}>
                            Weight: {assessment.weight}kg
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Educational Content */}
        <section>
          <Card className="bg-accent/10">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                <Heart className="w-4 h-4 text-accent" />
                <span>Health Tips</span>
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Monitor your blood pressure regularly</p>
                <p>• Track baby movements daily</p>
                <p>• Maintain a healthy weight gain pattern</p>
                <p>• Report any concerning symptoms immediately</p>
                <p>• Keep all scheduled prenatal appointments</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}
