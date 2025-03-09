// LandingPage.tsx

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Link as ScrollLink, Element } from 'react-scroll'
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Input } from "@/components/ui/input"
import { Leaf, ChevronRight, Check } from 'lucide-react'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { useInView } from 'react-intersection-observer'
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

// const features = [
//   { icon: Brain, title: 'Intuitive Mind Mapping', description: 'Create and organize your ideas visually with our easy-to-use interface.' },
//   { icon: Mic, title: 'Voice Recording', description: 'Capture your thoughts on the go with built-in voice recording functionality.' },
//   { icon: Zap, title: 'AI-Powered Suggestions', description: 'Get intelligent suggestions to expand your mind maps and spark creativity.' },
//   { icon: PenTool, title: 'Essay Writing Made Easy', description: 'Craft detailed essays and develop your ideas effortlessly with our versatile write feature.' },
// ]

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
  const navigate = useNavigate()
  const { theme } = useTheme()

  const [nodes] = useState(initialNodes)
  const [edges] = useState(initialEdges)

  const [starCount, setStarCount] = useState(25)

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

  const DemoSection = () => {
    const [activeTab, setActiveTab] = useState(0);
    const scrollRef = useRef(null);
    const options = [
      { 
        title: "Speak your thoughts, let IdeaVine capture them",
        description: "Voice-enabled Mindmapping. Ramble on, spitballing all your ideas off the top of your head. IdeaVine supports 99+ languages.",
        video: "/mindmap-demo.mp4"
      },
      {
        title: "Upload PDFs, Videos, and more",
        description: "Import content from various sources. IdeaVine analyzes PDFs, videos, images, and documents, transforming them into structured mind maps.",
        video: "/suggest-demo.mp4"
      },
      {
        title: "Share your mindmaps and collborate",
        description: "Work together in real-time, just like in Figma or Google Docs. Share your mind maps with teammates, get feedback, and collaborate on ideas.",
        video: "/record-demo.mp4"
      }
    ];
  
    return (
      <Element name="demo" ref={scrollRef}>
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold mb-4">Think visually. Think brilliantly.</h2>
                  <p className="text-lg text-muted-foreground">
                    Automated collaborative multi-modal mindmapping — freeing you to focus on your ideas.
                  </p>
                </div>
                <div className="space-y-4">
                  {options.map((option, index) => (
                    <motion.div
                      key={index}
                      className={`p-6 rounded-lg cursor-pointer ${
                        activeTab === index ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                      }`}
                      initial={false}
                      animate={{
                        scale: activeTab === index ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setActiveTab(index)}
                    >
                      <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                      <p className="text-muted-foreground">{option.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden mt-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      key={options[activeTab].video}
                    >
                      <source src={options[activeTab].video} type="video/mp4" />
                    </video>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </Element>
    );
  };
  
  const CompanyCarousel = () => {
    const companies = [
      "University of Southern California",
      "UC Berkeley",
      "UCLA",
      "Microsoft",
      "Amazon",
      "Qualcomm",
    ];
  
    // Duplicate the array to create seamless loop
    const duplicatedCompanies = [...companies, ...companies, ...companies];
  
    return (
      <div className="w-full py-8 bg-transparent backdrop-blur-xl">
        <div className="container mx-auto">
          <p className="text-center text-md text-muted-foreground mb-10">
            USED BY PEOPLE AT
          </p>
          <div className="relative overflow-hidden">
            {/* Left Gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            
            <motion.div
              className="flex whitespace-nowrap gap-8"
              animate={{
                x: ["0%", "-50%"]
              }}
              transition={{
                x: {
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            >
              {duplicatedCompanies.map((company, index) => (
                <span
                  key={`${company}-${index}`}
                  className="inline-block text-lg font-medium px-4"
                >
                  {company}
                </span>
              ))}
            </motion.div>
            
            {/* Right Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          </div>
        </div>
      </div>
    );
  };

  const PricingSection = () => {
    const plans = [
      {
        name: "Starter",
        description: "For individuals just getting started—no credit card needed",
        price: "Free",
        features: [
          "Up to 10 mindmaps",
          "Voice recording to mindmap nodes",
          "AI-powered suggestions",
        ],
        included: true,
        buttonText: "Get Started",
        buttonVariant: "outline" as const,
      },
      {
        name: "Plus",
        description: "Unlock the full capabilities of IdeaVine",
        price: "$10",
        features: [
          "Unlimited mindmaps",
          "Voice recording to mindmap nodes",
          "AI-powered suggestions",
          "Share mindmaps with other IdeaVine users",
          "Upload files (PDFs, videos, images and more) up to 100MB",
        ],
        included: false,
        buttonText: "Get Started",
        buttonVariant: "default" as const,
      }
    ];
  
    return (
      <Element name="pricing">
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h2>
            </div>
            
            <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-2">
              {plans.map((plan) => (
                <div 
                  key={plan.name}
                  className="relative rounded-2xl bg-card p-8 shadow-sm ring-1 ring-muted hover:ring-primary transition-all duration-200 flex flex-col"
                >
                  {/* Card Content */}
                  <div className="flex-grow">
                    <h3 className="text-2xl font-semibold leading-7">{plan.name}</h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Free" && <span className="text-sm font-semibold leading-6">/month</span>}
                    </p>
                    
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <Check className={`h-6 w-5 flex-none ${plan.included ? 'text-muted-foreground' : 'text-emerald-500'}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
  
                  {/* Button Section - Always at bottom */}
                  <div className="mt-8">
                    <Button
                      variant={plan.buttonVariant}
                      size="lg"
                      className="w-full rounded-full"
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Element>
    );
  };

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
                {/* <ScrollLink
                  to="features"
                  smooth={true}
                  duration={500}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Features
                </ScrollLink> */}
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
                  to="pricing"
                  smooth={true}
                  duration={500}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Pricing
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

      <CompanyCarousel />

      {/* Features Section */}
      {/* <Element name="features">
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
      </Element> */}

      {/* Demo Section */}
      <DemoSection />

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

      {/* Pricing Section */}
      <PricingSection />

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
