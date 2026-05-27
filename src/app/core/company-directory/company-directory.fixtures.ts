export interface CompanyFixture {
  slug: string;
  name: string;
  description: string;
  website: string;
  categorySlug: string;
  tags: string[];
  aiSummary: string;
  seoDescription: string;
}

// Shared by the in-memory fallback and Prisma seed so demo content stays aligned.
const BASE_COMPANY_FIXTURES: CompanyFixture[] = [
  {
    slug: 'novalens',
    name: 'NovaLens',
    description:
      'AI research assistant for market teams tracking competitors and product movement.',
    website: createDemoWebsite('novalens'),
    categorySlug: 'ai-tools',
    tags: ['Market research', 'Competitive intelligence', 'B2B SaaS'],
    aiSummary:
      'NovaLens is positioned for lean strategy teams that need fast competitor briefings without building internal research operations.',
    seoDescription:
      'Explore NovaLens, an AI market research platform for competitor tracking, category insights, and business intelligence workflows.',
  },
  {
    slug: 'ledgerly',
    name: 'Ledgerly',
    description: 'Cash-flow planning and invoice intelligence for modern finance operators.',
    website: createDemoWebsite('ledgerly'),
    categorySlug: 'fintech',
    tags: ['Cash flow', 'Invoices', 'Finance ops'],
    aiSummary:
      'Ledgerly focuses on practical finance workflows, combining invoice visibility with forecasting signals for small and mid-market teams.',
    seoDescription:
      'Review Ledgerly, a fintech platform for cash-flow planning, invoice intelligence, and finance operations visibility.',
  },
  {
    slug: 'signalharbor',
    name: 'SignalHarbor',
    description: 'Customer feedback analysis for support, success, and product teams.',
    website: createDemoWebsite('signalharbor'),
    categorySlug: 'ai-tools',
    tags: ['Feedback analysis', 'Customer success', 'Support'],
    aiSummary:
      'SignalHarbor turns messy customer feedback into themes and action areas, helping support and product teams agree on what matters.',
    seoDescription:
      'Discover SignalHarbor, an AI customer feedback analysis tool for support, success, and product teams.',
  },
  {
    slug: 'goldline-studio',
    name: 'Goldline Studio',
    description: 'Brand and conversion agency for seed-stage software companies.',
    website: createDemoWebsite('goldline-studio'),
    categorySlug: 'agencies',
    tags: ['Brand strategy', 'Web design', 'Conversion'],
    aiSummary:
      'Goldline Studio is best matched with early software teams that need credible positioning, launch pages, and conversion-focused design.',
    seoDescription:
      'Find Goldline Studio, a brand and conversion agency serving seed-stage SaaS and software startups.',
  },
  {
    slug: 'clearstack',
    name: 'ClearStack',
    description: 'Operations consultancy helping B2B teams simplify tooling and reporting.',
    website: createDemoWebsite('clearstack'),
    categorySlug: 'agencies',
    tags: ['Operations', 'RevOps', 'Reporting'],
    aiSummary:
      'ClearStack fits teams with tangled internal systems, especially where reporting quality and process ownership are slowing execution.',
    seoDescription:
      'Learn about ClearStack, an operations consultancy for B2B tooling, RevOps process, and reporting improvements.',
  },
  {
    slug: 'metricforge',
    name: 'MetricForge',
    description: 'Self-serve analytics workspace for product-led growth teams.',
    website: createDemoWebsite('metricforge'),
    categorySlug: 'analytics',
    tags: ['Product analytics', 'Dashboards', 'PLG'],
    aiSummary:
      'MetricForge emphasizes accessible product metrics and team-ready dashboards, making it useful for growth teams without dedicated data support.',
    seoDescription:
      'Compare MetricForge, a self-serve analytics workspace for product-led growth teams and business dashboards.',
  },
  {
    slug: 'carepilot',
    name: 'CarePilot',
    description: 'Patient engagement workspace for clinics coordinating follow-up care.',
    website: createDemoWebsite('carepilot'),
    categorySlug: 'healthtech',
    tags: ['Patient engagement', 'Care coordination', 'Clinic ops'],
    aiSummary:
      'CarePilot helps small care teams organize follow-ups, patient reminders, and intake context in one lightweight workflow.',
    seoDescription:
      'Discover CarePilot, a healthtech workspace for patient engagement, care coordination, and clinic follow-up workflows.',
  },
  {
    slug: 'helixbench',
    name: 'HelixBench',
    description: 'Biotech operations tracker for assay planning, sample runs, and lab handoffs.',
    website: createDemoWebsite('helixbench'),
    categorySlug: 'biotech-pharma',
    tags: ['Lab operations', 'Assay planning', 'Sample tracking'],
    aiSummary:
      'HelixBench is aimed at research teams that need clearer lab handoffs and operational visibility before formal LIMS adoption.',
    seoDescription:
      'Explore HelixBench, a biotech operations tracker for assay planning, sample management, and lab workflow visibility.',
  },
  {
    slug: 'cartvale',
    name: 'CartVale',
    description: 'Merchandising and retention toolkit for niche commerce teams.',
    website: createDemoWebsite('cartvale'),
    categorySlug: 'ecommerce',
    tags: ['Merchandising', 'Retention', 'Shop operations'],
    aiSummary:
      'CartVale combines merchandising cues with customer retention signals for shops that need practical growth workflows.',
    seoDescription:
      'Review CartVale, an e-commerce toolkit for merchandising, retention workflows, and online store operations.',
  },
  {
    slug: 'vaulttrace',
    name: 'VaultTrace',
    description: 'Security posture assistant for monitoring vendor access and policy gaps.',
    website: createDemoWebsite('vaulttrace'),
    categorySlug: 'cybersecurity',
    tags: ['Vendor risk', 'Security posture', 'Policy review'],
    aiSummary:
      'VaultTrace suits security-conscious teams that need a lighter way to review access, vendors, and operational policy gaps.',
    seoDescription:
      'Learn about VaultTrace, a cybersecurity assistant for vendor risk, access monitoring, and security posture review.',
  },
  {
    slug: 'stackloom',
    name: 'StackLoom',
    description: 'Developer documentation and release-note automation for platform teams.',
    website: createDemoWebsite('stackloom'),
    categorySlug: 'developer-tools',
    tags: ['Developer docs', 'Release notes', 'Platform engineering'],
    aiSummary:
      'StackLoom targets platform teams that want release knowledge, API changes, and documentation updates to stay synchronized.',
    seoDescription:
      'Compare StackLoom, a developer tool for documentation automation, release notes, and platform engineering workflows.',
  },
  {
    slug: 'focusrail',
    name: 'FocusRail',
    description: 'Team productivity planner for prioritizing weekly work and decision logs.',
    website: createDemoWebsite('focusrail'),
    categorySlug: 'productivity',
    tags: ['Planning', 'Decision logs', 'Team rituals'],
    aiSummary:
      'FocusRail gives operators a structured way to turn scattered priorities into weekly plans and clear decision records.',
    seoDescription:
      'Explore FocusRail, a productivity planner for weekly prioritization, team rituals, and decision tracking.',
  },
  {
    slug: 'campaignnorth',
    name: 'CampaignNorth',
    description: 'Marketing operations platform for campaign briefs, approvals, and launch notes.',
    website: createDemoWebsite('campaignnorth'),
    categorySlug: 'marketing',
    tags: ['Campaign ops', 'Approvals', 'Launch planning'],
    aiSummary:
      'CampaignNorth is built for marketing teams that need fewer handoff gaps between strategy, approvals, and campaign launch.',
    seoDescription:
      'Discover CampaignNorth, a marketing operations platform for campaign briefs, approvals, and launch planning.',
  },
  {
    slug: 'courseharbor',
    name: 'CourseHarbor',
    description: 'Learning program manager for cohort-based courses and internal academies.',
    website: createDemoWebsite('courseharbor'),
    categorySlug: 'education',
    tags: ['Cohort learning', 'Curriculum ops', 'Learning analytics'],
    aiSummary:
      'CourseHarbor helps education teams manage cohorts, curriculum checkpoints, and learner progress without heavy LMS setup.',
    seoDescription:
      'Review CourseHarbor, an education platform for cohort courses, curriculum operations, and learning program management.',
  },
  {
    slug: 'homepulse',
    name: 'HomePulse',
    description: 'Consumer service app for household maintenance reminders and vendor notes.',
    website: createDemoWebsite('homepulse'),
    categorySlug: 'consumer',
    tags: ['Home services', 'Reminders', 'Vendor notes'],
    aiSummary:
      'HomePulse packages household maintenance into a practical timeline for consumers who want fewer missed service tasks.',
    seoDescription:
      'Find HomePulse, a consumer app for household maintenance reminders, service notes, and home operations planning.',
  },
  {
    slug: 'orbitdesk',
    name: 'OrbitDesk',
    description: 'Enterprise operations workspace for internal requests, approvals, and reporting.',
    website: createDemoWebsite('orbitdesk'),
    categorySlug: 'enterprise-software',
    tags: ['Internal ops', 'Approvals', 'Enterprise workflow'],
    aiSummary:
      'OrbitDesk is positioned for enterprise teams that need a shared operating layer across requests, approvals, and reporting.',
    seoDescription:
      'Explore OrbitDesk, enterprise software for internal operations, approval workflows, and team reporting.',
  },
  {
    slug: 'freightlane',
    name: 'FreightLane',
    description: 'Logistics coordination board for delivery exceptions and carrier updates.',
    website: createDemoWebsite('freightlane'),
    categorySlug: 'logistics',
    tags: ['Carrier updates', 'Exceptions', 'Delivery ops'],
    aiSummary:
      'FreightLane gives logistics teams a simple exception-management view for shipments that need human coordination.',
    seoDescription:
      'Learn about FreightLane, a logistics coordination platform for carrier updates, delivery exceptions, and shipment operations.',
  },
  {
    slug: 'plotwise',
    name: 'PlotWise',
    description: 'Real estate pipeline tracker for broker notes, properties, and deal stages.',
    website: createDemoWebsite('plotwise'),
    categorySlug: 'real-estate',
    tags: ['Property pipeline', 'Broker notes', 'Deal tracking'],
    aiSummary:
      'PlotWise helps real estate teams keep property research, broker context, and deal movement visible in one workspace.',
    seoDescription:
      'Compare PlotWise, a real estate pipeline tracker for property notes, broker context, and deal-stage visibility.',
  },
  {
    slug: 'clausekit',
    name: 'ClauseKit',
    description: 'Legal operations assistant for contract intake, clause notes, and review queues.',
    website: createDemoWebsite('clausekit'),
    categorySlug: 'legaltech',
    tags: ['Contract intake', 'Clause review', 'Legal ops'],
    aiSummary:
      'ClauseKit supports legal operations teams that need cleaner intake, triage, and clause review context before escalation.',
    seoDescription:
      'Review ClauseKit, a legaltech assistant for contract intake, clause notes, and legal operations review queues.',
  },
  {
    slug: 'talentmesa',
    name: 'TalentMesa',
    description: 'HR planning system for hiring requests, role scorecards, and onboarding tasks.',
    website: createDemoWebsite('talentmesa'),
    categorySlug: 'hrtech',
    tags: ['Hiring plans', 'Role scorecards', 'Onboarding'],
    aiSummary:
      'TalentMesa connects hiring plans and onboarding tasks so people teams can track role readiness from request to start date.',
    seoDescription:
      'Discover TalentMesa, an HRTech platform for hiring requests, role scorecards, and onboarding workflows.',
  },
  {
    slug: 'storygrid',
    name: 'StoryGrid',
    description: 'Editorial planning hub for media teams managing stories, contributors, and channels.',
    website: createDemoWebsite('storygrid'),
    categorySlug: 'media',
    tags: ['Editorial planning', 'Contributors', 'Publishing ops'],
    aiSummary:
      'StoryGrid helps media teams coordinate story pipelines, contributor assignments, and channel-ready publishing notes.',
    seoDescription:
      'Explore StoryGrid, a media planning hub for editorial workflows, contributor coordination, and publishing operations.',
  },
  {
    slug: 'fieldnote-labs',
    name: 'Fieldnote Labs',
    description: 'Flexible operations studio for teams with unusual research and service workflows.',
    website: createDemoWebsite('fieldnote-labs'),
    categorySlug: 'other',
    tags: ['Research ops', 'Service design', 'Workflow mapping'],
    aiSummary:
      'Fieldnote Labs fits teams whose work does not sit cleanly in one software category but still needs structured operating context.',
    seoDescription:
      'Find Fieldnote Labs, a flexible operations studio for research workflows, service design, and custom process mapping.',
  },
  {
    slug: 'treasurynorth',
    name: 'TreasuryNorth',
    description: 'Treasury planning dashboard for runway forecasts, approvals, and vendor spend.',
    website: createDemoWebsite('treasurynorth'),
    categorySlug: 'fintech',
    tags: ['Treasury', 'Runway planning', 'Spend controls'],
    aiSummary:
      'TreasuryNorth helps finance leaders connect cash planning with operational approvals, making it useful for companies managing tighter runway cycles.',
    seoDescription:
      'Compare TreasuryNorth, a fintech dashboard for treasury planning, runway forecasts, vendor spend, and approval workflows.',
  },
  {
    slug: 'boardsignal',
    name: 'BoardSignal',
    description: 'Executive analytics pack builder for board updates and operating reviews.',
    website: createDemoWebsite('boardsignal'),
    categorySlug: 'analytics',
    tags: ['Board reporting', 'Executive metrics', 'Operating reviews'],
    aiSummary:
      'BoardSignal packages business metrics into review-ready narratives for teams that need cleaner executive reporting without analyst bottlenecks.',
    seoDescription:
      'Explore BoardSignal, an analytics workspace for board reporting, executive metrics, and operating review preparation.',
  },
  {
    slug: 'clinicatlas',
    name: 'ClinicAtlas',
    description: 'Clinic growth and capacity planner for appointment demand and provider schedules.',
    website: createDemoWebsite('clinicatlas'),
    categorySlug: 'healthtech',
    tags: ['Capacity planning', 'Provider schedules', 'Clinic growth'],
    aiSummary:
      'ClinicAtlas gives healthcare operators a practical view of demand, staffing, and schedule pressure across growing clinic networks.',
    seoDescription:
      'Discover ClinicAtlas, a healthtech planner for clinic capacity, provider schedules, appointment demand, and growth operations.',
  },
  {
    slug: 'trialnest',
    name: 'TrialNest',
    description: 'Clinical trial coordination workspace for site readiness and document handoffs.',
    website: createDemoWebsite('trialnest'),
    categorySlug: 'biotech-pharma',
    tags: ['Clinical trials', 'Site readiness', 'Document handoffs'],
    aiSummary:
      'TrialNest helps research operations teams keep clinical sites, milestone evidence, and trial documents aligned before formal review cycles.',
    seoDescription:
      'Review TrialNest, a biotech and pharma coordination workspace for clinical trial site readiness and document handoffs.',
  },
  {
    slug: 'shelfpilot',
    name: 'ShelfPilot',
    description: 'Catalog quality assistant for product pages, bundles, and merchandising checks.',
    website: createDemoWebsite('shelfpilot'),
    categorySlug: 'ecommerce',
    tags: ['Catalog quality', 'Product pages', 'Merchandising'],
    aiSummary:
      'ShelfPilot is aimed at commerce teams that need consistent product data, bundle readiness, and merchandising QA before campaigns launch.',
    seoDescription:
      'Find ShelfPilot, an e-commerce catalog assistant for product page quality, bundles, and merchandising checks.',
  },
  {
    slug: 'shieldledger',
    name: 'ShieldLedger',
    description: 'Audit evidence tracker for security questionnaires and compliance reviews.',
    website: createDemoWebsite('shieldledger'),
    categorySlug: 'cybersecurity',
    tags: ['Audit evidence', 'Security reviews', 'Compliance'],
    aiSummary:
      'ShieldLedger supports security and revenue teams by organizing reusable audit evidence for questionnaires, renewals, and compliance checks.',
    seoDescription:
      'Learn about ShieldLedger, a cybersecurity platform for audit evidence, security questionnaires, and compliance review workflows.',
  },
  {
    slug: 'deploymint',
    name: 'DeployMint',
    description: 'Release orchestration tool for changelogs, deploy notes, and rollback context.',
    website: createDemoWebsite('deploymint'),
    categorySlug: 'developer-tools',
    tags: ['Release orchestration', 'Changelogs', 'Rollback planning'],
    aiSummary:
      'DeployMint helps engineering teams turn release activity into coordinated notes, stakeholder updates, and rollback-ready context.',
    seoDescription:
      'Compare DeployMint, a developer tool for release orchestration, changelogs, deploy notes, and rollback planning.',
  },
  {
    slug: 'workcanvas',
    name: 'WorkCanvas',
    description: 'Planning surface for cross-functional projects, owner maps, and meeting outcomes.',
    website: createDemoWebsite('workcanvas'),
    categorySlug: 'productivity',
    tags: ['Project planning', 'Owner maps', 'Meeting outcomes'],
    aiSummary:
      'WorkCanvas gives teams a shared planning layer for ownership, decisions, and next actions across messy cross-functional work.',
    seoDescription:
      'Explore WorkCanvas, a productivity platform for project planning, owner maps, meeting outcomes, and team coordination.',
  },
  {
    slug: 'funnelnote',
    name: 'FunnelNote',
    description: 'Campaign learning repository for experiments, funnel notes, and channel insights.',
    website: createDemoWebsite('funnelnote'),
    categorySlug: 'marketing',
    tags: ['Experiment notes', 'Funnel insights', 'Channel learning'],
    aiSummary:
      'FunnelNote helps marketing teams preserve what they learn from experiments, making channel decisions easier to compare over time.',
    seoDescription:
      'Discover FunnelNote, a marketing repository for campaign experiments, funnel notes, and channel performance insights.',
  },
  {
    slug: 'skillfoundry',
    name: 'SkillFoundry',
    description: 'Workforce learning platform for skill maps, role paths, and practice reviews.',
    website: createDemoWebsite('skillfoundry'),
    categorySlug: 'education',
    tags: ['Skill maps', 'Role paths', 'Practice reviews'],
    aiSummary:
      'SkillFoundry is useful for teams building internal academies where employees need clear skill paths and reviewable practice work.',
    seoDescription:
      'Review SkillFoundry, an education platform for workforce skill maps, role paths, and practice review workflows.',
  },
  {
    slug: 'daywell',
    name: 'DayWell',
    description: 'Personal routines app for wellness plans, habit context, and coach notes.',
    website: createDemoWebsite('daywell'),
    categorySlug: 'consumer',
    tags: ['Wellness routines', 'Habit tracking', 'Coach notes'],
    aiSummary:
      'DayWell gives consumers a calmer way to connect routines, notes, and lightweight coaching context without turning wellness into heavy tracking.',
    seoDescription:
      'Find DayWell, a consumer wellness app for routines, habit context, personal plans, and coach notes.',
  },
  {
    slug: 'processoak',
    name: 'ProcessOak',
    description: 'Enterprise process registry for policy owners, controls, and change requests.',
    website: createDemoWebsite('processoak'),
    categorySlug: 'enterprise-software',
    tags: ['Process registry', 'Policy owners', 'Change requests'],
    aiSummary:
      'ProcessOak helps enterprise operators maintain process ownership and control context as teams request changes across departments.',
    seoDescription:
      'Explore ProcessOak, enterprise software for process registries, policy ownership, controls, and change requests.',
  },
  {
    slug: 'routebeacon',
    name: 'RouteBeacon',
    description: 'Delivery visibility layer for route delays, exception notes, and customer updates.',
    website: createDemoWebsite('routebeacon'),
    categorySlug: 'logistics',
    tags: ['Route visibility', 'Delay notes', 'Customer updates'],
    aiSummary:
      'RouteBeacon gives logistics teams a cleaner communication layer when delivery exceptions need customer-facing updates and internal follow-up.',
    seoDescription:
      'Learn about RouteBeacon, a logistics platform for route visibility, delivery delays, exception notes, and customer updates.',
  },
  {
    slug: 'leaselens',
    name: 'LeaseLens',
    description: 'Lease analysis workspace for rent rolls, renewal dates, and portfolio notes.',
    website: createDemoWebsite('leaselens'),
    categorySlug: 'real-estate',
    tags: ['Lease analysis', 'Rent rolls', 'Portfolio notes'],
    aiSummary:
      'LeaseLens supports real estate operators who need faster access to renewal risks, tenant context, and portfolio-level lease notes.',
    seoDescription:
      'Compare LeaseLens, a real estate workspace for lease analysis, rent rolls, renewal dates, and portfolio notes.',
  },
  {
    slug: 'docketflow',
    name: 'DocketFlow',
    description: 'Matter management board for legal deadlines, stakeholders, and review status.',
    website: createDemoWebsite('docketflow'),
    categorySlug: 'legaltech',
    tags: ['Matter management', 'Legal deadlines', 'Review status'],
    aiSummary:
      'DocketFlow helps legal teams keep matter context, review stages, and stakeholder ownership visible before deadlines become urgent.',
    seoDescription:
      'Review DocketFlow, a legaltech matter management board for deadlines, stakeholders, and legal review status.',
  },
  {
    slug: 'peoplesignal',
    name: 'PeopleSignal',
    description: 'Employee feedback and workforce planning hub for people operations teams.',
    website: createDemoWebsite('peoplesignal'),
    categorySlug: 'hrtech',
    tags: ['Employee feedback', 'Workforce planning', 'People ops'],
    aiSummary:
      'PeopleSignal helps HR teams connect employee feedback with workforce planning so leaders can spot organizational pressure earlier.',
    seoDescription:
      'Discover PeopleSignal, an HRTech hub for employee feedback, workforce planning, and people operations insights.',
  },
  {
    slug: 'channelforge',
    name: 'ChannelForge',
    description: 'Media distribution planner for episode launches, sponsorship notes, and channels.',
    website: createDemoWebsite('channelforge'),
    categorySlug: 'media',
    tags: ['Distribution planning', 'Sponsorship notes', 'Channel ops'],
    aiSummary:
      'ChannelForge is built for media teams coordinating launches across channels, sponsors, and recurring content calendars.',
    seoDescription:
      'Explore ChannelForge, a media planning platform for distribution workflows, episode launches, sponsorship notes, and channel operations.',
  },
  {
    slug: 'northstar-fieldworks',
    name: 'Northstar Fieldworks',
    description: 'Field operations consultancy for research visits, service audits, and playbooks.',
    website: createDemoWebsite('northstar-fieldworks'),
    categorySlug: 'other',
    tags: ['Field operations', 'Service audits', 'Playbooks'],
    aiSummary:
      'Northstar Fieldworks fits teams that need structured field research, audit notes, and operational playbooks outside a standard SaaS category.',
    seoDescription:
      'Find Northstar Fieldworks, a field operations consultancy for research visits, service audits, and operational playbooks.',
  },
];

