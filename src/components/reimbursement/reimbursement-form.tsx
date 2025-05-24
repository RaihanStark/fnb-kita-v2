"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/stores/auth-store";
import useReimbursementStore from "@/stores/reimbursement-store";
import { ArrowLeft, Upload } from "lucide-react";
import { getAuth } from "firebase/auth";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required").transform((val) => parseFloat(val)),
  category: z.enum(["meal", "transport", "supplies", "other"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function ReimbursementForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { submitReimbursement } = useReimbursementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      category: "meal",
      description: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPEG, PNG, and WebP images are allowed");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Submit reimbursement
      const reimbursementId = await submitReimbursement({
        employeeId: user.uid,
        employeeName: user.displayName || user.email?.split("@")[0] || "Unknown",
        employeeEmail: user.email || "",
        amount: data.amount,
        category: data.category,
        description: data.description,
      });

      // Upload receipt if provided
      if (receiptFile && reimbursementId) {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        
        const formData = new FormData();
        formData.append("file", receiptFile);

        const response = await fetch(`/api/reimbursements/${reimbursementId}/receipt`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          console.error("Failed to upload receipt");
        }
      }

      router.push("/reimbursements");
    } catch (error) {
      console.error("Error submitting reimbursement:", error);
      alert("Failed to submit reimbursement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Reimbursement</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (IDR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the expense..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Receipt (Optional)</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("receipt-upload")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
              </div>
              
              {receiptPreview && (
                <div className="relative">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}