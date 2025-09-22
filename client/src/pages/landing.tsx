import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="space-y-2">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">MomCare</h1>
            <p className="text-lg text-muted-foreground">
              Your Maternal Health Companion
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-foreground">
              Comprehensive support for your pregnancy journey and beyond
            </p>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Schedule and track ANC visits</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>AI-powered risk assessments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>Child immunization reminders</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Community support network</span>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={() => {
              window.location.href = "/api/login";
            }}
            data-testid="button-login"
          >
            Get Started
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Join thousands of mothers on their wellness journey
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