interface CompanyFixtureDraft {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  tags: string[];
  aiSummary: string;
  seoDescription: string;
}

const ADDITIONAL_COMPANY_FIXTURE_DRAFTS: CompanyFixtureDraft[] = [
  {
    slug: 'askvector',
    name: 'AskVector',
    description: 'AI workspace for searchable research archives, briefs, and source notes.',
    categorySlug: 'ai-tools',
    tags: ['Research archive', 'Brief generation', 'Source notes'],
    aiSummary:
      'AskVector is useful for teams that need AI-assisted retrieval across market notes, saved sources, and recurring research briefs.',
    seoDescription:
      'Explore AskVector, an AI research workspace for searchable archives, business briefs, and source-note workflows.',
  },
  {
    slug: 'modelmesa',
    name: 'ModelMesa',
    description: 'Prompt evaluation desk for comparing model outputs, policies, and review notes.',
    categorySlug: 'ai-tools',
    tags: ['Prompt testing', 'Model review', 'AI governance'],
    aiSummary:
      'ModelMesa helps AI product teams compare model behavior and keep review evidence close to prompt and policy changes.',
    seoDescription:
      'Review ModelMesa, an AI tool for prompt evaluation, model output comparison, and governance review notes.',
  },
  {
    slug: 'payharbor',
    name: 'PayHarbor',
    description: 'Payment operations console for failed charges, dunning, and reconciliation notes.',
    categorySlug: 'fintech',
    tags: ['Payment ops', 'Dunning', 'Reconciliation'],
    aiSummary:
      'PayHarbor is positioned for subscription teams that need cleaner visibility into revenue recovery and payment exceptions.',
    seoDescription:
      'Compare PayHarbor, a fintech console for payment operations, failed charges, dunning, and reconciliation workflows.',
  },
  {
    slug: 'creditloom',
    name: 'CreditLoom',
    description: 'Credit decision support for underwriting notes, risk signals, and approval trails.',
    categorySlug: 'fintech',
    tags: ['Underwriting', 'Risk signals', 'Approval trails'],
    aiSummary:
      'CreditLoom gives finance operators a structured layer for credit review context before approvals move to final decisioning.',
    seoDescription:
      'Explore CreditLoom, a fintech platform for underwriting notes, credit risk signals, and approval trails.',
  },
  {
    slug: 'pitchcraft',
    name: 'PitchCraft',
    description: 'Go-to-market studio for launch positioning, sales decks, and campaign pages.',
    categorySlug: 'agencies',
    tags: ['GTM strategy', 'Sales decks', 'Launch pages'],
    aiSummary:
      'PitchCraft fits software teams that need sharper launch assets and consistent market narrative across sales and web channels.',
    seoDescription:
      'Find PitchCraft, a go-to-market agency for launch positioning, sales decks, and campaign page development.',
  },
  {
    slug: 'northmade',
    name: 'Northmade',
    description: 'Product design partner for workflow audits, prototypes, and design systems.',
    categorySlug: 'agencies',
    tags: ['Product design', 'Workflow audits', 'Design systems'],
    aiSummary:
      'Northmade is best matched with product teams that need practical UX audits and design-system work tied to operational workflows.',
    seoDescription:
      'Learn about Northmade, a product design agency for workflow audits, prototypes, and design system projects.',
  },
  {
    slug: 'trendquarry',
    name: 'TrendQuarry',
    description: 'Market analytics monitor for category movement, demand shifts, and signal boards.',
    categorySlug: 'analytics',
    tags: ['Market analytics', 'Demand signals', 'Trend boards'],
    aiSummary:
      'TrendQuarry helps analysts turn scattered market movements into structured category signals for leadership and planning teams.',
    seoDescription:
      'Explore TrendQuarry, an analytics monitor for market trends, demand signals, and category movement boards.',
  },
  {
    slug: 'cohortmint',
    name: 'CohortMint',
    description: 'Retention analytics tool for cohort health, lifecycle events, and activation paths.',
    categorySlug: 'analytics',
    tags: ['Retention analytics', 'Cohorts', 'Activation'],
    aiSummary:
      'CohortMint gives growth teams a focused view of retention and activation behavior without requiring a heavyweight data stack.',
    seoDescription:
      'Compare CohortMint, an analytics tool for retention cohorts, lifecycle events, and activation path analysis.',
  },
  {
    slug: 'medrelay',
    name: 'MedRelay',
    description: 'Secure referral coordination board for clinics, specialists, and patient updates.',
    categorySlug: 'healthtech',
    tags: ['Referrals', 'Specialist coordination', 'Patient updates'],
    aiSummary:
      'MedRelay helps clinics reduce referral drift by keeping patient context, specialist handoffs, and update status visible.',
    seoDescription:
      'Discover MedRelay, a healthtech referral coordination board for clinics, specialists, and patient updates.',
  },
  {
    slug: 'vitalledger',
    name: 'VitalLedger',
    description: 'Care operations log for patient tasks, staff notes, and daily clinic handovers.',
    categorySlug: 'healthtech',
    tags: ['Care operations', 'Staff notes', 'Clinic handovers'],
    aiSummary:
      'VitalLedger gives care teams a lightweight operational record for daily handovers and patient-related action items.',
    seoDescription:
      'Review VitalLedger, a healthtech care operations log for patient tasks, staff notes, and clinic handovers.',
  },
  {
    slug: 'compounddesk',
    name: 'CompoundDesk',
    description: 'Pharma portfolio tracker for molecule notes, study milestones, and partner updates.',
    categorySlug: 'biotech-pharma',
    tags: ['Portfolio tracking', 'Study milestones', 'Partner updates'],
    aiSummary:
      'CompoundDesk helps pharma operators coordinate study milestones and partner-facing context across early portfolio work.',
    seoDescription:
      'Explore CompoundDesk, a biotech and pharma tracker for molecule notes, study milestones, and partner updates.',
  },
  {
    slug: 'labbridge',
    name: 'LabBridge',
    description: 'Research collaboration hub for experiment requests, protocols, and lab notes.',
    categorySlug: 'biotech-pharma',
    tags: ['Experiment requests', 'Protocols', 'Lab notes'],
    aiSummary:
      'LabBridge supports research teams that need cleaner collaboration around protocols, experiment queues, and shared lab context.',
    seoDescription:
      'Find LabBridge, a biotech collaboration hub for experiment requests, protocols, and lab-note workflows.',
  },
  {
    slug: 'retailnorth',
    name: 'RetailNorth',
    description: 'Retail operations planner for inventory campaigns, store notes, and channel tasks.',
    categorySlug: 'ecommerce',
    tags: ['Retail ops', 'Inventory campaigns', 'Channel tasks'],
    aiSummary:
      'RetailNorth helps commerce teams coordinate online and offline retail work when inventory, campaigns, and store context overlap.',
    seoDescription:
      'Discover RetailNorth, an e-commerce operations planner for inventory campaigns, store notes, and channel tasks.',
  },
  {
    slug: 'cartsignal',
    name: 'CartSignal',
    description: 'Checkout optimization assistant for abandonment signals and revenue experiments.',
    categorySlug: 'ecommerce',
    tags: ['Checkout', 'Abandonment', 'Revenue experiments'],
    aiSummary:
      'CartSignal gives commerce operators a focused view of checkout friction and experiment history tied to revenue recovery.',
    seoDescription:
      'Review CartSignal, an e-commerce assistant for checkout optimization, abandonment signals, and revenue experiments.',
  },
  {
    slug: 'accesspine',
    name: 'AccessPine',
    description: 'Identity review workspace for access requests, owner approvals, and audit notes.',
    categorySlug: 'cybersecurity',
    tags: ['Identity review', 'Access requests', 'Audit notes'],
    aiSummary:
      'AccessPine helps teams make access reviews more traceable by connecting owner approvals with audit-ready notes.',
    seoDescription:
      'Learn about AccessPine, a cybersecurity workspace for identity reviews, access requests, approvals, and audit notes.',
  },
  {
    slug: 'threatfolio',
    name: 'ThreatFolio',
    description: 'Threat briefing tracker for incident notes, mitigations, and executive summaries.',
    categorySlug: 'cybersecurity',
    tags: ['Threat briefings', 'Mitigations', 'Incident notes'],
    aiSummary:
      'ThreatFolio supports security teams that need a concise briefing layer between incident details and leadership communication.',
    seoDescription:
      'Compare ThreatFolio, a cybersecurity tracker for threat briefings, incident notes, mitigations, and executive summaries.',
  },
  {
    slug: 'apicabinet',
    name: 'ApiCabinet',
    description: 'API inventory manager for endpoints, owners, docs, and deprecation plans.',
    categorySlug: 'developer-tools',
    tags: ['API inventory', 'Owners', 'Deprecation plans'],
    aiSummary:
      'ApiCabinet helps platform teams keep API ownership and lifecycle context clear as products and integrations change.',
    seoDescription:
      'Explore ApiCabinet, a developer tool for API inventory, endpoint owners, documentation, and deprecation planning.',
  },
  {
    slug: 'codetide',
    name: 'CodeTide',
    description: 'Engineering planning board for technical debt, code ownership, and sprint risk.',
    categorySlug: 'developer-tools',
    tags: ['Technical debt', 'Code ownership', 'Sprint risk'],
    aiSummary:
      'CodeTide gives engineering leaders a practical way to track technical debt and ownership risks across delivery cycles.',
    seoDescription:
      'Review CodeTide, a developer tool for technical debt planning, code ownership, and sprint risk visibility.',
  },
  {
    slug: 'meetingmint',
    name: 'MeetingMint',
    description: 'Meeting intelligence workspace for agendas, commitments, and follow-up trails.',
    categorySlug: 'productivity',
    tags: ['Agendas', 'Commitments', 'Follow-up'],
    aiSummary:
      'MeetingMint helps teams convert recurring conversations into accountable commitments and searchable decision history.',
    seoDescription:
      'Explore MeetingMint, a productivity workspace for agendas, meeting commitments, and follow-up trails.',
  },
  {
    slug: 'taskharbor',
    name: 'TaskHarbor',
    description: 'Personal work queue for priority triage, project context, and weekly reviews.',
    categorySlug: 'productivity',
    tags: ['Priority triage', 'Project context', 'Weekly reviews'],
    aiSummary:
      'TaskHarbor is useful for operators who need a quieter work queue that connects daily tasks with weekly planning context.',
    seoDescription:
      'Find TaskHarbor, a productivity app for priority triage, project context, and weekly review workflows.',
  },
  {
    slug: 'brandrelay',
    name: 'BrandRelay',
    description: 'Brand asset workflow for campaign kits, approvals, and partner-ready files.',
    categorySlug: 'marketing',
    tags: ['Brand assets', 'Approvals', 'Partner files'],
    aiSummary:
      'BrandRelay helps marketing teams keep campaign assets, approvals, and partner distribution files organized around launches.',
    seoDescription:
      'Discover BrandRelay, a marketing workflow for brand assets, campaign kits, approvals, and partner-ready files.',
  },
  {
    slug: 'audiencemap',
    name: 'AudienceMap',
    description: 'Audience research platform for segment notes, interviews, and messaging tests.',
    categorySlug: 'marketing',
    tags: ['Audience research', 'Segments', 'Messaging tests'],
    aiSummary:
      'AudienceMap gives marketers a structured place to connect audience interviews with segments and messaging experiments.',
    seoDescription:
      'Review AudienceMap, a marketing platform for audience research, segment notes, interviews, and messaging tests.',
  },
  {
    slug: 'mentorloop',
    name: 'MentorLoop',
    description: 'Mentorship program manager for goals, sessions, and development milestones.',
    categorySlug: 'education',
    tags: ['Mentorship', 'Learning goals', 'Development milestones'],
    aiSummary:
      'MentorLoop helps education and people teams run mentorship programs with clear goals, session notes, and milestone tracking.',
    seoDescription:
      'Explore MentorLoop, an education platform for mentorship programs, learning goals, sessions, and development milestones.',
  },
  {
    slug: 'lessonbeam',
    name: 'LessonBeam',
    description: 'Lesson planning assistant for instructors creating modules, rubrics, and reviews.',
    categorySlug: 'education',
    tags: ['Lesson planning', 'Rubrics', 'Instructor reviews'],
    aiSummary:
      'LessonBeam supports instructors who need faster curriculum planning while keeping rubrics and learner review points consistent.',
    seoDescription:
      'Find LessonBeam, an education assistant for lesson planning, modules, rubrics, and instructor review workflows.',
  },
  {
    slug: 'familyvault',
    name: 'FamilyVault',
    description: 'Household document organizer for policies, warranties, and family records.',
    categorySlug: 'consumer',
    tags: ['Household documents', 'Warranties', 'Family records'],
    aiSummary:
      'FamilyVault helps consumers keep important household and family documents organized around renewal dates and service events.',
    seoDescription:
      'Discover FamilyVault, a consumer organizer for household documents, policies, warranties, and family records.',
  },
  {
    slug: 'tripledger',
    name: 'TripLedger',
    description: 'Travel planning notebook for itineraries, receipts, notes, and shared budgets.',
    categorySlug: 'consumer',
    tags: ['Travel planning', 'Receipts', 'Shared budgets'],
    aiSummary:
      'TripLedger gives travelers a practical place to manage itinerary context, trip costs, and shared planning notes.',
    seoDescription:
      'Review TripLedger, a consumer travel notebook for itineraries, receipts, notes, and shared trip budgets.',
  },
  {
    slug: 'governbase',
    name: 'GovernBase',
    description: 'Governance workspace for policy changes, committee notes, and risk decisions.',
    categorySlug: 'enterprise-software',
    tags: ['Governance', 'Policy changes', 'Risk decisions'],
    aiSummary:
      'GovernBase helps enterprise teams maintain a traceable record of governance decisions and policy change context.',
    seoDescription:
      'Explore GovernBase, enterprise software for governance workspaces, policy changes, committee notes, and risk decisions.',
  },
  {
    slug: 'vendoratlas',
    name: 'VendorAtlas',
    description: 'Vendor management layer for renewals, owner notes, and procurement context.',
    categorySlug: 'enterprise-software',
    tags: ['Vendor management', 'Renewals', 'Procurement'],
    aiSummary:
      'VendorAtlas gives procurement and operations teams a clearer system for vendor ownership, renewals, and contract context.',
    seoDescription:
      'Compare VendorAtlas, enterprise software for vendor management, renewals, owner notes, and procurement workflows.',
  },
  {
    slug: 'dockpilot',
    name: 'DockPilot',
    description: 'Warehouse dock scheduler for arrivals, exceptions, and carrier communication.',
    categorySlug: 'logistics',
    tags: ['Dock scheduling', 'Carrier communication', 'Warehouse ops'],
    aiSummary:
      'DockPilot helps warehouse teams coordinate arrivals and exceptions before dock congestion becomes a downstream delivery issue.',
    seoDescription:
      'Learn about DockPilot, a logistics scheduler for warehouse docks, carrier arrivals, exceptions, and communication.',
  },
  {
    slug: 'parcelnorth',
    name: 'ParcelNorth',
    description: 'Parcel operations monitor for SLA risk, delivery notes, and support escalations.',
    categorySlug: 'logistics',
    tags: ['Parcel ops', 'SLA risk', 'Support escalations'],
    aiSummary:
      'ParcelNorth gives logistics and support teams a shared picture of parcel risk, customer updates, and escalation context.',
    seoDescription:
      'Explore ParcelNorth, a logistics monitor for parcel operations, SLA risk, delivery notes, and support escalations.',
  },
  {
    slug: 'propertysignal',
    name: 'PropertySignal',
    description: 'Property intelligence board for comps, owner notes, and market movement.',
    categorySlug: 'real-estate',
    tags: ['Property intelligence', 'Comps', 'Market movement'],
    aiSummary:
      'PropertySignal helps real estate teams compare local context, owner notes, and market activity across target properties.',
    seoDescription:
      'Compare PropertySignal, a real estate intelligence board for comps, owner notes, and market movement.',
  },
  {
    slug: 'buildledger',
    name: 'BuildLedger',
    description: 'Development project tracker for permits, budgets, vendors, and milestone notes.',
    categorySlug: 'real-estate',
    tags: ['Development projects', 'Permits', 'Budgets'],
    aiSummary:
      'BuildLedger supports real estate operators coordinating development milestones, budget notes, and vendor progress in one place.',
    seoDescription:
      'Review BuildLedger, a real estate tracker for development projects, permits, budgets, vendors, and milestones.',
  },
  {
    slug: 'briefnorth',
    name: 'BriefNorth',
    description: 'Legal briefing workspace for research notes, matter context, and argument drafts.',
    categorySlug: 'legaltech',
    tags: ['Legal briefs', 'Research notes', 'Matter context'],
    aiSummary:
      'BriefNorth helps legal teams assemble research context and argument drafts without losing the link to matter-specific notes.',
    seoDescription:
      'Explore BriefNorth, a legaltech workspace for legal briefs, research notes, matter context, and argument drafts.',
  },
  {
    slug: 'complianceforge',
    name: 'ComplianceForge',
    description: 'Compliance operations tracker for obligations, evidence, and reviewer comments.',
    categorySlug: 'legaltech',
    tags: ['Compliance ops', 'Obligations', 'Evidence'],
    aiSummary:
      'ComplianceForge gives legal and operations teams a structured record of obligations, evidence, and reviewer feedback.',
    seoDescription:
      'Find ComplianceForge, a legaltech tracker for compliance operations, obligations, evidence, and reviewer comments.',
  },
  {
    slug: 'onboardly',
    name: 'Onboardly',
    description: 'Employee onboarding system for readiness plans, buddy notes, and first-week tasks.',
    categorySlug: 'hrtech',
    tags: ['Onboarding', 'Readiness plans', 'Buddy notes'],
    aiSummary:
      'Onboardly helps people teams make new-hire readiness visible across managers, buddies, and HR operations.',
    seoDescription:
      'Discover Onboardly, an HRTech onboarding system for readiness plans, buddy notes, and first-week tasks.',
  },
  {
    slug: 'rolecraft',
    name: 'RoleCraft',
    description: 'Role architecture workspace for job families, leveling notes, and hiring criteria.',
    categorySlug: 'hrtech',
    tags: ['Role architecture', 'Leveling', 'Hiring criteria'],
    aiSummary:
      'RoleCraft supports people teams that need consistent role definitions and hiring criteria across growing organizations.',
    seoDescription:
      'Review RoleCraft, an HRTech workspace for role architecture, job families, leveling notes, and hiring criteria.',
  },
  {
    slug: 'newsletterdesk',
    name: 'NewsletterDesk',
    description: 'Newsletter operations hub for issues, sponsor slots, edits, and audience notes.',
    categorySlug: 'media',
    tags: ['Newsletter ops', 'Sponsor slots', 'Audience notes'],
    aiSummary:
      'NewsletterDesk helps media teams coordinate recurring issues, sponsorship inventory, and editorial notes in one workflow.',
    seoDescription:
      'Explore NewsletterDesk, a media operations hub for newsletters, sponsor slots, edits, and audience notes.',
  },
  {
    slug: 'clipharbor',
    name: 'ClipHarbor',
    description: 'Short-form media planner for clips, hooks, review queues, and publishing status.',
    categorySlug: 'media',
    tags: ['Short-form media', 'Hooks', 'Publishing status'],
    aiSummary:
      'ClipHarbor gives content teams a simple way to manage clip ideas, review queues, and publishing readiness across channels.',
    seoDescription:
      'Find ClipHarbor, a media planner for short-form clips, hooks, review queues, and publishing status.',
  },
  {
    slug: 'opsnomad',
    name: 'OpsNomad',
    description: 'Flexible operations toolkit for pop-up teams, field programs, and special projects.',
    categorySlug: 'other',
    tags: ['Special projects', 'Field programs', 'Operations toolkit'],
    aiSummary:
      'OpsNomad fits teams running temporary programs or unusual operating models that still need repeatable project context.',
    seoDescription:
      'Explore OpsNomad, a flexible operations toolkit for pop-up teams, field programs, and special projects.',
  },
  {
    slug: 'civicthread',
    name: 'CivicThread',
    description: 'Community program tracker for partners, grants, event notes, and service metrics.',
    categorySlug: 'other',
    tags: ['Community programs', 'Grants', 'Service metrics'],
    aiSummary:
      'CivicThread supports community and nonprofit teams that need partner context, grant notes, and service metrics in one place.',
    seoDescription:
      'Discover CivicThread, a program tracker for community partners, grants, event notes, and service metrics.',
  },
];

