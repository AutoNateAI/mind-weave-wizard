import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Settings, User, ArrowLeft, Wand2 } from "lucide-react";
import { useAdminViewSwitch } from "@/hooks/useAdminViewSwitch";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminHeader() {
  const { isStudentView, toggleView, canSwitchViews } = useAdminViewSwitch();

  if (!canSwitchViews) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-bold cyber-glow">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">AI-powered course generation and management</p>
          </div>
          <Badge variant="default" className="gap-2 hidden sm:flex">
            <Wand2 className="w-3 h-3" />
            AI Powered
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={isStudentView ? "secondary" : "default"} className="gap-2 hidden sm:flex">
          {isStudentView ? <User className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
          {isStudentView ? "Student View" : "Admin View"}
        </Badge>
        <ThemeToggle />
        <Button
          onClick={toggleView}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Switch to {isStudentView ? "Admin" : "Student"} View</span>
          <span className="sm:hidden">{isStudentView ? "Admin" : "Student"}</span>
        </Button>
      </div>
    </div>
  );
}