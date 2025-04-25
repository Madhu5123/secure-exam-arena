
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getExamsForStudent } from "@/services/ExamService";
import { Analysis } from "./StudentDashboard/Analysis";
import { Results } from "./StudentDashboard/Results";
import { MyExams } from "./StudentDashboard/MyExams";

export function StudentDashboard() {
  const [view, setView] = useState<"dashboard" | "results" | "myexams">("dashboard");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname === "/dashboard/results") {
      setView("results");
    } else if (location.pathname === "/dashboard/myexams") {
      setView("myexams");
    } else {
      setView("dashboard");
    }
  }, [location]);

  const user = localStorage.getItem('examUser');
  const userData = user ? JSON.parse(user) : null;

  if (!userData) {
    return null;
  }

  const renderContent = () => {
    switch (view) {
      case "results":
        return <Results studentId={userData.id} />;
      case "myexams":
        return <MyExams studentId={userData.id} />;
      default:
        return <Analysis studentId={userData.id} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
}