const ADDITIONAL_COMPANY_FIXTURES: CompanyFixture[] =
  ADDITIONAL_COMPANY_FIXTURE_DRAFTS.map((company) => ({
    ...company,
    website: createDemoWebsite(company.slug),
  }));

const LAUNCH_CATEGORY_PROFILE_LIMITS: Record<string, number> = {
  'agencies': 3,
  'ai-tools': 3,
  'analytics': 2,
  'biotech-pharma': 3,
  'consumer': 1,
  'cybersecurity': 2,
  'developer-tools': 3,
  'ecommerce': 2,
  'education': 2,
  'enterprise-software': 2,
  'fintech': 2,
  'healthtech': 2,
  'hrtech': 2,
  'legaltech': 1,
  'logistics': 1,
  'marketing': 2,
  'media': 1,
  'other': 2,
  'productivity': 2,
  'real-estate': 2,
};

export const COMPANY_FIXTURES: CompanyFixture[] = [
  ...BASE_COMPANY_FIXTURES,
  ...ADDITIONAL_COMPANY_FIXTURES,
]
  .filter(createCategoryLimitFilter())
  .map((company) => ({
    ...company,
    website: createDemoWebsite(company.slug),
  }));

function createDemoWebsite(slug: string): string {
  return `https://www.${slug.replace(/-/g, '')}.co`;
}

function createCategoryLimitFilter(): (company: CompanyFixture) => boolean {
  const includedByCategory = new Map<string, number>();

  return (company) => {
    const categoryCount = includedByCategory.get(company.categorySlug) ?? 0;
    const categoryLimit = LAUNCH_CATEGORY_PROFILE_LIMITS[company.categorySlug] ?? 1;
    const shouldInclude = categoryCount < categoryLimit;

    if (shouldInclude) {
      includedByCategory.set(company.categorySlug, categoryCount + 1);
    }

    return shouldInclude;
  };
}
