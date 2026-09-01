/**
 * PRISCILLA'S PROFILE — edit this file to keep the agent up to date.
 *
 * Add new roles, projects, skills, achievements, or anything else here.
 * The agent will use this as its primary source of truth.
 */

const profile = {
  name: "Priscilla Liu",
  title: "Director, Sustainability — SP Group | Product & Experience Leader | AI Product Builder",
  location: "Singapore",
  email: "prisms@outlook.com",
  linkedin: "https://www.linkedin.com/in/prisc/",

  summary: `
Priscilla Liu is a product and experience leader with 15+ years shipping across energy, proptech,
and financial services — now leading sustainability at SP Group and building AI products hands-on,
end to end. She led the narrative, structure and design of SP Group's 2026 sustainability report
and helps build its sustainability data platform; previously led enterprise transformation for
3,000+ staff and launched business-unit AI agents in production. She independently designs,
codes, and deploys AI products using Claude Code, agentic workflows, and modern web tooling.
Rare combination of board-level product leadership, sustainability domain depth, and current
builder capability.
  `,

  /**
   * Key strengths are deliberately written in the vocabulary job postings
   * screen on, not only in outcome language. The achievements below describe
   * results ("grew MAU from 80K to 800K"); these name the same work the way a
   * recruiter or an applicant tracking system searches for it.
   */
  keyStrengths: [
    "Applied AI Delivery (production GenAI, AI-enabled workflows, agentic workflow design, prompt-pipeline engineering, LLM product evaluation, responsible AI practice, run-and-maintain)",
    "AI Adoption & Organisational Change (adoption strategy and roadmapping, capability building, training and enablement, playbooks, champions networks, behaviour change, organisational readiness)",
    "Programme & Portfolio Management (portfolio planning, prioritisation, milestone tracking, governance, RAID and decision management, dependency coordination, value tracking, blocker escalation)",
    "Transformation Delivery & Digital Enablement (planning through deployment, adoption, operational transition and continuous improvement)",
    "Executive Communication & Governance Reporting (C-level and board engagement, portfolio reviews, OKR frameworks)",
    "0→1 Product Creation & Product Strategy",
    "Subscription & Revenue Products",
    "Design Leadership (strategic design direction, design systems, design ways of working; hiring, managing and developing designers, user researchers and data analysts)",
    "UI/UX, Design Systems & Service Design",
    "Cross-functional Team Building, Coaching & Succession Planning",
    "Measurement (KPI definition, adoption analytics, product analytics, user research, segmentation, PowerBI)",
    "Data & Technology (enterprise platforms, SaaS, mobile, AI/IoT)",
    "Sustainability Domain & ESG Disclosure",
    "AI & Agentic Development (Claude Code, React, Vercel)",
  ],

  /**
   * Applied AI experience, dated.
   *
   * Postings increasingly gate on "N years of applied AI", and that clock is
   * hard to read off a career history where the AI work sits inside a broader
   * transformation role. This section states it plainly.
   *
   * TODO — Priscilla: confirm the month the GenAI work actually began. The
   * period below is the tenure of the role it sat inside, which is the widest
   * defensible reading, not a verified start date.
   */
  appliedAI: [
    {
      period: "2022 – 2025",
      context: "SP Group — Director, Product and Experience",
      detail:
        "Led business units through delivery of four AI-enabled workflows into production — customer-query support, meter and AMI fieldwork, installation training, and an HR assistant. Each shipped within three to six months on an agile delivery framework. Information-processing accuracy improved approximately 50%; 80% of users reported reduced effort. Covered the full lifecycle from workflow design through deployment, adoption and operational transition.",
    },
    {
      period: "2024",
      context: "SP Group — internal AI tool",
      detail:
        "Delivered an internal AI safety tool serving 8,000+ contractors and staff with a four-person squad (domain expert, product owner, designer, developer), all holding other roles. Product CSAT above 80%.",
    },
    {
      period: "2025 – present",
      context: "SP Group — Director, Sustainability",
      detail:
        "Driving the group sustainability data platform — disclosure and reporting data infrastructure supporting regulated sustainability reporting.",
    },
    {
      period: "2025 – 2026",
      context: "Independent",
      detail:
        "Designed, built and deployed production AI applications end to end using Claude Code, agentic workflows, React and Vercel. Includes a citation-grounded extraction pipeline enforcing verbatim source quotation, a strict no-interpolation data model, and automated verification classifying every extraction as exact, fuzzy or rejected — a responsible-AI design addressing hallucination risk in regulated disclosure data.",
    },
  ],

  highlights: [
    {
      title: "AI Agents in Production at SP Group",
      detail:
        "Shipped AI agents within 3–6 months — Customer Service, HR, Meter Installation training, and Meter Fieldwork agents via an agile framework — improving information-processing accuracy by ~50%, with 80% of users reporting reduced effort.",
    },
    {
      title: "Independent AI Products",
      detail:
        "Independently designed, built, and deployed: an ESG disclosure comparison platform with a citation-grounded, no-interpolation data model (pris.la), and a consumer social app prototype (Type Me) — using Claude Code, React, and Vercel.",
    },
    {
      title: "PropertyGuru Commercial Wins",
      detail:
        "Led product and UX for PropertyGuru's agent platform — its primary revenue line. Agent subscription products delivered 25% CAGR and contributed to the Series D valuation increase, with +20% conversion in 6 months from core-journey optimisation.",
    },
    {
      title: "Transformation at Scale — SP Group",
      detail:
        "Set up and led an agile delivery capability at SP Group — 13 products shipped in 2024, six-figure annual cost savings, 20–50% time-to-task reductions per product, and 3-month time-to-value versus a 12–24-month norm.",
    },
    {
      title: "Consumer Growth — SP App",
      detail:
        "Grew SP app monthly active users from 80K to 800K (of 1.4M households); app rating from 2.4 to 4.6.",
    },
    {
      title: "Market Expansion — Commonwealth Bank",
      detail:
        "Launched 4 financial products for businesses in Indonesia and Vietnam — iOS top-ranked finance app, up to 10% conversion rate outperforming legacy loan products.",
    },
  ],

  independentWork: [
    {
      title: "ESG Report Comparison Platform (pris.la/sustainability)",
      detail:
        "Multi-company sustainability disclosure tracker across utilities, healthcare, and Temasek portfolio companies; per-figure citations, comparability flags, and a strict no-interpolation data-quality model.",
    },
    {
      title: "Citation-Grounded Extraction Pipeline",
      detail:
        "PDF-to-text splitting, keyword filtering, headless Claude Code extraction with verbatim source-quote requirements, and automated verification (exact / fuzzy / reject).",
    },
    {
      title: "Type Me",
      detail:
        "Perception-based consumer app prototype — friends rate you on your MBTI type. Deterministic scoring, share-card mechanics, self-contained React build with full engineering spec.",
    },
  ],

  /**
   * DESIGN LEADERSHIP
   *
   * The shape of the design contribution across the director-level roles.
   * It is practice-level rather than per-project: direction, frameworks, the
   * design system, and the team. Kept separate from `portfolio` below so the
   * two are not confused — postings that ask for a design lead are asking
   * about this section; postings that ask for a portfolio are asking about
   * that one.
   */
  designLeadership: {
    summary: `Across SP Group, SP Digital and PropertyGuru, Priscilla's design contribution has been
setting direction and building the practice rather than owning individual screens: defining the
strategic design direction, establishing the ways of working and frameworks that give structure to
how products and projects get created and managed, setting up the design system, and hiring and
managing a multi-disciplinary team of designers, user researchers and data analysts — including
developing the next generation of leaders within it.`,
    practice: [
      "Set strategic design direction across product portfolios.",
      "Established ways of working and delivery frameworks providing structure for product and project creation and management.",
      "Set up and owned the design system.",
      "Hired and managed designers, user researchers and data analysts as a single multi-disciplinary practice.",
      "Built next-generation leaders within the team through coaching, succession and capability planning.",
    ],
  },

  /**
   * DESIGN PORTFOLIO
   *
   * The agent previously had nothing to offer anyone who asked to see design
   * work, which is the largest hole in a profile whose most senior credential
   * is design leadership.
   *
   * `craft` describes the contribution honestly at the level it was made. On
   * the three enterprise entries that is direction, system and team — see
   * `designLeadership` above; on the two independent builds it is hands-on
   * design and code.
   *
   * TODO — Priscilla:
   *   1. Add `link` where artefacts exist — a case-study URL, or a
   *      password-protected page for anything NDA-constrained.
   *   2. Add any recent (2020+) hands-on work missing here. Postings that ask
   *      for a portfolio want craft artefacts and recency; the leadership
   *      narrative above answers a different question.
   */
  portfolio: [
    {
      title: "Agent Boost — PropertyGuru",
      year: "2017",
      role: "Head of Product and UX",
      problem:
        "Property agents needed a way to buy visibility for individual listings on a marketplace where organic reach was flattening.",
      craft:
        "Director-level: set the design direction for the agent platform and the ways of working the product and UX team delivered against, across four markets.",
      outcome:
        "Zero-to-one paid-visibility product on the agent platform, PropertyGuru's primary revenue line; agent subscription products delivered 25% CAGR and contributed to the Series D valuation increase.",
      link: "TODO",
    },
    {
      title: "SP app — consumer utility experience",
      year: "2017 – 2022",
      role: "Director, SP Digital",
      problem:
        "A utility app that households were required to use but did not want to, rated 2.4, reaching a fraction of the customer base.",
      craft:
        "Director-level: owned user experience, customer insights and digital strategy across B2B, B2C and B2E; set up the design system and hired and managed the designers, user researchers and data analysts behind the app.",
      outcome:
        "Monthly active users grew from 80,000 to 800,000 of 1.4 million households; app rating improved from 2.4 to 4.6.",
      link: "TODO",
    },
    {
      title: "Enterprise workflow redesign — SP Group",
      year: "2022 – 2025",
      role: "Director, Product and Experience",
      problem:
        "Customer service, IT and field operations ran on disconnected platforms and manual handoffs across 3,000+ frontline and back-office staff.",
      craft:
        "Director-level: set the design and delivery frameworks structuring how workflows were redesigned and shipped, and led the multi-disciplinary design, research and analytics practice delivering them.",
      outcome:
        "Integrated digital platforms and redesigned workflows; 20–50% time-to-task reduction per product; 40% reduction in process redundancies.",
      link: "TODO",
    },
    {
      title: "ESG Report Comparison Platform — pris.la",
      year: "2025 – 2026",
      role: "Independent — design and build",
      problem:
        "Sustainability disclosures are incomparable across companies, and the tools that try to compare them quietly interpolate missing figures.",
      craft:
        "Comparison IA across companies and metrics, per-figure citation affordances, comparability flags, and an explicit N/D versus N/A distinction so gaps read as gaps rather than zeroes.",
      outcome:
        "Live multi-company disclosure tracker across utilities, healthcare and Temasek portfolio companies, built on a strict no-interpolation data model.",
      link: "https://pris.la/sustainability",
    },
    {
      title: "Type Me",
      year: "2025 – 2026",
      role: "Independent — design and build",
      problem:
        "Personality typing is self-reported; the interesting version is how the people who know you actually perceive you.",
      craft:
        "Deterministic scoring model, share-card mechanics, self-contained React build with a full engineering specification.",
      outcome: "Shipped consumer prototype.",
      link: "TODO",
    },
  ],

  experience: [
    {
      company: "SP Group",
      period: "Sep 2025 – Present",
      role: "Director, Sustainability",
      highlights: [
        "Led the narrative, structure and visualisation of SP Group's 2026 sustainability report.",
        "Helps set sustainability targets and metrics and collects disclosure data.",
        "Leads sustainability communications across the group.",
        "Driving SP Group's sustainability data platform — disclosure and reporting data infrastructure.",
      ],
    },
    {
      company: "SP Group",
      period: "2022 – Sep 2025",
      role: "Director, Product and Experience",
      highlights: [
        // TODO — Priscilla: the adoption and change work behind these results is
        // not written down anywhere, and postings screen hard on it. Add a bullet
        // naming what you actually ran to get uptake: onboarding, demonstrations,
        // internal communications, training, champions, office hours. I have left
        // it out rather than guess at activities you may not have run.
        "Led an enterprise transformation programme across customer service, IT, and field operations — integrated digital platforms and redesigned workflows for 3,000+ frontline and back-office staff, from planning through deployment.",
        "Guided business units in shipping production GenAI products (customer-query support, meter/AMI fieldwork, installation training; HR chatbot in rollout) — AI-enabled workflows delivered within 3–6 months, improving information-processing accuracy by ~50% with 80% of users reporting reduced effort.",
        "Cut process redundancies 40% through shared-services alignment across HR, Finance, and Ops — aligning business owners across three functions and escalating blockers to resolution.",
        "Secured C-level and board buy-in for a 3-year transformation roadmap through OKR-driven portfolio governance and executive reporting.",
        "Rebuilt data and CX capability post-restructure — in-house teams, redefined role matrices, organisational capability planning, and coached senior leaders on digital ways of working.",
      ],
    },
    {
      company: "SP Digital (SPACE Pte Ltd)",
      period: "2017 – 2022",
      role: "Director",
      highlights: [
        "Part of the executive leadership team — accountable for user experience, customer insights, and digital strategy across B2B, B2C, and B2E.",
        "Grew monthly active users from 80K to 800K out of 1.4M households; app rating improved from 2.4 to 4.6.",
        "Delivered new digital revenue streams in sustainable energy and enterprise design-thinking consulting — NPAT positive within 4 years.",
        "Championed agile, experimental delivery and design-thinking ways of working — the foundation later formalised as SP Group's Area49 delivery capability.",
      ],
    },
    {
      company: "PropertyGuru (formerly NYSE: PGRU)",
      period: "2015 – 2017",
      role: "Head of Product and UX",
      highlights: [
        "Regional product and UX leadership across Singapore, Vietnam, Malaysia, and Thailand for SEA's leading PropTech platform.",
        "Launched 'Agent Boost' (2017), a 0-to-1 paid-visibility product for agents; led product and UX for the agent platform — PropertyGuru's primary revenue line — where agent subscription products delivered 25% CAGR and contributed to the Series D valuation increase.",
        "+20% conversion rate within 6 months from core user-journey optimisation; 40% YoY revenue growth from new product initiatives.",
        "Scaled platform to 2.7M listings and 45K active agents; MAUs grew 50% to 24M; listing approval time cut from 3 days to 1 through automation.",
      ],
    },
    {
      company: "Commonwealth Bank of Australia",
      period: "2013 – 2015",
      role: "Associate Director, Product",
      highlights: [
        "Built mobile-first savings and loan products for businesses in Indonesia and Vietnam — top-ranking iOS finance app; opened new direct-to-loan revenue streams in Asia.",
        "Launched 4 financial products with up to 10% conversion, outperforming legacy loan baselines.",
        "Embedded user-centred design into the product lifecycle with risk, compliance, and data partners.",
      ],
    },
    {
      company: "First Advantage (Nasdaq: FA)",
      period: "2011 – 2013",
      role: "Product and Operations Platform Lead",
      highlights: [
        "Global product lead for background-screening platforms across EMEA and APAC (incl. Japan, China).",
        "Owned end-to-end operations platform with Manila-based delivery.",
      ],
    },
    {
      company: "Media Development Authority",
      period: "2009 – 2010",
      role: "Management Executive",
      highlights: [
        "Supported creation of the Interactive Digital Media Programme Office — $265.6M in grants awarded, 1,300+ jobs created.",
      ],
    },
    {
      company: "MINDEF",
      period: "2008 – 2009",
      role: "Web Manager",
      highlights: [
        "Managed 60 websites and 160 webmasters for MINDEF.gov.sg.",
      ],
    },
  ],

  education: [
    "M.Sc. — Nanyang Technological University (2007–2008)",
    "B.A. — National University of Singapore (2001–2004)",
    "Certified Professional Scrum Master & Product Owner — Scrum.org",
    "Finance & Quantitative Modeling for Analysts — University of Pennsylvania",
  ],

  awards: [
    "Omni-Experience Innovator of the Year — 2018",
    "United Nations UNLEASH — 2018",
    "Mob-Ex Awards — 2016",
    "Community Cares Award, MSF Singapore — 2023",
  ],

  speakingAndThoughtLeadership: [
    "Keynote — Chief Data & Analytics Officer (CDAO) Singapore, 2023–2024",
    "Keynote — CHIUXID: UX in Energy & Utilities",
    "Mind the Product — Stakeholder Management Interview Series",
    "DesignUP — Future of UX Panel",
    "UXSEA — Research & Insights Facilitator",
    "Featured in The Straits Times",
  ],

  mediaAndPress: [
    "International Women's Day: Priscilla Liu on Taking a Leap of Faith — purpose-driven work and commitment to data and user-centered products.",
    "Purpose-Driven Tech: Meet the UX Designer on a Mission to Help the Planet and the Community — enabling consumers to visualise their carbon footprint and encouraging greener lifestyles.",
    "IxD Session: A Conversation with Priscilla Liu — insights on journey in data and insights.",
  ],

  volunteering: [
    "Chairperson, SP Heartworkers — 2022 to 2023; volunteer since 2017",
    "Yayasan Mendaki — 2011 to 2017",
  ],

  /**
   * LinkedIn posts — Priscilla's own writing (not reposts).
   * Add new posts here as you publish them.
   */
  linkedInPosts: [
    {
      date: "2024-09",
      url: "https://www.linkedin.com/in/prisc/",
      summary: "Shared reflections on HCI vs UX in the age of AI — arguing that as AI 'eats the tech world', UX stays front-line relevant (AI needs a face, interaction spreads beyond screens) while HCI quietly becomes the hidden power source behind the scenes for trust, bias, ethics, and adaptive interfaces.",
      fullText: `Blueprint for reference. Consistent focus on engagement, leading me to think how UX or design will evolve. I thought Human-Computer Interaction (HCI) might be more encompassing and put more focus on the "Computer" side of the equation.

Here is what AI have to say:

"If AI keeps eating the tech world (and it will), UX becomes more directly relevant for most industry roles, while HCI quietly becomes the hidden power source behind the scenes.

Why UX stays front-line relevant: AI needs a face — The more 'black box' the tech, the more critical it is to design clear, trustworthy, and human-friendly interactions. With AI, interaction spreads beyond screens to voice, gestures, and mixed reality. UX will be about orchestrating all those touchpoints.

Why HCI quietly gains influence: New interaction paradigms — AI changes how we give instructions (natural language, multimodal prompts, emotional cues). HCI research helps us understand those new patterns. Trust, bias, and ethics — HCI's deep methods for studying human perception, cognitive load, and decision-making become critical in AI safety and explainability. Adaptive interfaces — AI will personalise experiences on the fly."

Interesting time.`,
    },
    {
      date: "2024-08",
      url: "https://www.linkedin.com/in/prisc/",
      summary: "Shared SP Group's internal AI safety tool (for 8,000+ contractors and staff), calling out just how lean the squad was — one domain expert, a product owner, a designer and a developer, all juggling multiple other jobs — and still achieved product CSAT above 80%.",
      fullText: `One of the internal tools we shipped — what is not mentioned is just how lean this squad is.

A domain expert, a product owner, a designer and a developer. All of them juggling multiple other jobs. Product CSAT above 80%.`,
    },
    {
      date: "2024-07",
      url: "https://medium.com/building-enterprise-systems-vision-needs-structure",
      title: "Building Enterprise Systems: Vision Needs Structure, Structure Needs Vision",
      summary: "Published on Medium — explores the tension between visionaries and incrementalists in enterprise design. Covers how to navigate this in Grid Operations at SP Group: balancing futuristic ideas with legacy constraints, building MVPs where some experiments are bound to fail, in a risk-averse environment designing for systems that actually power lives.",
      fullText: `Visionaries vs Incrementalists.

In this piece, I share how we navigate this tension in Grid Operations — turning moonshot ideas into measurable MVPs.

From balancing futuristic ideas with legacy constraints, to building MVPs where some experiments are bound to fail... in a risk-adverse environment — this is the reality of designing for systems that actually power lives.`,
    },
  ],

  /**
   * LinkedIn recommendations — paste any received recommendations here.
   * Format: { author, title, relationship, date, text }
   */
  recommendations: [
    // Example (replace with real ones when available):
    // {
    //   author: "Jane Smith",
    //   title: "VP Product at Acme Corp",
    //   relationship: "Managed Priscilla directly",
    //   date: "2024",
    //   text: "Priscilla is an exceptional design leader..."
    // },
  ],

  additionalContext: `
Priscilla is open to a wide range of conversations — whether that's a collaboration, advisory role,
speaking opportunity, consulting engagement, or simply an interesting project where design and
product thinking can make a difference. She's currently leading sustainability at SP Group while
also building AI products independently. She's interested in connecting with people working on
meaningful problems across sustainability, energy, proptech, fintech, and enterprise technology.
Based in Singapore, open to regional Southeast Asia and global remote collaborations.
  `,
};

module.exports = profile;
