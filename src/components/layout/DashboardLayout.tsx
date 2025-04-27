import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { ProfileDialog } from "@/components/profile/ProfileDialog";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="flex-1">
        <div className="border-b">
          <div className="flex h-16 items-center px-4 gap-4">
            
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProfileOpen(true)}
              className="ml-auto"
            >
              <User className="h-5 w-5" />
            </Button>
            
            
          </div>
        </div>
        
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      <ProfileDialog 
        open={isProfileOpen} 
        onOpenChange={setIsProfileOpen} 
      />
    </div>
  );
}
