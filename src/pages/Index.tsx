
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Star, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: <School className="h-10 w-10 text-exam-primary animate-bounce" />,
      title: "Smart Learning Environment",
      description: "Experience a modern online examination platform designed for seamless learning and assessment."
    },
    {
      icon: <BookOpen className="h-10 w-10 text-exam-primary animate-pulse" />,
      title: "Advanced Question Types",
      description: "Multiple choice, short answers, and more - tailored to meet diverse assessment needs."
    },
    {
      icon: <Star className="h-10 w-10 text-exam-primary animate-bounce" />,
      title: "Real-time Monitoring",
      description: "Advanced proctoring with AI-powered features to ensure exam integrity."
    }
  ];

  const testimonials = [
    {
      text: "This platform revolutionized how we conduct exams. The AI proctoring is fantastic!",
      author: "Dr. Sarah Johnson",
      role: "Professor of Computer Science"
    },
    {
      text: "The interface is intuitive, and the real-time monitoring features are exceptional.",
      author: "Mark Wilson",
      role: "Department Head"
    },
    {
      text: "As a student, I love how smooth and stress-free the exam experience is.",
      author: "Emily Chen",
      role: "Student"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary animate-bounce" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SecureExam
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                onClick={() => setShowLogin(true)}
                className="bg-primary/90 hover:bg-primary"
              >
                Get Started
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
              <div className="text-center space-y-8 animate-fade-in">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                  <span className="block">Transform Your</span>
                  <span className="block text-primary">Examination Experience</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Secure, intelligent, and user-friendly online examination platform powered by advanced AI technology.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button size="lg" onClick={() => setShowLogin(true)} className="animate-bounce">
                    Start Now
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                  {features.map((feature, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-in">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-24 mb-16">
                  <h2 className="text-3xl font-bold mb-12">What Our Users Say</h2>
                  <Carousel className="max-w-xl mx-auto">
                    <CarouselContent>
                      {testimonials.map((testimonial, index) => (
                        <CarouselItem key={index}>
                          <Card className="mx-4">
                            <CardHeader>
                              <CardDescription className="text-lg italic">
                                "{testimonial.text}"
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="font-semibold">{testimonial.author}</p>
                              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="ml-2 font-semibold">SecureExam</span>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
              © {new Date().getFullYear()} SecureExam Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
