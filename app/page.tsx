"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { HTMLMotionProps } from "framer-motion"
import { ArrowRight, Code, ExternalLink, Github, Linkedin, Mail, Menu, Moon, Sun, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const TypewriterEffect = ({ text, className }: { text: string[]; className?: string }) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isWaiting) {
      timeout = setTimeout(() => {
        setIsWaiting(false)
        setIsDeleting(true)
      }, 2000)
      return () => clearTimeout(timeout)
    }

    if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false)
        setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length)
        return
      }

      timeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1))
      }, 50)
      return () => clearTimeout(timeout)
    }

    const currentText = text[currentIndex]
    if (displayText === currentText) {
      setIsWaiting(true)
      return
    }

    if (displayText.length < currentText.length) {
      timeout = setTimeout(() => {
        setDisplayText((prev) => currentText.slice(0, prev.length + 1))
      }, 100)
    }

    return () => clearTimeout(timeout)
  }, [displayText, currentIndex, isDeleting, isWaiting, text])

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function Portfolio() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Add type for motion components
  type MotionDivProps = HTMLMotionProps<"div">

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      const sections = ["home", "projects", "experience", "awards", "contact"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Projects", href: "#projects" },
    { name: "Experience", href: "#experience" },
    { name: "Awards", href: "#awards" },
    { name: "Contact", href: "#contact" },
  ]

  const projects = [
    {
      title: "Computer Vision Dimension Extraction for Marine Biology",
      description: "Coauthor of doctoral thesis on a program to extract dimensions of marine mammals from just an image.",
      tags: ["Python", "Marine Biology"],
      image: "/porpoise.png",
      github: "#",
      demo: "https://onlinelibrary.wiley.com/doi/10.1111/mms.13083",
    },
    {
      title: "Tic Tac Toe AI",
      description: "Developed an A.I. program that plays Tic-Tac-Toe using Monte-Carlo Tree Search algorithm for a master's course at Carnegie Mellon University: Heinz College.",
      tags: ["Python", "Machine Learning"],
      image: "/tictactoe.png",
      github: "https://github.com/Sheel2007/AI-TicTacToe",
      demo: "#",
    },
    {
      title: "Computer Controlled Electric Vehicle",
      description: "A python program executed on the raspberry pi to send an electric current that will spin the motor of an electric vehicle.",
      tags: ["Python", "Circuitry", "Electricity"],
      image: "/car.png?height=400&width=600",
      github: "https://github.com/Sheel2007/EVCar",
      demo: "https://sheel2007.github.io/EVCar-Website/",
    },
  ]

  const experiences = [
    {
      company: "Stratus Technology Integration Services LLC",
      position: "Senior Frontend Developer",
      period: "Aug 2024 - Present",
      description: [
        "As part of a high school Capstone program, working as a subcontractor of GDIT",
        "Currently working on preparing a database of software security vulnerabilities",
        "Creating graphs to visualize data and trends",
      ],
      technologies: ["Python", "SQL", "Docker", "PostgreSQL"],
    },
    {
      company: "Arjuna Solutions",
      position: "ML Developer",
      period: "June 2022 - Aug 2022",
      description: [
        "Developed multiple machine learning and AI models to refine fundraising strategies for nonprofit organizations, determined optimal donation requests and timing based on diverse datasets",
        "Analyzed varied donor datasets at Arjuna Consulting, uncovering key correlations to guide strategic decision-making",
      ],
      technologies: ["Python", "Machine Learning", "Scikit-learn", "Pandas", "Numpy"],
    },
    {
      company: "SugarLabs",
      position: "Software Developer",
      period: "Jan 2022 - September 2023",
      description: [
        "Contributed to MusicBlocks, an educational platform that introduces children to mathematics and computation through music.",
        "Used TypeScript to implement basic synthesizer support, enabling the playback of individual notes and groups of notes in scales.",
      ],
      technologies: ["TypeScript"],
    },
  ]

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-background text-foreground">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-40 right-1/4 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        {/* Navigation */}
        <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <Code className="h-6 w-6 text-primary" />
              {/* <span className="font-bold text-xl">DevPortfolio</span> */}
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors relative group",
                    activeSection === item.href.substring(1) ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.name}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                      activeSection === item.href.substring(1) ? "w-full" : "",
                    )}
                  ></span>
                </Link>
              ))}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="ml-2 relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-primary/10 scale-0 rounded-full transition-transform duration-300 group-hover:scale-100"></span>
                {mounted && theme === "dark" ? (
                  <Sun className="h-5 w-5 relative z-10" />
                ) : (
                  <Moon className="h-5 w-5 relative z-10" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </nav>

            {/* Mobile Navigation Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary py-2",
                      activeSection === item.href.substring(1) ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </header>

        {/* Hero Section */}
        <section id="home" className="min-h-screen relative flex flex-col justify-center pt-20 pb-16">
          <div className="container mx-auto px-4 flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                {/* <div className="inline-block mb-4 px-4 py-2 bg-primary/10 text-primary rounded-full">
                  <span className="text-sm font-medium">Full Stack Developer</span>
                </div> */}
                <div className="mb-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">Hi, I'm</h1>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary h-[1.2em] flex items-center">
                    <TypewriterEffect 
                      text={[
                        "Sheel Shah",
                        "a teenager",
                        "a Programmer",
                        "an Engineer",
                        "a Visionary",
                        "a Leader"
                      ]} 
                      className="inline-block" 
                    />
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground mb-8">
                  I'm a teenage tech enthusiast with a passion for artificial intelligence and computer science.
                </p>
                <div className="flex flex-wrap gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      y: [0, -4, 0],
                      rotate: [0, -1, 1, -1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <Button asChild className="group relative overflow-hidden">
                      <Link href="#projects">
                        <span className="absolute inset-0 w-full h-0 bg-white/20 transition-all duration-300 group-hover:h-full"></span>
                        <span className="relative z-10 flex items-center">
                          View Projects
                          <motion.span
                            className="ml-2 inline-block"
                            animate={{ x: [0, 4, 0] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </motion.span>
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                  <Button variant="outline" asChild className="group relative overflow-hidden">
                    <Link href="#contact">
                      <span className="absolute inset-0 w-0 bg-primary/10 transition-all duration-300 group-hover:w-full"></span>
                      <span className="relative z-10">Contact Me</span>
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 flex justify-center"
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-primary/20 transition-all duration-300"
                >
                  <div className="absolute inset-0">
                    <img
                      src="/me.png"
                      alt="Sheel Shah"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          <motion.div
            className="absolute inset-x-0 bottom-8 flex flex-col items-center text-muted-foreground md:block cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Number.POSITIVE_INFINITY }}
            onClick={() => {
              document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm mb-2">Scroll Down</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce">
                <path
                  d="M12 5V19M12 19L19 12M12 19L5 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-16 md:py-24 bg-muted/30 relative">
          <div className="absolute top-20 left-10 w-20 h-20 border border-primary/20 rounded-lg rotate-12 opacity-50 hidden lg:block"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 border border-primary/20 rounded-full opacity-50 hidden lg:block"></div>
          <motion.div
            className="absolute top-40 right-20 w-10 h-10 bg-primary/10 rounded-full opacity-70 hidden lg:block"
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5, ease: "easeInOut" }}
          ></motion.div>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">My Projects</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A collection of my recent work. Each project represents a unique challenge and solution.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ margin: "-100px" }}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                  className="bg-card rounded-xl overflow-hidden border shadow-sm group hover:shadow-md transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      {project.github !== "#" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          asChild
                          className="scale-90 hover:scale-100 transition-transform duration-200"
                        >
                          <a href={project.github} target="_blank" rel="noopener noreferrer">
                            <Github className="mr-2 h-4 w-4" /> Code
                          </a>
                        </Button>
                      )}
                      {project.demo !== "#" && (
                        <Button size="sm" asChild className="scale-90 hover:scale-100 transition-transform duration-200">
                          <a href={project.demo} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Demo
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full transition-transform duration-200 hover:scale-105 hover:bg-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Work Experience</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                My professional journey and the companies I've had the pleasure to work with.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.company}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ margin: "-100px" }}
                  className="mb-12 relative pl-8 border-l-2 border-primary/30 last:mb-0"
                >
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
                  <div className="mb-1 text-sm text-muted-foreground">{exp.period}</div>
                  <h3 className="text-xl font-bold mb-1">{exp.position}</h3>
                  <div className="text-lg text-primary mb-3">{exp.company}</div>
                  <ul className="mb-4 text-muted-foreground list-disc pl-4 space-y-2">
                    {exp.description.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-muted text-xs rounded-full">
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Awards Section */}
        <section id="awards" className="py-16 md:py-24 bg-muted/30 relative">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Awards & Recognition</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Notable achievements and acknowledgments from my journey.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ margin: "-100px" }}
                className="relative"
              >
                <div className="bg-card rounded-lg border p-6 transition-all duration-300 hover:border-primary/50">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">Speaker at PyCon, an international conference</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">May 2024</span>
                          <a
                            href="https://github.com/1bMedina/NASA_ADC"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                          >
                            <span>View Project</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      <ul className="mb-4 text-muted-foreground list-disc pl-4 space-y-2">
                        <li>Developed a 3D visualization of the moon's dark side using advanced data processing techniques</li>
                        <li>Converted raw terrain data (latitude and longitude) into Cartesian coordinates and PNG formats</li>
                        <li>Integrated the visualization with the Ursina game engine for dynamic rendering</li>
                        <li>Presented the project at PyCon 2024 to a professional audience of Python developers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ margin: "-100px" }}
                className="relative"
              >
                <div className="bg-card rounded-lg border p-6 transition-all duration-300 hover:border-primary/50">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M12 17.8 5.8 21 7 14.1 2 9.3l7-1L12 2" />
                          <path d="m12 17.8 6.2 3.2-1.2-6.9 5-4.8-7-1L12 2" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">Feature an article by the Arlington Magazine</h3>
                        <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">December 2022</span>
                        <a
                            href="https://www.arlingtonmagazine.com/arlington-tech-high-school-aps/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                          >
                            <span>View Article</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                      </div>
                      <ul className="mb-4 text-muted-foreground list-disc pl-4 space-y-2">
                        <li>Selected from a pool of 135 students in the grade to be featured in local magazine</li>
                        <li>Featured in an article titled "What Exactly is Arlington Tech" by the Arlington Magazine</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ margin: "-100px" }}
                className="relative"
              >
                <div className="bg-card rounded-lg border p-6 transition-all duration-300 hover:border-primary/50">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M8.4 19A3.4 3.4 0 0 1 5 15.6V8.4A3.4 3.4 0 0 1 8.4 5h7.2A3.4 3.4 0 0 1 19 8.4v7.2a3.4 3.4 0 0 1-3.4 3.4Z" />
                          <path d="M10 12a2 2 0 1 1 4 0v4" />
                          <path d="M14 12a2 2 0 1 1 4 0v4" />
                          <path d="M10 12v4" />
                          <path d="M6 12v4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">Speaker at National Conference</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">October 2024</span>
                          <a
                            href="https://www.setda.org/about/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                          >
                            <span>View Website</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      <ul className="mb-4 text-muted-foreground list-disc pl-4 space-y-2">
                        <li>Selected to speak at SETDA Leadership Summit and Ed Forum for education leaders</li>
                        <li>Featured on a student panel discussing the importance of technology in education</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ margin: "-100px" }}
                className="relative"
              >
                <div className="bg-card rounded-lg border p-6 transition-all duration-300 hover:border-primary/50">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">Certification in Web Design and Development</h3>
                        <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">May 2023</span>
                      </div>
                      <ul className="mb-4 text-muted-foreground list-disc pl-4 space-y-2">
                        <li>Passed the CIW Advanced HTML5 and CSS3 Specialist exam to become a certified web designer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Have a project in mind or want to discuss potential opportunities? Feel free to reach out!
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ margin: "-100px" }}
                >
                  <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 group hover:bg-card p-2 rounded-lg transition-all duration-300">
                      <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                        <Mail className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-muted-foreground">Email</div>
                        <a
                          href="mailto:sheelshah030@gmail.com"
                          className="hover:text-primary transition-colors group-hover:font-medium truncate block"
                        >
                          sheelshah030@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 group hover:bg-card p-2 rounded-lg transition-all duration-300">
                      <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                        <Linkedin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-muted-foreground">LinkedIn</div>
                        <a
                          href="https://www.linkedin.com/in/sheelshah2007"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors group-hover:font-medium truncate block"
                        >
                          linkedin.com/in/sheelshah2007
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 group hover:bg-card p-2 rounded-lg transition-all duration-300">
                      <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                        <Github className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-muted-foreground">GitHub</div>
                        <a
                          href="https://github.com/Sheel2007"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors group-hover:font-medium truncate block"
                        >
                          github.com/Sheel2007
                        </a>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{
                        scale: 1.05,
                        y: -4,
                        rotate: [0, -1, 1, -1, 0],
                        transition: {
                          duration: 0.3
                        }
                      }}
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 0 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-4"
                    >
                      <Button
                        asChild
                        className="relative overflow-hidden group w-full"
                      >
                        <a
                          href="/Resume.pdf"
                          download="Sheel_Shah_Resume.pdf"
                          className="inline-flex items-center justify-center gap-2 w-full"
                        >
                          <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="group-hover:translate-y-[2px] transition-transform duration-300"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download Resume
                          </span>
                        </a>
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ margin: "-100px" }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>

                  <motion.div
                    whileHover={{
                      scale: 1.05,
                      y: -4,
                      rotate: [0, -1, 1, -1, 0],
                      transition: {
                        duration: 0.3,
                        rotate: {
                          duration: 0.5,
                          repeat: 0
                        }
                      }
                    }}
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 0 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button type="submit" className="w-full relative overflow-hidden group">
                      <span className="absolute inset-0 w-full h-0 bg-white/20 transition-all duration-300 group-hover:h-full"></span>
                      <span className="relative z-10">Send Message</span>
                    </Button>
                  </motion.div>
                </motion.form>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        {/* <footer className="py-8 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <Code className="h-5 w-5 text-primary" />
                <span className="font-bold">DevPortfolio</span>
              </div>

              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Your Name. All rights reserved.
              </div>

              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Email</span>
                </a>
              </div>
            </div>
          </div>
        </footer> */}
      </div>
    </ThemeProvider>
  )
}
