// LandingPage.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Link as ScrollLink, Element } from 'react-scroll'
import { Button } from "@/components/ui/button"
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Input } from "@/components/ui/input"
import { Leaf, Brain, Zap, PenTool, Mic, Lightbulb, ChevronRight, Check } from 'lucide-react'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { useInView } from 'react-intersection-observer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeProvider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Link, useNavigate } from 'react-router-dom'
import { useUserInfo } from './context/UserContext'

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Main Idea' }, type: 'input' },
  { id: '2', position: { x: -100, y: 100 }, data: { label: 'Subtopic 1' } },
  { id: '3', position: { x: 100, y: 100 }, data: { label: 'Subtopic 2' } },
  { id: '4', position: { x: -150, y: 200 }, data: { label: 'Detail 1' } },
  { id: '5', position: { x: -50, y: 200 }, data: { label: 'Detail 2' } },
  { id: '6', position: { x: 50, y: 200 }, data: { label: 'Detail 3' } },
  { id: '7', position: { x: 150, y: 200 }, data: { label: 'Detail 4' } },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e2-5', source: '2', target: '5' },
  { id: 'e3-6', source: '3', target: '6' },
  { id: 'e3-7', source: '3', target: '7' },
]

const features = [
  { icon: Brain, title: 'Intuitive Mind Mapping', description: 'Create and organize your ideas visually with our easy-to-use interface.' },
  { icon: Zap, title: 'AI-Powered Suggestions', description: 'Get intelligent suggestions to expand your mind maps and spark creativity.' },
  { icon: PenTool, title: 'Rich Text Editing', description: 'Format your notes and add details to your ideas with our powerful text editor.' },
  { icon: Mic, title: 'Voice Recording', description: 'Capture your thoughts on the go with built-in voice recording functionality.' },
]

const testimonials = [
  {
    name: 'Alex Johnson',
    role: 'Product Manager',
    content: 'IdeaVine has revolutionized our brainstorming sessions. It\'s intuitive, powerful, and the AI suggestions are spot-on!',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    name: 'Sarah Lee',
    role: 'Creative Director',
    content: 'As a visual thinker, IdeaVine is a game-changer. It helps me organize my thoughts in a way that makes sense to me and my team.',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    name: 'Michael Chen',
    role: 'Entrepreneur',
    content: 'The voice recording feature is perfect for capturing ideas on the go. IdeaVine has become an essential tool for my business planning.',
    avatar: '/placeholder.svg?height=40&width=40',
  },
]

const faqItems = [
  {
    question: 'What is IdeaVine?',
    answer: 'IdeaVine is an innovative mind mapping tool that helps you visualize, organize, and expand your ideas. It combines intuitive design with AI-powered suggestions to enhance your creative process.',
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes, we offer a 14-day free trial for all new users. This gives you full access to all features so you can experience the power of IdeaVine firsthand.',
  },
  {
    question: 'Can I collaborate with others on my mind maps?',
    answer: 'IdeaVine supports real-time collaboration, allowing you to work on mind maps with your team members or clients simultaneously.',
  },
  {
    question: 'Is my data secure?',
    answer: 'We take data security very seriously. All your mind maps and personal information are encrypted and stored securely. We never share your data with third parties.',
  },
]

