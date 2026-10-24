// Every word on the site lives here, separated from presentation.
// Sources: Franklin's CVs (the October 2026 "v2" CV wins where versions disagree), his previous
// website and its media, his public GitHub repositories, and his own corrections (Oct 2026):
//   - crop spraying was done at both Kundungu and Asamankese
//   - the white flying-wing VTOL is his undergraduate research group's work
//   - SKT Aero was renamed SKT Live
//   - the Salis Global review is not shown
// Nothing is invented. Items still needing confirmation are marked `// CONFIRM`.

export const person = {
  name: "Franklin Ferguson",
  fullName: "Franklin Yesutor Ferguson",
  role: "Aerospace engineer",
  tagline: "UAV systems · Aerial survey · Data Analysis",
  lead: "I engineer and operate UAVs, transforming aerial intelligence into high-precision maps, 3D models, and data-driven solutions.",
  now: "Co-leading UAS and aerostat operations at Newmont’s Ahafo South Mine",
  email: "franklinfergusonofficial@gmail.com",
  phone: "+233 551 455 440",
  phoneHref: "tel:+233551455440",
  location: "Accra, Ghana",
  github: "https://github.com/Franklin-ferguson",
  cv: "docs/Franklin_Ferguson_CV.pdf",
  linkedin: "https://www.linkedin.com/in/franklin-ferguson-6b5319178/",
};

export const nav = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "expertise", label: "Expertise" },
  { id: "experience", label: "Experience" },
  { id: "research", label: "Research" },
  { id: "contact", label: "Contact" },
];

export const about = {
  title: "Engineer in the workshop, pilot in the field, analyst at the desk.",
  paragraphs: [
    "I trained as an aerospace engineer at KNUST, where I graduated with first-class honours after designing and flying a VTOL surveillance aircraft with my research group. Since then I have worked across the whole life of an unmanned aircraft: designing payloads, planning and flying survey and spraying missions, maintaining airframes between sorties, and reading the flight logs when something goes wrong.",
    "Most of that work happened in small teams, which taught me to carry a project from the drawing board to the client. I co-founded Wingxtra Aerospace and ran it as COO, led research and national survey campaigns at SKT Live, and now co-lead the crew that flies the UAVs and tethered aerostat at Newmont’s Ahafo South Mine.",
  ],
};

export const figures = [
  {
    value: "3,412",
    unit: "ha",
    label: "surveyed for Ghana Eximbank across 140 farms in twelve regions",
  },
  {
    value: "1,000",
    unit: "ha",
    label: "of cadastral mapping at Dedekebe, flown on a fixed-wing VTOL",
  },
  {
    value: "10",
    unit: "modules",
    label: "in the UAV operator programme I wrote for the mine crew",
  },
  {
    value: "3×",
    unit: "",
    label: "Provost Award winner, KNUST College of Engineering",
  },
];

export const principles = [
  {
    title: "Safety first",
    body: "Procedures, risk assessments and failsafe checks come before any flight.",
  },
  {
    title: "Data you can audit",
    body: "Every project is built on precise data, rigorous quality checks, and reliable results you can trust.",
  },
  {
    title: "Hand over properly",
    body: "Every system I set up comes with a manual and the training to run it.",
  },
];

// ---------------------------------------------------------------------------------------------
// Media. Rows are laid out at a common height with widths in proportion to each item's own
// aspect ratio, so portrait and landscape pictures keep their orientation and are never cropped.

export type Media =
  | { kind: "photo"; src: string; alt: string; caption?: string }
  | {
      kind: "video";
      src: string;
      poster: string;
      alt: string;
      caption?: string;
    };

export type Row = { items: Media[]; maxWidth?: number };

export type DiagramVariant =
  | "routes"
  | "pipeline"
  | "investigation"
  | "parcels";

export interface Story {
  id: string;
  title: string;
  org: string;
  place: string;
  year: string;
  role: string;
  lead: string;
  challenge: string;
  did: string[];
  outcome: string;
  tools: string[];
  rows: Row[];
  links?: { label: string; href: string }[];
}

