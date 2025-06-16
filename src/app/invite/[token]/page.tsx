"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface InvitationData {
  email: string;
  role: string;
  fullName: string;
  invitedBy: string;
  invitedAt: string;
  expired: boolean;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  
  const [formErrors, setFormErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const verifyInvitation = useCallback(async () => {
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/invite/${resolvedParams.token}/verify`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid invitation");
        setLoading(false);
        return;
      }

      setInvitationData(data.invitation);
      setLoading(false);
    } catch (err) {
      setError("Failed to verify invitation");
      setLoading(false);
    }
  }, [params]);

  // Verify invitation on component mount
  useEffect(() => {
    verifyInvitation();
  }, [verifyInvitation]);

  const validateForm = () => {
    const errors: typeof formErrors = {};

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    setError("");

    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/invite/${resolvedParams.token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to complete registration");
        setIsRegistering(false);
        return;
      }

      setRegistrationComplete(true);
      setIsRegistering(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);

    } catch (err) {
      setError("Failed to complete registration");
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => router.push("/auth/login")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Registration Complete!</h1>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. You will be redirected to the login page shortly.
            </p>
            <Button 
              onClick={() => router.push("/auth/login")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Go to Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white rounded-t-lg">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h1 className="text-xl font-semibold">Complete Your Registration</h1>
            <p className="text-orange-100 text-sm mt-2">
              You&apos;ve been invited to join FnB Kita
            </p>
          </div>
        </div>
        
        <CardContent className="p-6">
          {invitationData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Full Name:</span>
                <span className="text-sm font-medium">{invitationData.fullName}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium">{invitationData.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Role:</span>
                <span className="text-sm font-medium">{invitationData.role}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleRegistration} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: undefined });
                    }
                  }}
                  className={`pl-10 ${formErrors.password ? "border-red-300" : ""}`}
                  placeholder="Create a password"
                  disabled={isRegistering}
                />
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-600 mt-1">{formErrors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (formErrors.confirmPassword) {
                      setFormErrors({ ...formErrors, confirmPassword: undefined });
                    }
                  }}
                  className={`pl-10 ${formErrors.confirmPassword ? "border-red-300" : ""}`}
                  placeholder="Confirm your password"
                  disabled={isRegistering}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}