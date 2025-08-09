import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Settings, User, ArrowLeft } from "lucide-react";
import { useAdminViewSwitch } from "@/hooks/useAdminViewSwitch";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link, useNavigate } from "react-router-dom";

export function AdminHeader() {
  const { isStudentView, toggleView, canSwitchViews } = useAdminViewSwitch();

  if (!canSwitchViews) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <Badge variant={isStudentView ? "secondary" : "default"} className="gap-2">
          {isStudentView ? <User className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
          {isStudentView ? "Student View" : "Admin View"}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          onClick={toggleView}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          Switch to {isStudentView ? "Admin" : "Student"} View
        </Button>
      </div>
    </div>
  );
}