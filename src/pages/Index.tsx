
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, FileText, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginForm } from "@/components/auth/LoginForm";

const Index = () => {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="h-10 w-10 text-exam-primary" />,
      title: "Secure Examination",
      description: "Multi-layered security protocols ensure exam integrity with real-time monitoring and AI-powered proctoring."
    },
    {
      icon: <FileText className="h-10 w-10 text-exam-primary" />,
      title: "Flexible Question Types",
      description: "Create exams with multiple-choice, true/false, and short-answer questions tailored to your subject requirements."
    },
    {
      icon: <Users className="h-10 w-10 text-exam-primary" />,
      title: "Role-Based Access",
      description: "Dedicated interfaces for administrators, teachers, and students with appropriate permissions and features."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-exam-primary" />
              <span className="ml-2 text-xl font-bold">Secure Exam Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button onClick={() => setShowLogin(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {showLogin ? (
          <div className="max-w-md mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => setShowLogin(false)}
              className="text-sm text-muted-foreground hover:text-primary mb-4 flex items-center"
            >
              ← Back to Home
            </button>
            <LoginForm />
          </div>
        ) : (
          <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  <span className="block">Secure Online</span>
                  <span className="block text-exam-primary">Examination Portal</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  A comprehensive platform for conducting secure, monitored online examinations with advanced proctoring and real-time analytics.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <Button size="lg" onClick={() => setShowLogin(true)}>
                    Get Started
                  </Button>
                </div>
              </div>

              <div className="mt-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-md transition-all">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          {feature.icon}
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mt-16 bg-card-gradient rounded-lg p-8 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Examination Process?</h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join educators around the world who have made the switch to our secure, efficient online examination platform.
                </p>
                <Button size="lg" onClick={() => setShowLogin(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-card border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-exam-primary" />
              <span className="ml-2 font-semibold">Secure Exam Portal</span>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
              © {new Date().getFullYear()} Secure Exam Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
