// AuthPage.tsx

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Leaf,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSignIn, useSignUp, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from "uuid"; // Import UUID

export default function AuthPage() {
  // Define active tab: 'login', 'signup', or 'forgotPassword'
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgotPassword'>('login');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successfulReset, setSuccessfulReset] = useState(false);

  // State variables for password visibility
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);

  // State variables for input field errors
  const [loginPasswordError, setLoginPasswordError] = useState(false);
  const [signupPasswordError, setSignupPasswordError] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState(false);

  const { isLoaded: isSignInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const navigate = useNavigate();

  // Function to handle tab changes and reset relevant states
  const handleSetActiveTab = (value: 'login' | 'signup' | 'forgotPassword') => {
    setActiveTab(value);
    setErrors([]);
    setEmailAddress('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setVerificationCode('');
    setIsVerifying(false);
    setSuccessfulReset(false);
    setLoginPasswordVisible(false);
    setSignupPasswordVisible(false);
    setResetPasswordVisible(false);
    setLoginPasswordError(false);
    setSignupPasswordError(false);
    setResetPasswordError(false);
  };

  // Function to handle form submissions based on active tab
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (activeTab === 'login') {
      if (!isSignInLoaded) return;
      try {
        const result = await signIn.create({
          identifier: emailAddress,
          password,
        });

        if (result.status === 'complete') {
          await setActiveSignIn({ session: result.createdSessionId });
          navigate('/mindmap');
        } else {
          setErrors(['Sign-in incomplete.']);
        }
      } catch (err: any) {
        console.error(err);
        // Check if error relates to password
        if (err.errors && err.errors[0].code === 'invalid_credentials') {
          setLoginPasswordError(true);
        }
        setErrors(
          err.errors
            ? err.errors.map((error: any) => error.longMessage)
            : ['An error occurred during sign-in.']
        );
      }
    } else if (activeTab === 'signup') {
      if (!isSignUpLoaded) return;
      try {
        // Step 1: Create the sign-up with email and password
        await signUp.create({
          emailAddress,
          password,
        });

        // Step 2: Update the sign-up with firstName and lastName
        await signUp.update({
          firstName,
          lastName: lastName || undefined,
        });

        // Step 3: Prepare for email address verification
        await signUp.prepareEmailAddressVerification();

        // Step 4: Proceed to verification
        setIsVerifying(true);
      } catch (err: any) {
        console.error(err);
        // Check if error relates to password
        if (err.errors && err.errors[0].code === 'password_too_short') {
          setSignupPasswordError(true);
        }
        setErrors(
          err.errors
            ? err.errors.map((error: any) => error.longMessage)
            : ['An error occurred during sign-up.']
        );
      }
    } else if (activeTab === 'forgotPassword') {
      if (!isSignInLoaded) return;
      try {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: emailAddress,
        });
        setSuccessfulReset(true);
        setErrors(['A password reset code has been sent to your email.']);
      } catch (err: any) {
        console.error('error', err.errors[0].longMessage);
        // Check if error relates to user not found
        if (err.errors && err.errors[0].code === 'user_not_found') {
          setLoginPasswordError(true);
        }
        setErrors([err.errors[0].longMessage]);
      }
    }
  };

  // Function to handle password reset submission
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: verificationCode,
        password,
      });

      if (result.status === 'needs_second_factor') {
        setErrors([]);
      } else if (result.status === 'complete') {
        await setActiveSignIn({ session: result.createdSessionId });
        navigate('/mindmap');
      }
    } catch (err: any) {
      console.error('error', err.errors[0].longMessage);
      // Check if error relates to password
      if (err.errors && err.errors[0].code === 'invalid_password') {
        setResetPasswordError(true);
      }
      setErrors([err.errors[0].longMessage]);
    }
  };

  // Function to handle email verification during sign-up
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });
      if (completeSignUp.status === 'complete') {
        await setActiveSignUp({ session: completeSignUp.createdSessionId! });
        
        // After successful sign-up and email verification, create the user in MongoDB
        await createUserInBackend();

        navigate('/mindmap');
      } else {
        setErrors(['Verification failed. Please try again.']);
      }
    } catch (err: any) {
      console.error(err);
      setErrors(
        err.errors
          ? err.errors.map((error: any) => error.longMessage)
          : ['An error occurred during verification.']
      );
    }
  };

  // Function to create user in MongoDB via backend
  const createUserInBackend = async () => {
    try {
      // Retrieve the Clerk user ID
      const clerkUserId = signUp?.createdUserId;
      if (!clerkUserId) {
        throw new Error('Clerk user ID not found.');
      }

      // Prepare user data
      const userData = {
        email: emailAddress,
        firstName,
        lastName,
        clerkId: clerkUserId,
      };

      // Make POST request to backend to create user in MongoDB
      const response = await fetch('http://127.0.0.1:5000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication headers if your backend requires them
          // 'Authorization': `Bearer YOUR_BACKEND_AUTH_TOKEN`
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user in backend.');
      }

      await createBlankMindmap(emailAddress);
    } catch (error: any) {
      console.error('Error creating user in backend:', error);
      setErrors([error.message || 'An error occurred while creating your account.']);
    }
  };

  const createBlankMindmap = async (userEmail: string) => {
    const blankMindmap = {
      mindmap_id: uuidv4(),
      user_email: userEmail,
      title: 'Untitled Mindmap',
      description: 'Start your mind map here.',
      nodes: [],
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/mindmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blankMindmap),
      });

      if (!response.ok) {
        throw new Error('Failed to create blank mindmap.');
      }

    } catch (error) {
      console.error('Error creating blank mindmap:', error);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  // Render verification form during email verification
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/20 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>Enter the verification code sent to your email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification}>
              <div className="space-y-4">
                {errors.length > 0 && (
                  <div className="bg-red-100 text-red-700 p-2 rounded">
                    {errors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter code"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Verify Email
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render password reset form after successful reset code sent
  if (successfulReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/20 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>Enter the code sent to your email and your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset}>
              <div className="space-y-4">
                {errors.length > 0 && (
                  <div className="bg-red-100 text-red-700 p-2 rounded">
                    {errors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={resetPasswordVisible ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (resetPasswordError) setResetPasswordError(false);
                      }}
                      className={`pl-10 pr-10 ${
                        resetPasswordError ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setResetPasswordVisible(!resetPasswordVisible)}
                      className="absolute right-3 top-3 text-muted-foreground bg-transparent p-0 focus:outline-none"
                      aria-label={
                        resetPasswordVisible ? 'Hide password' : 'Show password'
                      }
                    >
                      {resetPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter code"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Reset Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main authentication forms: login, signup, forgotPassword
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/20 flex items-center justify-center px-4">
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full max-w-xl"
      >
        <Card className="w-full overflow-hidden">
          <CardHeader className="space-y-1 bg-primary text-primary-foreground p-6">
            <div className="flex items-center justify-center mb-4">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <Leaf className="h-12 w-12" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome to IdeaVine</CardTitle>
            <CardDescription className="text-center text-primary-foreground/70">
              {activeTab === 'login' && 'Sign in to your account'}
              {activeTab === 'signup' && 'Create a new account'}
              {activeTab === 'forgotPassword' && 'Reset your password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                handleSetActiveTab(value as 'login' | 'signup' | 'forgotPassword')
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" className="bg-secondary">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="bg-secondary">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  {activeTab === 'login' && (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        {errors.length > 0 && (
                          <div className="bg-red-100 text-red-700 p-2 rounded">
                            {errors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="m@example.com"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={loginPasswordVisible ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (loginPasswordError) setLoginPasswordError(false);
                              }}
                              className={`pl-10 pr-10 ${
                                loginPasswordError ? 'border-red-500' : ''
                              }`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setLoginPasswordVisible(!loginPasswordVisible)}
                              className="absolute right-3 top-3 text-muted-foreground bg-transparent p-0 focus:outline-none"
                              aria-label={
                                loginPasswordVisible ? 'Hide password' : 'Show password'
                              }
                            >
                              {loginPasswordVisible ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            className="text-sm text-primary bg-transparent hover:underline p-0"
                            onClick={() => handleSetActiveTab('forgotPassword')}
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <Button
                          type="submit"
                          className="w-full mt-6 text-primary-foreground bg-primary hover:bg-secondary hover:text-secondary-foreground"
                        >
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        {/* Google Sign-In Button */}
                        {/* <Button
                          type="button"
                          onClick={() => signIn.create({ strategy: 'oauth_google' })}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 mt-4"
                        >
                          <img src="/google-logo.svg" className="h-4 w-4" alt="Google Logo" />
                          Sign in with Google
                        </Button> */}
                      </div>
                    </form>
                  )}
                  {activeTab === 'signup' && (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        {errors.length > 0 && (
                          <div className="bg-red-100 text-red-700 p-2 rounded">
                            {errors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="lastName">Last Name (Optional)</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="m@example.com"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={signupPasswordVisible ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (signupPasswordError) setSignupPasswordError(false);
                              }}
                              className={`pl-10 pr-10 ${
                                signupPasswordError ? 'border-red-500' : ''
                              }`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setSignupPasswordVisible(!signupPasswordVisible)}
                              className="absolute right-3 top-3 text-muted-foreground bg-transparent m-0 p-0 focus:outline-none"
                              aria-label={
                                signupPasswordVisible ? 'Hide password' : 'Show password'
                              }
                            >
                              {signupPasswordVisible ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full mt-6 text-primary-foreground bg-primary hover:bg-secondary hover:text-secondary-foreground"
                        >
                          Sign Up
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        {/* Google Sign-Up Button */}
                        {/* <Button
                          type="button"
                          onClick={() => signUp.create({ strategy: 'oauth_google' })}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 mt-4"
                        >
                          <img src="/google-logo.svg" className="h-4 w-4" alt="Google Logo" />
                          Sign up with Google
                        </Button> */}
                      </div>
                    </form>
                  )}
                  {activeTab === 'forgotPassword' && (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        {errors.length > 0 && (
                          <div className="bg-red-100 text-red-700 p-2 rounded">
                            {errors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="m@example.com"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full mt-6 text-primary-foreground bg-primary hover:bg-secondary hover:text-secondary-foreground"
                        >
                          Send Reset Code
                        </Button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-center bg-muted p-6">
            <p className="text-sm text-muted-foreground mb-2">
              {activeTab === 'login' && "Don't have an account?"}
              {activeTab === 'signup' && 'Already have an account?'}
              {activeTab === 'forgotPassword' && 'Remember your password?'}
            </p>
            <Button
              variant="ghost"
              onClick={() =>
                handleSetActiveTab(activeTab === 'login' ? 'signup' : 'login')
              }
              className="text-sm text-secondary bg-primary hover:bg-secondary"
            >
              {activeTab === 'login' ? 'Create an account' : 'Sign in'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
