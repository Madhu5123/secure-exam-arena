
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "@/config/firebase";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

interface HelpFormValues {
  name: string;
  email: string;
  examId: string;
  message: string;
}

export function HelpDialog({ open, onOpenChange, studentId, studentName, studentEmail }: HelpDialogProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<HelpFormValues>({
    defaultValues: {
      name: studentName,
      email: studentEmail,
      examId: "",
      message: "",
    },
  });

  // Fetch student's exams for the dropdown
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsRef = ref(db, "exams");
        const snapshot = await fetch(`https://exam-portal-bba32-default-rtdb.firebaseio.com/exams.json?orderBy="students/${studentId}"&equalTo=true`);
        const data = await snapshot.json();

        if (data) {
          const examArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            title: data[key].title || "Untitled Exam"
          }));
          setExams(examArray);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    };

    if (open) {
      fetchExams();
    }
  }, [open, studentId]);

  const onSubmit = async (values: HelpFormValues) => {
    setLoading(true);
    try {
      const supportRef = ref(db, "support");
      await push(supportRef, {
        ...values,
        studentId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Support request sent",
        description: "Your message has been sent to the teacher. We'll get back to you soon.",
      });
      
      onOpenChange(false);
      form.reset({
        name: studentName,
        email: studentEmail,
        examId: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Failed to send request",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Support</DialogTitle>
          <DialogDescription>
            Fill in the form below to request help from your teacher.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="examId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Exam</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exam" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {exams.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="general">General Question (No Specific Exam)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your issue or question here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