/** The three projects told in full, each with its own photographs and video. */
export const stories: Story[] = [
  {
    id: "seed-dispersal",
    title: "Sowing forests from the air",
    org: "SKT Live with UNDP",
    place: "Mauritania",
    year: "2023–25", // CONFIRM: the trial year, if a single year is preferred
    role: "R&D lead",
    lead: "A seed-dispersal payload for a heavy-lift spraying drone, designed in our workshop and taken to field trials for a UNDP afforestation initiative.",
    challenge:
      "Planting by hand is slow and cannot reach hillsides or badly degraded land. We set out to find whether an agricultural spraying drone could sow seed instead, accurately enough to be useful.",
    did: [
      "Designed and built a modular dispersal unit that fits the TT Aviation 30L in place of its spray tank.",
      "Built the Arduino-timed release mechanism that meters seed out along the flight path.",
      "Wrote the autonomous flight plans and the seed-release protocol.",
      "Ran field trials on dispersal efficiency, stability under a changing payload and performance over uneven terrain, then fed the results back into the design.",
    ],
    outcome:
      "A working payload trialled in Mauritania with UNDP, with the design and results documented in a public project overview.",
    tools: [
      "SolidWorks",
      "Fusion 360",
      "3D printing",
      "Arduino",
      "Mission Planner",
      "TT Aviation 30L",
    ],
    rows: [
      {
        items: [
          {
            kind: "photo",
            src: "mauritania-field",
            alt: "Two people preparing a large multirotor drone on a flat desert plain",
            caption: "Preparing the aircraft for a trial flight in Mauritania.",
          },
        ],
      },
      {
        items: [
          {
            kind: "video",
            src: "seed-module",
            poster: "poster-seed-module",
            alt: "CAD model of the seed-dispersal module rotating and separating into its parts",
            caption: "The dispersal module in CAD.",
          },
          {
            kind: "photo",
            src: "mauritania-team",
            alt: "Trial participants standing behind a multirotor drone beside a UNDP banner",
            caption: "The trial team.",
          },
          {
            kind: "photo",
            src: "code-laptop",
            alt: "Laptop showing Arduino code and serial-monitor output for the release servo",
            caption: "Release timing in the Arduino serial monitor.",
          },
        ],
      },
    ],
    links: [
      {
        label: "Project overview on GitHub",
        href: "https://github.com/Franklin-ferguson/UNDP-SEED-DISPERSAL-DRONE",
      },
    ],
  },
  {
    id: "crop-spraying",
    title: "Precision spraying at Kundungu and Asamankese",
    org: "SKT Live",
    place: "Kundungu and Asamankese, Ghana",
    year: "2023–25",
    role: "Field operations and aircraft support",
    lead: "Drone application of agrochemicals across large farms at two sites, from route planning to keeping the aircraft flying between sorties.",
    challenge:
      "Large farms need chemicals applied evenly and quickly, without crews walking every row with knapsack sprayers.",
    did: [
      "Ran spraying operations on large-scale farmland at Kundungu and at Asamankese.",
      "Mapped field boundaries and planned spray routes on the ground station.",
      "Configured, tested and maintained the spraying aircraft between sorties.",
      "Trained farmers who bought drones to fly them safely.",
    ],
    outcome:
      "Faster, more even coverage than manual application, and operators able to continue the work themselves.",
    tools: [
      "Agricultural spraying multirotors",
      "Ground-station route planning",
      "Field maintenance",
      "Operator training",
    ],
    rows: [
      {
        items: [
          {
            kind: "video",
            src: "kundungu",
            poster: "poster-kundungu",
            alt: "A spraying day at Kundungu: loading chemicals, aircraft on the field, the route on a tablet and drones in flight",
            caption: "A spraying day at Kundungu.",
          },
          {
            kind: "video",
            src: "asamankese",
            poster: "poster-asamankese",
            alt: "A spraying drone flying low over a green rice field",
            caption: "Spraying a rice field at Asamankese.",
          },
          {
            kind: "photo",
            src: "spray-operator",
            alt: "An operator standing on a ploughed field holding a drone controller",
            caption: "Flying from the field edge.",
          },
        ],
      },
      {
        maxWidth: 1080,
        items: [
          {
            kind: "photo",
            src: "spray-fleet",
            alt: "Two spraying multirotors parked on ploughed ground under a large tree",
            caption: "Two aircraft ready for the next sortie.",
          },
          {
            kind: "photo",
            src: "mission-tablet",
            alt: "A ground-station tablet held up over a field, showing the field boundary and spray route",
            caption: "The field boundary on the ground station.",
          },
          {
            kind: "photo",
            src: "spray-drone-hover",
            alt: "A spraying multirotor hovering above a field with trees behind",
            caption: "Spraying in progress.",
          },
          {
            kind: "photo",
            src: "field-base",
            alt: "A field base with batteries and charging equipment laid out on a sheet",
            caption: "The field base: batteries and chargers.",
          },
        ],
      },
    ],
  },
  {
    id: "eximbank",
    title: "140 farms in twelve regions",
    org: "SKT Live (then SKT Aero) for Ghana Eximbank",
    place: "Nationwide, Ghana",
    year: "2023–25",
    role: "Campaign lead",
    lead: "A nationwide multi-sensor survey that gave a development bank independent evidence on the farms behind its agricultural loans.",
    challenge:
      "Ghana Eximbank needed comparable, independent evidence of crop health and expected yield for farms spread across the whole country.",
    did: [
      "Led the survey campaign across 140 farms in twelve regions.",
      "Captured RGB, multispectral, thermal and LiDAR data with matched sensor set-ups.",
      "Processed the data into orthomosaics and terrain models and analysed crop health and yield.",
    ],
    outcome:
      "About 3,412 hectares surveyed, giving the bank crop-health, yield and investment-risk evidence for its lending decisions.",
    tools: [
      "Fixed-wing VTOL and multirotor UAVs",
      "Multispectral and thermal sensors",
      "LiDAR",
      "Pix4D",
      "Agisoft Metashape",
      "QGIS",
    ],
    rows: [
      {
        items: [
          {
            kind: "photo",
            src: "vtol-assembly",
            alt: "Two engineers fitting the wing to a white fixed-wing VTOL drone beside its transport case",
            caption:
              "Fitting the wing before a flight, SKT Aero (now SKT Live).",
          },
          {
            kind: "video",
            src: "vtol-test",
            poster: "poster-vtol-test",
            alt: "A white fixed-wing VTOL drone flying across a cloudy sky",
            caption: "Fixed-wing VTOL test flight.",
          },
          {
            kind: "photo",
            src: "vtol-field-prep",
            alt: "A crew assembling a white fixed-wing VTOL drone on an open field",
            caption: "Field assembly.",
          },
        ],
      },
      {
        maxWidth: 980,
        items: [
          {
            kind: "photo",
            src: "gexim-field-team",
            alt: "Three members of the survey team on a laterite road beside farmland, one in a high-visibility vest",
            caption: "In the field with the survey team.",
          },
          {
            kind: "photo",
            src: "gexim-farm-map",
            alt: "A farm boundary mapped over satellite imagery in the monitoring and evaluation system, beside the Wa–Tumu road",
            caption: "A surveyed farm boundary in the monitoring system.",
          },
        ],
      },
    ],
  },
];

