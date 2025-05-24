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
    <div className="p-4 pb-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Material Design Form Fields */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-700">Amount (IDR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg text-base"
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
                <FormLabel className="text-base font-medium text-gray-700">Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="meal">🍽️ Meal</SelectItem>
                    <SelectItem value="transport">🚗 Transport</SelectItem>
                    <SelectItem value="supplies">📦 Supplies</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
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
                <FormLabel className="text-base font-medium text-gray-700">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the expense..."
                    className="min-h-[120px] border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg text-base resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Material Design File Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700">Receipt (Optional)</Label>
            <div className="space-y-4">
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
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors rounded-lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Receipt
              </Button>
              
              {receiptPreview && (
                <div className="relative rounded-lg overflow-hidden shadow-md">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-3 right-3 shadow-lg"
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

          {/* Material Design Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-12 border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 shadow-md rounded-lg"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}