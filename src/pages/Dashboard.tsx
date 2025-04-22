
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { checkUserRole } from "@/services/AuthService";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await checkUserRole();
      
      if (!role) {
        // User is not authenticated, redirect to login
        navigate("/");
        return;
      }
      
      setUserRole(role);
      setLoading(false);
    };

    fetchUserRole();
  }, [navigate]);

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "student":
        return <StudentDashboard />;
      default:
        return (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