/** Work at the mine. Where no screens are shown, a diagram explains the method. */
export interface Brief {
  id: string;
  title: string;
  summary: string;
  did: string[];
  outcome: string;
  tools: string[];
  diagram: DiagramVariant;
  caption: string;
  cover?: Media;
  rows?: Row[];
}

export const mine = {
  title: "Operations at Ahafo South",
  intro:
    "At Newmont’s Ahafo South Mine I co-lead the team that flies a hybrid VTOL fixed-wing UAV, multirotors and an RT SkyStar 180 tethered aerostat for survey, inspection and security. Mine data stays on site, so these projects are shown as diagrams of the method.",
  org: "Isen Ventures for Newmont Ghana",
  year: "2026",
  briefs: [
    {
      id: "route-mapping",
      title: "Mapping how illegal miners get in",
      summary:
        "Survey-grade maps of the routes used to enter and leave three active pit areas.",
      did: [
        "Set RTK/PPK ground control with Emlid Reach RS2 receivers and planned the flights.",
        "Flew the surveys and processed the imagery into orthomosaics and terrain models.",
        "Traced the access routes and produced the maps the security teams use.",
      ],
      outcome:
        "Route maps that Newmont Security and the Mobile Response Unit act on.",
      tools: [
        "Emlid Reach RS2",
        "Agisoft Metashape",
        "QGIS",
        "Hybrid VTOL UAV",
      ],
      diagram: "routes",
      caption: "Ground control, flight lines and traced routes, illustrated.",
    },
    {
      id: "security-platform",
      title: "From detection to a single command view",
      summary:
        "A YOLOv8 detection pipeline and a set of small tools feeding one live dashboard.",
      did: [
        "Built a YOLOv8 pipeline that flags encroachment and illegal-mining activity in aerostat and UAV imagery.",
        "Built the Power BI command dashboard for detections, patrols, incidents and KPIs.",
        "Built a Power App for flight hours, maintenance, downtime and helium top-ups.",
        "Replaced paper inspection checklists with a web app that writes, sends and archives PDF reports.",
      ],
      outcome:
        "One live picture of detections, patrols, incidents and aircraft status, refreshed automatically.",
      tools: [
        "Python",
        "YOLOv8",
        "OpenCV",
        "Power BI",
        "Power Apps",
        "Node.js",
        "Puppeteer",
      ],
      diagram: "pipeline",
      caption: "How the pieces connect.",
    },
    {
      id: "flight-test",
      title: "Investigating a VTOL flight-test incident",
      summary:
        "Root-cause analysis of a hybrid VTOL incident from the aircraft’s own logs.",
      did: [
        "Led the technical investigation from DataFlash and telemetry logs.",
        "Traced the incident to controller-tuning, sensor and failsafe-configuration causes.",
        "Set out the corrective actions before the aircraft flew again.",
      ],
      outcome:
        "Causes found and fixed. The same method produced the EO/IR gimbal fault report and the aerostat mooring procedure.",
      tools: [
        "ArduPilot (ArduPlane)",
        "Mission Planner",
        "DataFlash logs",
        "MAVLink",
      ],
      diagram: "investigation",
      caption: "The order the investigation followed.",
    },
  ] as Brief[],
};