function LandingPageContent() {
  const [email, setEmail] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const controls = useAnimation()
  const [ref, inView] = useInView()
  const [activeTab, setActiveTab] = useState('mindmap')
  const navigate = useNavigate()
  const { theme } = useTheme()

  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  const { userEmail } = useUserInfo();

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(String(email).toLowerCase())
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setIsEmailValid(true)
    setIsSubmitted(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(email)) {
      setIsSubmitted(true)
      // Here you would typically send the email to your backend
    } else {
      setIsEmailValid(false)
    }
  }

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>, node: Node) => {
      const updatedNodes = nodes.map((n) => {
        if (n.id === node.id) {
          return node
        }
        return n
      })
      setNodes(updatedNodes)
    },
    [nodes]
  )

  const fetchMindmaps = async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/users/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include authentication headers if required by backend
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user UID");
      }

      const data = await response.json();
      const userUid = data.user._id;

      // After getting userUid, fetch mindmaps
      await fetchMindmapsByUid(userUid);
    } catch (err: any) {
      console.error("Error fetching user UID:", err);
    }
  };

  const fetchMindmapsByUid = async (userUid: string) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/users/${userUid}/mindmaps`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Include authentication headers if required by backend
            // 'Authorization': `Bearer ${token}`
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch mindmaps");
      }

      const data = await response.json();
      const sortedMindmaps = data.mindmaps.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      navigate(`/mindmap/${sortedMindmaps[0]._id}`);
    } catch (err: any) {
      console.error("Error fetching mindmaps:", err);
  };
}

  return (
    <div className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Add the dotted background to the entire page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ReactFlow
          nodes={[]}
          edges={[]}
          nodeTypes={{}}
          edgeTypes={{}}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color={theme === 'dark' ? '#666' : '#000'}
            gap={16}
            size={1}
          />
        </ReactFlow>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-semibold">IdeaVine</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <ScrollLink
                  to="features"
                  smooth={true}
                  duration={500}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Features
                </ScrollLink>
                <ScrollLink
                  to="demo"
                  smooth={true}
                  duration={500}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Demo
                </ScrollLink>
                <ScrollLink
                  to="testimonials"
                  smooth={true}
                  duration={500}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Testimonials
                </ScrollLink>
                <ScrollLink
                  to="faq"
                  smooth={true}
                  duration={500}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  FAQ
                </ScrollLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <SignedOut>
                <Button size="sm" className="rounded-full" onClick={() => navigate('/auth/sign-in')}>
                  Sign In
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate('/auth/sign-up')}>
                  Sign Up
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="sm" className="rounded-full" onClick={fetchMindmaps}>
                  Open Mind Maps
                </Button>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Unleash Your Ideas with <span className="text-primary">IdeaVine</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Transform your thoughts into visual masterpieces. IdeaVine helps you capture, organize, and expand your ideas like never before.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" className="rounded-full" onClick={() => navigate('/mindmap')}>
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full">
                  Watch Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="h-full w-full" style={{ overflow: 'visible' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeDragStop={onNodeDragStop}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Element name="features">
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powerful Features to Boost Your Creativity</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                IdeaVine combines cutting-edge technology with intuitive design to help you brainstorm and organize your thoughts effectively.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="rounded-lg bg-card p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Element>

      {/* Demo Section */}
      <Element name="demo">
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">See IdeaVine in Action</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Experience the power and simplicity of IdeaVine with our interactive demo videos.
              </p>
            </div>
            <Tabs defaultValue="mindmap" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary">
                <TabsTrigger value="mindmap" className="bg-secondary">Mind Mapping</TabsTrigger>
                <TabsTrigger value="suggestions" className="bg-secondary">AI Suggestions</TabsTrigger>
                <TabsTrigger value="voice" className="bg-secondary">Voice Recording</TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3  }}
                >
                  <TabsContent value="mindmap" className="bg-card rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Create Your Mind Map</h3>
                    <p className="mb-4">Watch how easy it is to create and organize your ideas with IdeaVine's intuitive interface.</p>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Mind Mapping Demo Video</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="suggestions" className="bg-card rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">AI-Powered Suggestions</h3>
                    <p className="mb-4">See how our AI analyzes your mind map and provides relevant suggestions to expand your ideas.</p>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">AI Suggestions Demo Video</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="voice" className="bg-card rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Voice Recording</h3>
                    <p className="mb-4">Learn how to capture your ideas on the go with our voice recording feature.</p>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Voice Recording Demo Video</p>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </section>
      </Element>

      {/* Testimonials Section */}
      <Element name="testimonials">
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Users Say</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Discover how IdeaVine is transforming the way people think and work.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="bg-card rounded-lg p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <p className="text-muted-foreground mb-4">{testimonial.content}</p>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Element>

      {/* FAQ Section */}
      <Element name="faq">
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Find answers to common questions about IdeaVine.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="bg-card hover:bg-card/90 px-6 py-4 text-left">
                      <span className="font-semibold text-lg">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="bg-background px-6 py-4">
                      <Card className="p-4 bg-muted/50">
                        <p className="text-muted-foreground">{item.answer}</p>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </Element>

      {/* CTA Section */}
      <section className="bg-primary py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to Transform Your Ideas?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join thousands of creative thinkers and problem solvers. Start your journey with IdeaVine today.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center sm:flex-row sm:justify-center">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full sm:w-64 text-secondary rounded-full ${!isEmailValid ? 'border-red-500' : ''}`}
              />
              <Button type="submit" size="lg" className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto rounded-full">
                {isSubmitted ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Submitted
                  </>
                ) : (
                  'Get Early Access'
                )}
              </Button>
            </form>
            {!isEmailValid && (
              <p className="mt-2 text-sm text-red-400">Please enter a valid email address.</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-semibold">IdeaVine</span>
            </div>
              <span className="text-muted-foreground">
                An <a href="https://www.linkedin.com/in/shubhayan935" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ss</a> and <a href="https://www.linkedin.com/in/vishnu-swarup-kadaba/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vk</a> production
              </span>
            <nav className="mt-4 flex items-center space-x-4 sm:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground">Contact</a>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © 2024 IdeaVine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function LandingPage() {
  return (
    <ThemeProvider defaultTheme="dark">
      <LandingPageContent />
    </ThemeProvider>
  )
}