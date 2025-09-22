import { useLocation } from "wouter";
import { Home, Calendar, Heart, Users, User } from "lucide-react";

export default function Navigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      testId: "nav-home"
    },
    {
      icon: Calendar,
      label: "Schedule",
      path: "/schedule",
      testId: "nav-schedule"
    },
    {
      icon: Heart,
      label: "Health",
      path: "/risk-assessment",
      testId: "nav-health"
    },
    {
      icon: Users,
      label: "Community",
      path: "/community",
      testId: "nav-community"
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      testId: "nav-profile"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="max-w-sm mx-auto px-4 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center space-y-1 transition-colors ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