/** Shorter projects shown as cards. */
export interface Card {
  id: string;
  title: string;
  org: string;
  year: string;
  body: string;
  points: string[];
  tools: string[];
  media?: Media[];
  diagram?: DiagramVariant;
  caption?: string;
  links?: { label: string; href: string }[];
}

export const more: Card[] = [
  {
    id: "cadastral",
    title: "A district, parcel by parcel",
    org: "SKT Live with Arkadiah (Singapore)",
    year: "2023–25",
    body: "A complete property base map for Ga East Municipal Assembly’s digital rates system, and about 1,000 hectares of cadastral mapping at Dedekebe.",
    points: [
      "Surveyed every property, business and resident in the municipality with Arkadiah.",
      "Flew the Dedekebe cadastral survey on a Wingtra ONE fixed-wing VTOL tied to ground control.",
    ],
    tools: ["Wingtra ONE", "GNSS control", "Pix4D", "QGIS"],
    diagram: "parcels",
    caption: "Parcel mapping, illustrated.",
  },
  {
    id: "dashboards",
    title: "Car sales dashboard in Power BI",
    org: "Independent project",
    year: "2024",
    body: "An interactive Power BI dashboard that lets a car dealership track sales performance: year-to-date and month-to-date sales, average price and cars sold, compared with the previous year.",
    points: [
      "Built KPI cards for YTD and MTD total sales, average price and cars sold, each compared with the previous year.",
      "Added a weekly YTD sales trend, sales by body style and colour, and a map of sales by dealer region.",
      "Added a company-wise sales grid and a detailed table of every sale for drill-down.",
    ],
    tools: ["Power BI", "DAX", "Data modelling"],
    media: [
      {
        kind: "photo",
        src: "dashboard-car-sales",
        alt: "Power BI car sales dashboard with YTD totals, a map of dealer regions, sales by body style and colour, and a weekly trend",
        caption: "The finished dashboard.",
      },
    ],
    links: [
      {
        label: "Dashboard and .pbix file on GitHub",
        href: "https://github.com/Franklin-ferguson/Car-Sales-Dashboard-in-Power-BI",
      },
    ],
  },
  {
    id: "training",
    title: "Training the people who fly",
    org: "Isen Ventures · SKT Live · Ghana Flying Labs",
    year: "2023–26",
    body: "Courses, manuals and procedures that turn people with no aviation background into safe, productive crews.",
    points: [
      "Wrote a ten-module UAV operator programme and its reference manual for the mine team.",
      "Wrote ground-spotter training for BVLOS corridor surveillance and a 25-page Metashape guide.",
      "Rebuilt the UAV Standard Operating Procedure to the ICAO Doc 10019 structure.",
      "Ran school STEM workshops as a Ghana Flying Labs drone instructor.",
    ],
    tools: ["Curriculum design", "SOP writing", "Field instruction"],
    media: [
      {
        kind: "photo",
        src: "workshop-airframes",
        alt: "Training room desk with fixed-wing airframes, controllers and a course poster",
        caption: "Training room with airframes and controllers.",
      },
    ],
  },
];

