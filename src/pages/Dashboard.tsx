
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { checkUserRole } from "@/services/AuthService";
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Home, Users, Folder, BookOpen, BarChart } from "lucide-react";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      // First check from localStorage for admin user
      const storedUser = localStorage.getItem("examUser");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user.role) {
            setUserRole(user.role);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
      
      // If not found in localStorage or parsing failed, check with the service
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

  const NavSidebar = () => {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/departments" className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>Departments</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/exam/create" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Create Exam</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {userRole === "admin" && <NavSidebar />}
        <main className="flex-1 p-6">
          {renderDashboard()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
