export type Link = { label: string; href: string }

export type Project = {
  slug: string
  number: number
  title: string
  year: string
  blurb: string
  stack: string[]
  links: Link[]
  image?: string
  // Position in the lineup, and the name printed on the back of the shirt.
  position?: string
  shirt?: string
  // Spot on the field in meters from the center spot. x runs goal to goal (we attack +x), z is touchline to touchline.
  spot?: [number, number]
}

export const starters: Project[] = [
  {
    slug: "orbitterp",
    number: 10,
    title: "OrbitTerp",
    year: "2026",
    blurb:
      "A schedule builder for University of Maryland students. You pick your courses, block off the times you're busy and choose what matters most, like professor ratings or gaps between classes. It searches the possible schedules and gives back the best ones, ready to export to your calendar.",
    stack: ["React", "TypeScript", "FastAPI", "Qiskit"],
    links: [{ label: "Code", href: "https://github.com/Sheel2007/OrbitTerp" }],
    position: "Attacking midfield",
    shirt: "ORBITTERP",
    spot: [-6, -1],
  },
  {
    slug: "ev-car",
    number: 9,
    title: "Autonomous EV, phase 1",
    year: "2024–25",
    blurb:
      "A Raspberry Pi that drives a real electric car, built with a partner at Arlington Career Center for Switch Labs. The Pi sends a controlled voltage through an MCP4725 DAC in place of the gas pedal, runs off the car's 12 V battery and has a touchscreen control panel. It drives forward and backward with nobody in it, won multiple trophies and $10,000 in competitions, and got us on live TV. Braking, steering and computer vision are the next three phases.",
    stack: ["Python", "Raspberry Pi", "I²C", "tkinter", "Circuits"],
    links: [
      { label: "Code", href: "https://github.com/Sheel2007/EVCar" },
      { label: "Project site", href: "https://sheel2007.github.io/EVCar-Website/" },
    ],
    image: "/car.png",
    position: "Striker",
    shirt: "EV CAR",
    spot: [9, 3],
  },
  {
    slug: "aegis-orbit",
    number: 7,
    title: "Aegis Orbit",
    year: "2026",
    blurb:
      "A hackathon project with friends that predicts when satellites might hit space debris and plans how to move them out of the way. I worked on the data side: pulling CelesTrak data for more than 18,000 tracked objects, cleaning it, and training an XGBoost model that flags the most dangerous ones. Every flag gets checked against the real physics.",
    stack: ["Python", "XGBoost", "FastAPI", "React", "CesiumJS"],
    links: [{ label: "Code", href: "https://github.com/KingXaney/Aegis-Orbit-" }],
    position: "Right wing",
    shirt: "AEGIS",
    spot: [-14, 19],
  },
  {
    slug: "world-cup",
    number: 8,
    title: "World Cup Predictor",
    year: "2026",
    blurb:
      "Simulates the 2026 World Cup from the group stage to the final, trained on more than 8,000 international matches. I tested a classical XGBoost model against a quantum one on 987 games neither had seen. XGBoost called 57.5% of them right and the quantum model 42.5%.",
    stack: ["Python", "XGBoost", "scikit-learn", "pandas", "Qiskit"],
    links: [{ label: "Code", href: "https://github.com/Sheel2007/World-Cup" }],
    position: "Left midfield",
    shirt: "WORLD CUP",
    spot: [-17, -18],
  },
  {
    slug: "home-board",
    number: 6,
    title: "Home Board",
    year: "2026",
    blurb:
      "The screen on our apartment wall. A Raspberry Pi touchscreen with our shared Google Calendar, live scores for the teams we follow, the ceiling lights, a grocery list you can add to from your phone, and a few games for when someone is bored.",
    stack: ["Python", "JavaScript", "Raspberry Pi", "Zigbee"],
    links: [{ label: "Code", href: "https://github.com/Sheel2007/OMEGA-WB" }],
    position: "Center back",
    shirt: "HOME BOARD",
    spot: [-32, 10],
  },
  {
    slug: "launcher",
    number: 4,
    title: "Object-tracking launcher",
    year: "2024",
    blurb:
      "A self-aiming ping-pong ball launcher. It runs YOLO object detection and combines depth, color and motion data to follow a target, moves its servos in real time and fires using pressurized oxygen.",
    stack: ["Python", "YOLO", "Computer vision", "Circuits"],
    links: [{ label: "Code", href: "https://github.com/Sheel2007/PingPong-Launcher" }],
    image: "/launcher-sm.jpg",
    position: "Center back",
    shirt: "LAUNCHER",
    spot: [-32, -10],
  },
  {
    slug: "research",
    number: 1,
    title: "Measuring marine mammals from photos",
    year: "2023",
    blurb:
      "Co-author on a doctoral thesis about a program that works out the size of marine mammals from a single image. Published in Marine Mammal Science.",
    stack: ["Python", "Computer vision", "Research"],
    links: [{ label: "Paper", href: "https://onlinelibrary.wiley.com/doi/10.1111/mms.13083" }],
    image: "/porpoise.png",
    position: "Goalkeeper",
    shirt: "RESEARCH",
    spot: [-47, 0],
  },
]

