
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export interface SupportProps {
  userId: string | null;
}

export function Support({ userId }: SupportProps) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!subject || !message) {
      toast({
        title: "Error",
        description: "Please fill in both the subject and message fields.",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting support request:", { userId, subject, message });

    toast({
      title: "Success",
      description: "Your support request has been submitted!",
    });

    setMessage("");
    setSubject("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Support</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="subject">Subject</label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="message">Message</label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
          />
        </div>
        <Button onClick={handleSubmit}>Submit Request</Button>
      </CardContent>
    </Card>
  );
}
