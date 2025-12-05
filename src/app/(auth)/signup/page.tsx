"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import {
  AGE_THRESHOLDS,
  SAFETY_MODE_CONFIG,
  getAgeTier,
  calculateAge,
  type AgeTier,
} from "@/types";

type SignupStep = "form" | "under_13_blocked" | "parental_consent" | "success";

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToAgeVerification, setAgreedToAgeVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate age and tier from DOB
  const { age, ageTier } = useMemo(() => {
    if (!dateOfBirth) return { age: null, ageTier: null };
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return { age: null, ageTier: null };
    return {
      age: calculateAge(dob),
      ageTier: getAgeTier(dob),
    };
  }, [dateOfBirth]);

  // Calculate max date (today) and min date (100 years ago)
  const today = new Date().toISOString().split("T")[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate DOB
    if (!dateOfBirth) {
      setError("Please enter your date of birth");
      setLoading(false);
      return;
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      setError("Please enter a valid date of birth");
      setLoading(false);
      return;
    }

    // Check if under 13 - requires parental consent flow
    if (ageTier === "under_13") {
      if (!parentEmail) {
        setStep("under_13_blocked");
        setLoading(false);
        return;
      }
      // Parent email provided, continue to parental consent
    }

    // Validate password
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    // Validate age verification
    if (!agreedToAgeVerification) {
      setError("Please confirm that your date of birth is accurate");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Create the account
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          date_of_birth: dateOfBirth,
          parent_email: parentEmail || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // If under 13, show parental consent message
    if (ageTier === "under_13") {
      setStep("parental_consent");
    } else {
      setStep("success");
    }

    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    // For OAuth, we need to collect DOB after login
    // This is handled in the callback
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?needs_dob=true`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  // Render age tier info message
  const renderAgeTierInfo = () => {
    if (!ageTier || !age) return null;

    const config = SAFETY_MODE_CONFIG[ageTier];

    switch (ageTier) {
      case "under_13":
        return (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm">
            <strong>Age {age}:</strong> Users under 13 require verifiable parental consent
            (COPPA requirement). Safety Mode will be permanently enabled with maximum filtering.
          </div>
        );
      case "13_14":
        return (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
            <strong>Age {age}:</strong> Safety Mode will be enabled by default to protect
            you online. A parent can link their account to adjust settings.
          </div>
        );
      case "14_17":
        return (
          <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-md text-sm">
            <strong>Age {age}:</strong> You&apos;ll have full access to all features.
            Optional parental linking is available.
          </div>
        );
      default:
        return null;
    }
  };

  // Under 13 blocked screen
  if (step === "under_13_blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">👨‍👩‍👧</div>
            <CardTitle>Parent Permission Required</CardTitle>
            <CardDescription>
              Users under 13 need a parent or guardian to create an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To comply with the Children&apos;s Online Privacy Protection Act (COPPA),
              we need your parent or guardian to verify their consent before you can
              use PenBotAI.
            </p>

            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
              <Input
                id="parentEmail"
                type="email"
                placeholder="parent@email.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send them a verification link to approve your account.
              </p>
            </div>

            <Button
              onClick={() => {
                if (parentEmail) {
                  setStep("form");
                }
              }}
              className="w-full"
              disabled={!parentEmail}
            >
              Continue with Parent Email
            </Button>

            <Button
              variant="outline"
              onClick={() => setStep("form")}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parental consent pending screen
  if (step === "parental_consent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <CardTitle>Waiting for Parent Approval</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification request to {parentEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Your parent will receive an email</li>
                <li>They&apos;ll verify their identity</li>
                <li>Once approved, you&apos;ll get an email to activate your account</li>
              </ol>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              This usually takes 24-48 hours. Ask your parent to check their email!
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("form")}
              >
                Use Different Email
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">✉️</div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {ageTier === "13_14" && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm text-blue-800">
                <strong>Note:</strong> Safety Mode will be enabled by default.
                We&apos;ve also sent an email to your parent to let them know
                you&apos;ve created an account.
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or
            </p>
            <Button variant="outline" onClick={() => setStep("form")}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PenBotAI
            </span>
          </Link>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Start using AI responsibly in your academic work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Date of Birth - Neutral question per COPPA 2025 */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">What is your date of birth?</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={today}
                min={minDateStr}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required for age-appropriate safety features and legal compliance.
              </p>
            </div>

            {/* Age tier info message */}
            {renderAgeTierInfo()}

            {/* Parent email for under-13 */}
            {ageTier === "under_13" && (
              <div className="space-y-2">
                <Label htmlFor="parentEmailForm">Parent/Guardian Email</Label>
                <Input
                  id="parentEmailForm"
                  type="email"
                  placeholder="parent@email.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Required for users under 13 (COPPA compliance).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            {/* Age verification checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="ageVerification"
                checked={agreedToAgeVerification}
                onCheckedChange={(checked) => setAgreedToAgeVerification(checked === true)}
              />
              <Label
                htmlFor="ageVerification"
                className="text-sm font-normal leading-tight cursor-pointer"
              >
                I confirm that my date of birth is accurate and I understand that
                providing false information may result in account termination.
              </Label>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-tight cursor-pointer"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                {ageTier && ageTier !== "adult" && (
                  <>
                    , including the{" "}
                    <Link href="/privacy#children" className="text-blue-600 hover:underline">
                      Children&apos;s Privacy Notice
                    </Link>
                  </>
                )}
                .
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (ageTier === "under_13" && !parentEmail)}
            >
              {loading
                ? "Creating account..."
                : ageTier === "under_13"
                  ? "Request Parent Approval"
                  : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Note: Google sign-in will ask for your date of birth on first login.
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