export const bench: Project[] = [
  {
    slug: "tic-tac-toe",
    number: 12,
    title: "Tic-Tac-Toe AI",
    year: "2023",
    blurb: "A Monte Carlo Tree Search agent, built for a master's course at Carnegie Mellon's Heinz College.",
    stack: ["Python", "Algorithms"],
    links: [{ label: "Code", href: "https://github.com/Sheel2007/AI-TicTacToe" }],
  },
]

export const career = [
  {
    period: "Jun – Aug 2026",
    club: "AstraZeneca",
    role: "AI Strategy & Innovation Intern",
    note: "Built a department-wide internal tool in Python with Dash that benchmarks how well different AI tools find relevant research publications for a given set of criteria.",
  },
  {
    period: "Jun – Aug 2025",
    club: "Denver Ventures",
    role: "IR & Marketing Intern",
    note: "Researched and presented market and competitive analysis across the technology sector, and supported due diligence on early-stage startups.",
  },
  {
    period: "Aug 2024 – May 2025",
    club: "Stratus Technology Integration Services",
    role: "Database Intern",
    note: "High school capstone as a subcontractor to General Dynamics IT. Collected software vulnerability data with SQL and visualized it to find trends.",
  },
  {
    period: "Jun – Aug 2022",
    club: "Arjuna Solutions",
    role: "ML Developer",
    note: "Built models that helped nonprofits decide how much to ask donors for and when, using donor datasets.",
  },
  {
    period: "Jan 2022 – Sep 2023",
    club: "Sugar Labs",
    role: "Open-source contributor",
    note: "Added synthesizer support to Music Blocks, a music-and-math platform for kids, so it can play single notes and scales.",
  },
]

export const honors = [
  {
    date: "2026",
    title: "Featured on live TV for the Switch Labs electric car",
    detail:
      "Interviewed by WUSA9, WTOP, Fox 5 and NBC4 at the opening of the Grace Hopper Center. The car won multiple trophies and $10,000 in competitions.",
    link: {
      label: "WUSA9 clip",
      href: "https://www.wusa9.com/video/news/education/new-grace-hopper-center-in-arlington-focuses-on-career-technical-education/65-b860b776-39aa-4d0c-9d23-1965509d379a",
    },
  },
  {
    date: "2026",
    title: "Featured in an Arlington Historical Society exhibit",
    detail: "Interviewed for the museum's exhibit about Arlington Tech and the work students did there.",
    link: { label: "Interview", href: "https://arlhist.org/sheel-shah/" },
  },
  {
    date: "2025",
    title: "Co-organizer, Arlington County's first programming contest",
    detail: "Nine months of planning for a contest for middle and high school students that drew more than 50 competitors.",
    link: { label: "Contest site", href: "https://aps-hspc.pages.dev" },
  },
  {
    date: "Oct 2024",
    title: "Speaker, SETDA Leadership Summit",
    detail: "Student panel on technology in education at a national conference for education leaders.",
    link: { label: "SETDA", href: "https://www.setda.org/about/" },
  },
  {
    date: "May 2024",
    title: "Speaker, PyCon US",
    detail: "Presented a 3D visualization of lunar terrain built from NASA data with the Ursina engine.",
    link: { label: "Project", href: "https://github.com/1bMedina/NASA_ADC" },
  },
  {
    date: "Dec 2022",
    title: "Featured in Arlington Magazine",
    detail: "One of 135 students in my grade chosen for a feature on Arlington Tech.",
    link: { label: "Article", href: "https://www.arlingtonmagazine.com/arlington-tech-high-school-aps/" },
  },
]
