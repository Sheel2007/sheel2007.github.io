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
      const sections = ["home", "projects", "experience", "skills", "contact"]
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
    { name: "Skills", href: "#skills" },
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

  const skills = [
    { name: "JavaScript", level: 90 },
    { name: "React", level: 85 },
    { name: "TypeScript", level: 80 },
    { name: "Node.js", level: 75 },
    { name: "Next.js", level: 85 },
    { name: "CSS/Tailwind", level: 90 },
    { name: "GraphQL", level: 70 },
    { name: "AWS", level: 65 },
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
            className="absolute left-1/2 -translate-x-1/2 bottom-12 flex flex-col items-center text-muted-foreground hidden md:flex cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Number.POSITIVE_INFINITY }}
            onClick={() => {
              document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="text-sm mb-2">Scroll Down</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 5V19M12 19L19 12M12 19L5 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
              viewport={{ once: true, margin: "-100px" }}
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
                  viewport={{ once: true, margin: "-100px" }}
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
              viewport={{ once: true, margin: "-100px" }}
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
                  viewport={{ once: true, margin: "-100px" }}
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

        {/* Skills Section */}
        <section id="skills" className="py-16 md:py-24 bg-muted/30 relative">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Technologies and tools I've worked with and mastered over the years.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    transition: { duration: 0.2 },
                  }}
                  className="p-4 bg-card rounded-lg border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="flex justify-between mb-2">
                    <motion.span
                      className="font-medium"
                      whileHover={{ color: "var(--primary)", x: 2, transition: { duration: 0.2 } }}
                    >
                      {skill.name}
                    </motion.span>
                    <span className="text-primary">{skill.level}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="h-full bg-primary rounded-full relative"
                    >
                      <motion.span
                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/80 to-primary"
                        animate={{
                          x: ["-100%", "100%"],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 2,
                          ease: "linear",
                        }}
                      ></motion.span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
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
              viewport={{ once: true, margin: "-100px" }}
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
                  viewport={{ once: true, margin: "-100px" }}
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
                  </div>
                </motion.div>

                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: "-100px" }}
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

                  <Button type="submit" className="w-full relative overflow-hidden group">
                    <span className="absolute inset-0 w-full h-0 bg-white/20 transition-all duration-300 group-hover:h-full"></span>
                    <span className="relative z-10">Send Message</span>
                  </Button>
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
