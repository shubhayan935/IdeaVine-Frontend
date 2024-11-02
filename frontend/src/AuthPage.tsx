'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Mail, Lock, User, ArrowRight } from 'lucide-react'

interface AuthPageProps {
  onLogin: (email: string, password: string) => void
  onSignup: (name: string, email: string, password: string) => void
}

export default function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'login') {
      onLogin(email, password)
    } else {
      onSignup(name, email, password)
    }
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  }

  const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center px-4">
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <Card className="w-full max-w-md overflow-hidden">
          <CardHeader className="space-y-1 bg-primary text-primary-foreground p-6">
            <div className="flex items-center justify-center mb-4">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              >
                <Leaf className="h-12 w-12" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome to IdeaVine</CardTitle>
            <CardDescription className="text-center text-primary-foreground/70">
              {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <AnimatePresence>
                        {activeTab === 'signup' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={springTransition}
                          >
                            <div className="space-y-2">
                              <Label htmlFor="name">Name</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="name"
                                  placeholder="John Doe"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="w-full mt-6 text-primary-foreground bg-primary hover:bg-secondary hover:text-secondary-foreground">
                      {activeTab === 'login' ? 'Sign In' : 'Sign Up'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-center bg-muted p-6">
            <p className="text-sm text-muted-foreground mb-2">
              {activeTab === 'login' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="ghost"
              onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
              className="text-sm text-secondary bg-primary hover:bg-secondary"
            >
              {activeTab === 'login' ? 'Create an account' : 'Sign in'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}