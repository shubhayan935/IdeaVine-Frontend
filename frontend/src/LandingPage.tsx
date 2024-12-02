// LandingPage.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Link as ScrollLink, Element } from 'react-scroll'
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Input } from "@/components/ui/input"
import { Leaf, Brain, Zap, PenTool, Mic, ChevronRight, Check } from 'lucide-react'
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
import { Card } from "@/components/ui/card"
import { useNavigate } from 'react-router-dom'
import { cn } from "@/lib/utils"

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
  { icon: Mic, title: 'Voice Recording', description: 'Capture your thoughts on the go with built-in voice recording functionality.' },
  { icon: Zap, title: 'AI-Powered Suggestions', description: 'Get intelligent suggestions to expand your mind maps and spark creativity.' },
  { icon: PenTool, title: 'Essay Writing Made Easy', description: 'Craft detailed essays and develop your ideas effortlessly with our versatile write feature.' },
]

const testimonials = [
  {
    name: 'Mandika Swartz',
    role: 'Co-founder, Halo Medical Solutions',
    content: 'IdeaVine has revolutionized our brainstorming sessions. It\'s intuitive, powerful, and the AI suggestions are spot-on!',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    name: 'Calix Huang',
    role: 'Entrepreneur (YC W23)',
    content: 'As a visual thinker, IdeaVine is a game-changer. It helps me organize my thoughts in a way that makes sense to me and my team.',
    avatar: '/placeholder.svg?height=40&width=40',
  },
  {
    name: 'Tanush Agrawal',
    role: 'Creative Writer, USC',
    content: 'The voice recording feature is perfect for capturing ideas on the go. IdeaVine has become essential for planning my essays.',
    avatar: '/placeholder.svg?height=40&width=40',
  },
]

const faqItems = [
  {
    question: 'What is IdeaVine?',
    answer: 'IdeaVine is an innovative mind mapping tool that helps you visualize, organize, and expand your ideas. It combines intuitive design with voice-enabled mind mapping to AI-powered suggestions to enhance your creative process.',
  },
  {
    question: 'Is IdeaVine just for creatives or writing essays?',
    answer: 'You can use IdeaVine for literally anything - from talking about your day and daily planning to taking notes for a meeting - the possibilities are endless.',
  },
  {
    question: 'Can I collaborate with others on my mind maps?',
    answer: 'Soon! IdeaVine 2.0 will allow you to share your mindmaps and documents, allowing others to collaborate on shared mindmaps, similar to Figma and Google Docs.',
  },
  {
    question: 'Is my data secure?',
    answer: 'We take data security very seriously. All your mind maps and personal information are encrypted using TLS and AES-256 and stored securely. We never share your data with third parties.',
  },
]

// ShootingStar component
// ShootingStar component with trail effect
const ShootingStar: React.FC = () => {
  const randomDelay = Math.random() * 5
  const randomDuration = 1 + Math.random() * 2

  return (
    <motion.div
      className="absolute"
      initial={{ 
        top: `${Math.random() * 100}%`, 
        left: '-5%',
      }}
      animate={{
        top: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
        left: ['105%', '-5%'],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity,
        repeatDelay: Math.random() * 10
      }}
    >
      <motion.div
        className="w-1 h-1 bg-foreground rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute top-0 right-0 w-8 h-1 bg-gradient-to-l from-transparent to-foreground"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, times: [0, 0.5, 1] }}
      />
    </motion.div>
  )
}

const nonSelectableClass = "select-none"

function LandingPageContent() {
  const [email, setEmail] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const controls = useAnimation()
  const [_, inView] = useInView()
  const [activeTab, setActiveTab] = useState('mindmap')
  const navigate = useNavigate()
  const { theme } = useTheme()

  const [nodes] = useState(initialNodes)
  const [edges] = useState(initialEdges)
  // const [isLoading, setIsLoading] = useState(false)
  // const { userEmail } = useUserInfo();

  // useEffect(() => {
  //   if (userEmail) {
  //     preFetchMindmaps();
  //   }
  // }, [userEmail]);

  const [starCount, setStarCount] = useState(25)

  // const preFetchMindmaps = async () => {
  //   if (!userEmail) return;

  //   try {
  //     setIsLoading(true);
  //     const response = await fetch(`https://ideavine.onrender.com/users/lookup`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ email: userEmail }),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch user UID");
  //     }

  //     const data = await response.json();
  //     const userUid = data.user._id;

  //     const mindmapsResponse = await fetch(
  //       `https://ideavine.onrender.com/users/${userUid}/mindmaps`,
  //       {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (!mindmapsResponse.ok) {
  //       throw new Error("Failed to fetch mindmaps");
  //     }

  //     const mindmapsData = await mindmapsResponse.json();
  //     const sortedMindmaps = mindmapsData.mindmaps.sort(
  //       (a: { updated_at: string | number | Date }, b: { updated_at: string | number | Date }) => 
  //         new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  //     );

  //     setMindmaps(sortedMindmaps);
  //   } catch (err: any) {
  //     console.error("Error pre-fetching mindmaps:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const openMindmaps = () => {
    navigate(`/mindmap`);
  };


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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setStarCount(10)
      } else {
        setStarCount(25)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  

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
        {/* Add multiple shooting stars */}
        {[...Array(starCount)].map((_, index) => (
          <ShootingStar key={index} />
        ))}
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 bg-background/80 backdrop-blur-sm ${nonSelectableClass}`}>
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
                <Button 
                  size="sm" 
                  className="rounded-full" 
                  onClick={openMindmaps}
                >
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
              <SignedIn>
                  <Button 
                    size="lg" 
                    className={cn("rounded-full", "select-none")}
                    onClick={openMindmaps}
                  >
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button 
                    size="lg" 
                    className={cn("rounded-full", "select-none")}
                    onClick={() => navigate('/auth/sign-in')}
                  >
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignedOut>
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
                <TabsTrigger value="voice" className="bg-secondary">Voice Recording</TabsTrigger>
                <TabsTrigger value="suggestions" className="bg-secondary">AI Suggestions</TabsTrigger>
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
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/placeholder.svg?height=720&width=1280"
                      >
                        <source src="/mindmap-demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </TabsContent>
                  <TabsContent value="suggestions" className="bg-card rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">AI-Powered Suggestions</h3>
                    <p className="mb-4">See how our AI analyzes your mind map and provides relevant suggestions to expand your ideas.</p>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/placeholder.svg?height=720&width=1280"
                      >
                        <source src="/suggest-demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </TabsContent>
                  <TabsContent value="voice" className="bg-card rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Voice Recording</h3>
                    <p className="mb-4">Learn how to capture your ideas on the go with our voice recording feature (It's a long video, please be patient!).</p>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/placeholder.svg?height=720&width=1280"
                      >
                        <source src="/record-demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
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
              <a href="mailto:shubhaya@usc.edu" className="text-muted-foreground hover:text-foreground">Contact</a>
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