/** Photographs from the field and the workshop. */
export const gallery: { title: string; rows: Row[] } = {
  title: "From the field and the workshop",
  rows: [
    {
      items: [
        {
          kind: "video",
          src: "multirotor-test",
          poster: "poster-multirotor-test",
          alt: "A multirotor test flight over a residential street",
          caption: "Multirotor test flight.",
        },
        {
          kind: "photo",
          src: "spray-drone-build",
          alt: "A spraying multirotor on the workbench with its arms folded",
          caption: "On the bench.",
        },
        {
          kind: "photo",
          src: "vtol-field-flight",
          alt: "A fixed-wing VTOL drone in flight against clouds",
          caption: "Fixed-wing VTOL in cruise.",
        },
        {
          kind: "photo",
          src: "spray-drone-bench",
          alt: "Two engineers checking a spraying drone with a tablet in the workshop",
          caption: "Pre-flight checks in the workshop.",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------------------------

export interface Role {
  title: string;
  org: string;
  orgNote?: string;
  where: string;
  from: string;
  to: string;
  relation?: string;
  points: string[];
}

export const experience: Role[] = [
  {
    title: "UAV & Aerostat Technician · Co-lead, UAS & Aerostat Operations",
    org: "Isen Ventures",
    relation: "Service contract with Newmont Ghana",
    where: "Ahafo South Mine",
    from: "Jan 2026",
    to: "Present",
    points: [
      "Co-lead the crew flying a hybrid VTOL fixed-wing UAV, multirotors and an RT SkyStar 180 tethered aerostat for survey, inspection and security.",
      "Command aerostat missions with EO/IR payloads and fly BVLOS corridor surveillance.",
      "Own the team’s procedures, training, dashboards and reporting tools.",
    ],
  },
  {
    title: "Team Lead, Research & Development · UAV Engineer",
    org: "SKT Live Limited",
    orgNote: "formerly SKT Aero",
    where: "Accra",
    from: "Jan 2023",
    to: "Dec 2025",
    points: [
      "Led national survey, spraying and environmental-monitoring operations with RGB, multispectral, thermal and LiDAR sensors.",
      "Led SolidWorks and Fusion 360 prototyping of UAV subsystems, reducing hardware failures in the field.",
      "Built SQL, Python and Power BI dashboards and KPI frameworks for the Tree Crops Development Authority (TCDA).",
      "Taught drone operations as an instructor with Ghana Flying Labs.",
    ],
  },
  {
    title: "Co-founder & Chief Operating Officer",
    org: "Wingxtra Aerospace Limited",
    where: "Accra",
    from: "Feb 2022",
    to: "Dec 2023",
    points: [
      "Co-founded the company in my final year at KNUST and ran it full-time after graduating.",
      "Ran operations, financial planning and cash flow.",
      "Led drone product development for surveillance, agriculture and precision work, from design to client delivery.",
    ],
  },
  {
    title: "Aircraft Maintenance Intern",
    org: "Ghana Air Force, School of Trade Training",
    where: "Accra",
    from: "Jun 2019",
    to: "Jul 2021",
    points: [
      "Ten-week practical programme over three summers covering aircraft systems, maintenance procedures and airworthiness checks on active aircraft.",
    ],
  },
];

export const education = {
  degree: "BSc Aerospace Engineering, First Class Honours",
  school: "Kwame Nkrumah University of Science and Technology (KNUST), Kumasi",
  dates: "2018 – 2022",
  honours: "College of Engineering Provost List, 2020, 2021 and 2022",
};

export interface Skill {
  id: string;
  title: string;
  icon: "plane" | "map" | "cpu" | "database" | "shield-check" | "users";
  summary: string;
  items: string[];
}

export const expertise: Skill[] = [
  {
    id: "flight",
    title: "Flight systems",
    icon: "plane",
    summary:
      "Configuring, flying and diagnosing fixed-wing VTOL, multirotor and aerostat systems.",
    items: [
      "ArduPilot (ArduPlane, ArduCopter), PX4, MAVLink",
      "Mission Planner, QGroundControl, DJI",
      "Tethered aerostat operations (RT SkyStar 180)",
      "BVLOS corridor and ground-spotter operations",
      "Flight-log analysis and failsafe set-up",
      "Maintenance, repair and build",
    ],
  },
  {
    id: "survey",
    title: "Survey & GIS",
    icon: "map",
    summary:
      "Survey-grade capture and processing, from ground control to volumes and maps.",
    items: [
      "RTK/PPK GNSS control (Emlid Reach RS2)",
      "Agisoft Metashape, Pix4D, QGIS",
      "Orthomosaics, DTM/DSM and contours",
      "Stockpile, cut/fill and as-mined volumes",
      "Topographic and cadastral mapping",
      "LiDAR, multispectral and thermal data",
    ],
  },
  {
    id: "design",
    title: "Design & embedded",
    icon: "cpu",
    summary:
      "CAD, prototyping and microcontroller payloads for aircraft subsystems.",
    items: [
      "SolidWorks, Fusion 360, Siemens NX",
      "MATLAB and CFD",
      "C/C++, Arduino, microcontroller integration",
      "ROS",
      "3D printing and prototyping",
      "PCB design in Altium Designer",
    ],
  },
  {
    id: "software",
    title: "Software & data",
    icon: "database",
    summary:
      "Pipelines, dashboards and small applications that operations teams keep using.",
    items: [
      "Python, SQL, Node.js, Git",
      "YOLOv8 and OpenCV",
      "Power BI dashboards and KPI frameworks",
      "Power Apps, Power Automate, Planner",
      "Puppeteer report automation",
    ],
  },
  {
    id: "safety",
    title: "Safety & regulation",
    icon: "shield-check",
    summary: "Procedures and training written to aviation standards.",
    items: [
      "SOPs to the ICAO Doc 10019 structure",
      "Risk assessments, incident and fault reports",
      "GCAA regulations and ICAO Annex 19",
      "Training design and delivery",
    ],
  },
  {
    id: "leadership",
    title: "Operations & leadership",
    icon: "users",
    summary:
      "Running teams, budgets and briefings, in a start-up and on a mine site.",
    items: [
      "Crew leadership and command briefings",
      "Budgets, cash flow and operations as COO",
      "Network-security fundamentals (Google certificate)",
    ],
  },
];

export const platforms = [
  "YANGDA Sky Whale VTOL",
  "Wingtra ONE",
  "TT Aviation 30L, 50L and 100L multirotors",
  "DJI Drones (Mavic, Matrice, Agras, Phantom)",
  "RT SkyStar 180 aerostat",
  "Custom multirotors",
];

export const research = {
  thesis: {
    title:
      "Design, fabrication and testing of an unmanned air vehicle for naval intelligence along Ghana’s maritime boundaries",
    where: "Undergraduate thesis, KNUST",
    supervisor: "Supervised by Dr (Mrs) Eunice Akyereko Adjei",
    dates: "2022",
    body: "With my research group I designed, built and flew a VTOL flying wing for maritime surveillance along Ghana’s coastline: from sizing and fabrication through onboard systems for live data and remote monitoring, to flight tests in changing coastal conditions.",
    rows: [
      {
        maxWidth: 920,
        items: [
          {
            kind: "photo",
            src: "vtol-wing-team",
            alt: "Two students holding a white flying-wing VTOL aircraft in front of a parked aeroplane",
            caption: "The research group’s flying wing.",
          },
          {
            kind: "photo",
            src: "vtol-wing-ground",
            alt: "A white flying-wing VTOL aircraft resting on grass",
            caption: "Ready for a flight test.",
          },
          {
            kind: "photo",
            src: "flying-wing-flight",
            alt: "A flying wing in the air above palm trees",
            caption: "In flight.",
          },
        ],
      },
    ] as Row[],
  },
  applied: [
    {
      title: "Seed dispersal from multirotors",
      body: "Dispersal efficiency, stability under a changing payload and terrain adaptability, fed back into the release protocol.",
    },
    {
      title: "Flight-test failure analysis",
      body: "Separating control-tuning, sensor and configuration causes in a hybrid VTOL incident from DataFlash and telemetry logs.",
    },
    {
      title: "Computer vision for surveillance",
      body: "A YOLOv8 pipeline that flags encroachment and illegal-mining activity in aerostat and UAV imagery.",
    },
  ],
  interests: [
    "Autonomous flight systems",
    "Human–robot interaction and machine learning",
    "Computational fluid dynamics",
    "High-performance aerodynamics",
    "Electric, plasma and hybrid-electric propulsion",
    "Space systems engineering",
    "Aerospace system design and optimisation",
  ],
};

export const credentials = [
  {
    title: "BSc Aerospace Engineering, First Class Honours",
    by: "KNUST · 2022",
    href: "docs/knust-transcript.pdf",
    linkLabel: "Transcript",
  },
  {
    title: "Provost Award for academic excellence, three times",
    by: "KNUST College of Engineering · 2020–2022",
    href: "docs/knust-provost-awards.pdf",
    linkLabel: "Citation",
  },
  {
    title: "Aircraft practical training programme",
    by: "Ghana Air Force, School of Trade Training · 2019–2021",
    href: "docs/ghana-air-force-stt-certificate.pdf",
    linkLabel: "Certificate",
  },
  {
    title: "Google Cybersecurity Professional Certificate",
    by: "Coursera · 2025",
    href: "docs/google-cybersecurity-certificate.pdf",
    linkLabel: "Certificate",
  },
  {
    title: "GCAA Remote Pilot Licence (RPAS)",
    by: "Ghana Civil Aviation Authority · in progress",
    href: "",
    linkLabel: "",
  },
  {
    title: "Brilliant but Needy Student Scholarship",
    by: "Ghana Scholarship Secretariat",
    href: "",
    linkLabel: "",
  },
];

export const contact = {
  title: "Let’s talk about your next mission.",
  body: "I’m open to engineering roles, research positions and survey or UAV projects. The quickest way to reach me is email.",
};

// ---------------------------------------------------------------------------------------------
// All projects in one list for the grid. Each opens a case study.

export type Category = "field" | "aircraft" | "software" | "safety";
export const categories: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "field", label: "Survey & field ops" },
  { id: "aircraft", label: "Aircraft & payloads" },
  { id: "software", label: "Software & data" },
  { id: "safety", label: "Safety & training" },
];

export interface Project {
  id: string;
  title: string;
  org: string;
  year: string;
  place?: string;
  role?: string;
  category: Category;
  summary: string;
  challenge?: string;
  did: string[];
  outcome: string;
  tools: string[];
  cover:
    | { kind: "media"; item: Media; position?: string }
    | { kind: "diagram"; variant: DiagramVariant };
  rows?: Row[];
  diagram?: DiagramVariant;
  caption?: string;
  links?: { label: string; href: string }[];
}

const story = (id: string) => stories.find((s) => s.id === id)!;
const brief = (id: string) => mine.briefs.find((b) => b.id === id)!;
const card = (id: string) => more.find((c) => c.id === id)!;
const fromStory = (
  id: string,
  category: Category,
  cover: Project["cover"],
): Project => {
  const s = story(id);
  return {
    id: s.id,
    title: s.title,
    org: s.org,
    year: s.year,
    place: s.place,
    role: s.role,
    category,
    summary: s.lead,
    challenge: s.challenge,
    did: s.did,
    outcome: s.outcome,
    tools: s.tools,
    cover,
    rows: s.rows,
    links: s.links,
  };
};
const fromBrief = (id: string, category: Category): Project => {
  const b = brief(id);
  return {
    id: b.id,
    title: b.title,
    org: mine.org,
    year: mine.year,
    place: "Ahafo South Mine",
    category,
    summary: b.summary,
    did: b.did,
    outcome: b.outcome,
    tools: b.tools,
    cover: b.cover
      ? { kind: "media", item: b.cover, position: "0% 0%" }
      : { kind: "diagram", variant: b.diagram },
    rows: b.rows,
    diagram: b.diagram,
    caption: b.rows ? b.caption : `${b.caption} Mine data is not published.`,
  };
};

export const projects: Project[] = [
  fromStory("seed-dispersal", "aircraft", {
    kind: "media",
    item: story("seed-dispersal").rows[0].items[0],
    position: "50% 60%",
  }),
  fromStory("crop-spraying", "field", {
    kind: "media",
    item: story("crop-spraying").rows[0].items[1],
  }),
  fromStory("eximbank", "field", {
    kind: "media",
    item: story("eximbank").rows[0].items[0],
    position: "50% 40%",
  }),
  fromBrief("route-mapping", "field"),
  fromBrief("security-platform", "software"),
  fromBrief("flight-test", "safety"),
  (() => {
    const c = card("cadastral");
    const wingtra: Media = {
      kind: "photo",
      src: "wingtra-crew",
      alt: "An orange Wingtra fixed-wing VTOL drone on a laterite road with three crew members and a GNSS base station on a tripod",
      caption: "Setting up the Wingtra with a GNSS base station.",
    };
    return {
      id: c.id,
      title: c.title,
      org: c.org,
      year: c.year,
      category: "field" as Category,
      summary: c.body,
      did: c.points,
      outcome:
        "A base map for a digital property-rate system, and cadastral boundary maps for about 1,000 hectares.",
      tools: c.tools,
      cover: { kind: "media" as const, item: wingtra, position: "50% 70%" },
      rows: [{ maxWidth: 560, items: [wingtra] }],
      diagram: "parcels" as DiagramVariant,
      caption: "Parcel mapping, illustrated. Client maps are not published.",
    };
  })(),
  (() => {
    const c = card("dashboards");
    return {
      id: c.id,
      title: c.title,
      org: c.org,
      year: c.year,
      category: "software" as Category,
      summary: c.body,
      did: c.points,
      outcome:
        "A single page where a dealership can follow sales, prices and volumes, spot trends and compare against last year.",
      tools: c.tools,
      cover: { kind: "media" as const, item: c.media![0], position: "0% 0%" },
      rows: [{ items: c.media! }],
      links: c.links,
    };
  })(),
  (() => {
    const c = card("training");
    return {
      id: c.id,
      title: c.title,
      org: c.org,
      year: c.year,
      category: "safety" as Category,
      summary: c.body,
      did: c.points,
      outcome:
        "Crews trained to a written standard, with a manual to keep them there.",
      tools: c.tools,
      cover: { kind: "media" as const, item: c.media![0] },
      rows: [{ maxWidth: 820, items: c.media! }],
    };
  })(),
];
