import { PrismaClient, Role, ProblemStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { urgencyRanks } from "../src/lib/domain";
import { demoAccountsAllowed } from "../src/lib/production";
try {
  process.loadEnvFile(".env");
} catch {
  /* Hosted environments inject variables. */
}
const db = new PrismaClient();
async function main() {
  if (!demoAccountsAllowed())
    throw new Error(
      "Demo seeding is disabled in production unless ALLOW_DEMO_ACCOUNTS=true is explicitly configured.",
    );
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Set DEMO_PASSWORD (12+ characters) explicitly before seeding demo accounts.");
  const passwordHash = await hash(password, 12);
  const orgs = await Promise.all(
    [
      {
        id: "demo-org-iit",
        name: "IIT Bombay",
        type: "INSTITUTION",
        city: "Mumbai",
        description:
          "Illustrative academic partner supporting community-centered engineering research.",
      },
      {
        id: "demo-org-tata",
        name: "Tata Social Lab",
        type: "INDUSTRY",
        city: "Mumbai",
        description: "Fictional demonstration organization for mentorship and resource support.",
      },
      {
        id: "demo-org-nit",
        name: "NIT Tiruchirappalli",
        type: "INSTITUTION",
        city: "Tiruchirappalli",
        description: "Illustrative academic partner for interdisciplinary student innovation.",
      },
      {
        id: "demo-org-green",
        name: "Green India Collective",
        type: "NGO",
        city: "Bengaluru",
        description: "Fictional community organization supporting sustainable local solutions.",
      },
    ].map((o) =>
      db.organization.upsert({
        where: { id: o.id },
        create: { ...o, verified: true, isDemo: true },
        update: {},
      }),
    ),
  );
  const users = await Promise.all(
    [
      { role: Role.CITIZEN, name: "Aarav Sharma" },
      { role: Role.RESEARCHER, name: "Priya Kulkarni" },
      { role: Role.INSTITUTION, name: "Dr. Meera Iyer" },
      { role: Role.INDUSTRY, name: "Rohan Mehta" },
      { role: Role.ADMIN, name: "Platform Administrator" },
    ].map((u) =>
      db.user.upsert({
        where: { email: `${u.role.toLowerCase()}@demo.civicbridge.in` },
        create: {
          id: `demo-${u.role.toLowerCase()}`,
          email: `${u.role.toLowerCase()}@demo.civicbridge.in`,
          name: u.name,
          role: u.role,
          passwordHash,
          isDemo: true,
          bio: "Demonstration account for the CivicBridge innovation ecosystem.",
          skills: u.role === "RESEARCHER" ? ["IoT", "water", "sensors", "agriculture"] : [],
          interests: u.role === "RESEARCHER" ? ["Water Conservation", "Agriculture"] : [],
          organizationId:
            u.role === "INSTITUTION" || u.role === "RESEARCHER"
              ? orgs[0].id
              : u.role === "INDUSTRY"
                ? orgs[1].id
                : null,
        },
        update: { passwordHash },
      }),
    ),
  );
  const citizen = users[0],
    researcher = users[1],
    admin = users[4];
  const team = await db.team.upsert({
    where: { id: "demo-team-jal" },
    create: {
      id: "demo-team-jal",
      name: "Team JalSetu",
      description:
        "Student engineers building accessible water and agriculture technology with local communities.",
      organizationId: orgs[0].id,
      verified: true,
      isDemo: true,
      members: { create: [{ userId: researcher.id, role: "LEAD", accepted: true }] },
    },
    update: {},
  });
  const problems = [
    {
      id: "demo-water-rajasthan",
      title: "A reliable water source for every home in Kheda",
      description:
        "Over 850 residents in Kheda village depend on a single borewell that runs dry during summer. Women walk more than three kilometers to collect water, and tanker deliveries are inconsistent. The community needs a sustainable approach to rainwater harvesting, groundwater monitoring, and fair distribution.",
      category: "Water Conservation",
      urgency: "CRITICAL",
      state: "Rajasthan",
      city: "Kheda",
      area: "Village center",
      latitude: 26.9124,
      longitude: 75.7873,
      population: 850,
      status: "OPEN",
    },
    {
      id: "demo-waste-mumbai",
      title: "Rethinking waste collection in Dharavi’s lanes",
      description:
        "Narrow residential lanes in Dharavi receive irregular waste collection. Mixed waste builds up near community spaces and blocks drains during the monsoon. Residents are looking for a practical segregation and collection system that works for densely populated neighborhoods and supports local waste workers.",
      category: "Waste Management",
      urgency: "HIGH",
      state: "Maharashtra",
      city: "Mumbai",
      area: "Dharavi",
      latitude: 19.038,
      longitude: 72.8538,
      population: 12000,
      status: "OPEN",
    },
    {
      id: "demo-farm-nashik",
      title: "Helping small farms make every drop count",
      description:
        "Smallholder farmers in Nashik rely on fixed irrigation schedules regardless of soil moisture. Water and electricity are wasted while uneven watering reduces crop yields. A low-cost solution should work with unreliable connectivity, support Marathi instructions, and be maintainable by local farmers.",
      category: "Agriculture",
      urgency: "HIGH",
      state: "Maharashtra",
      city: "Nashik",
      area: "Dindori farming cluster",
      latitude: 20.25,
      longitude: 73.96,
      population: 450,
      status: "OPEN",
    },
    {
      id: "demo-bus-pune",
      title: "Making city buses accessible to everyone",
      description:
        "Wheelchair users and elderly passengers in Pune struggle to identify accessible bus stops and reliable boarding points. Bus route information does not consistently describe accessibility features. We need community-verified route information and an accessible journey planning experience.",
      category: "Transportation",
      urgency: "MEDIUM",
      state: "Maharashtra",
      city: "Pune",
      area: "Shivajinagar",
      latitude: 18.531,
      longitude: 73.847,
      population: 5000,
      status: "COLLABORATION",
    },
    {
      id: "demo-school-bihar",
      title: "A safer, brighter classroom for rural students",
      description:
        "A government primary school outside Patna has damaged classroom roofs, intermittent electricity, and no functioning digital learning space. Teachers want a maintainable, low-energy learning setup and a transparent way to prioritize infrastructure repairs with local community participation.",
      category: "Education",
      urgency: "HIGH",
      state: "Bihar",
      city: "Patna",
      area: "Bihta",
      latitude: 25.562,
      longitude: 84.874,
      population: 320,
      status: "UNDER_REVIEW",
    },
    {
      id: "demo-water-chennai",
      title: "Restoring neighborhood rainwater resilience",
      description:
        "Residents in a Chennai neighborhood faced seasonal flooding despite recurring summer water shortages. Community volunteers worked with researchers to map drains, restore recharge pits, and install low-cost water level monitors. The completed pilot is ready to share lessons with other neighborhoods.",
      category: "Water Conservation",
      urgency: "HIGH",
      state: "Tamil Nadu",
      city: "Chennai",
      area: "Velachery",
      latitude: 12.9815,
      longitude: 80.218,
      population: 2400,
      status: "RESOLVED",
    },
    {
      id: "demo-farm-bengaluru",
      title: "Bringing affordable soil intelligence to small farms",
      description:
        "Farmers on Bengaluru’s rural outskirts need reliable soil moisture information to reduce irrigation costs. A student-built sensor network is being piloted with local growers, using solar-powered devices and simple mobile alerts to guide decisions without continuous internet access.",
      category: "Agriculture",
      urgency: "MEDIUM",
      state: "Karnataka",
      city: "Bengaluru",
      area: "Devanahalli",
      latitude: 13.246,
      longitude: 77.713,
      population: 620,
      status: "PILOT",
    },
    {
      id: "demo-health-assam",
      title: "Connecting remote communities to primary care",
      description:
        "Villages near Jorhat face long travel times for basic health consultations. Community health workers need an offline-capable scheduling and referral tool that can sync when a mobile connection becomes available, with simple interfaces for Assamese-speaking residents.",
      category: "Healthcare",
      urgency: "MEDIUM",
      state: "Assam",
      city: "Jorhat",
      area: "Teok",
      latitude: 26.797,
      longitude: 94.311,
      population: 1800,
      status: "OPEN",
    },
  ];
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    const createdAt = new Date();
    createdAt.setUTCMonth(createdAt.getUTCMonth() - (i % 6));
    createdAt.setUTCDate(Math.min(20, i + 2));
    await db.problem.upsert({
      where: { id: p.id },
      create: {
        ...p,
        urgency: p.urgency as "HIGH",
        urgencyRank: urgencyRanks[p.urgency],
        status: p.status as ProblemStatus,
        authorId: citizen.id,
        isDemo: true,
        createdAt,
      },
      update: {},
    });
    const stages = [
      "REPORTED",
      "UNDER_REVIEW",
      ...(p.status !== "UNDER_REVIEW" ? ["OPEN"] : []),
      ...(["COLLABORATION", "PILOT", "RESOLVED"].includes(p.status) ? ["COLLABORATION"] : []),
      ...(["PILOT", "RESOLVED"].includes(p.status) ? ["PILOT"] : []),
      ...(p.status === "RESOLVED" ? ["RESOLVED"] : []),
    ];
    for (let j = 0; j < stages.length; j++)
      await db.auditLog.upsert({
        where: { id: `${p.id}-event-${j}` },
        create: {
          id: `${p.id}-event-${j}`,
          actorId: admin.id,
          entityType: "Problem",
          entityId: p.id,
          action: j ? "STATUS_CHANGED" : "REPORTED",
          fromStatus: stages[j - 1],
          toStatus: stages[j],
          note: "Seeded demonstration lifecycle event",
          createdAt: new Date(createdAt.getTime() + j * 86400000),
        },
        update: {},
      });
  }
  const solutions = [
    {
      id: "demo-solution-rain",
      problemId: "demo-water-chennai",
      title: "JalSetu: rainwater that stays in the community",
      status: "COMPLETED",
      impact:
        "The demonstration pilot serves 2,400 residents with restored recharge pits and transparent water-level monitoring. Impact figures are illustrative, not externally verified.",
    },
    {
      id: "demo-solution-soil",
      problemId: "demo-farm-bengaluru",
      title: "SoilSense: small sensors, a bigger harvest",
      status: "PILOT",
      impact:
        "An ongoing demonstration pilot explores how solar-powered soil sensors can help 620 local residents make better irrigation decisions.",
    },
    {
      id: "demo-solution-access",
      problemId: "demo-bus-pune",
      title: "AccessRoute: a city that everyone can navigate",
      status: "APPROVED",
      impact:
        "A community-verified accessibility map designed to help elderly and disabled commuters find suitable bus routes.",
    },
  ];
  for (const s of solutions) {
    await db.solutionProposal.upsert({
      where: { id: s.id },
      create: {
        ...s,
        status: s.status as "COMPLETED",
        authorId: researcher.id,
        teamId: team.id,
        isDemo: true,
        approach:
          "Co-design the solution with local residents, deploy a small community-managed pilot, and measure outcomes through transparent feedback. Use accessible interfaces and locally available components. The pilot includes training for community volunteers and a documented maintenance plan.",
        techStack: "TypeScript, IoT sensors, MongoDB, solar-powered edge devices",
        feasibility:
          "The pilot uses off-the-shelf components and open-source tools. Local volunteers receive training, and the team validates maintenance costs before expanding.",
        resources:
          "Community testing space, two technical mentors, field deployment equipment, and local volunteer participation.",
      },
      update: {},
    });
    const c = await db.collaboration.upsert({
      where: { proposalId: s.id },
      create: { id: `collab-${s.id}`, proposalId: s.id },
      update: {},
    });
    for (let j = 0; j < 3; j++)
      await db.milestone.upsert({
        where: { id: `${s.id}-milestone-${j}` },
        create: {
          id: `${s.id}-milestone-${j}`,
          title: [
            "Community discovery and interviews",
            "Build and field-test the prototype",
            "Evaluate the pilot and share findings",
          ][j],
          description: "Document the outcome with feedback from local participants.",
          dueDate: new Date(Date.now() + (j - 1) * 14 * 86400000),
          completedAt: j === 0 || s.status === "COMPLETED" ? new Date() : null,
          verifiedAt: null,
          collaborationId: c.id,
        },
        update: {},
      });
  }
  await db.achievement.upsert({
    where: { userId_key: { userId: researcher.id, key: "approved:demo-solution-rain" } },
    create: {
      userId: researcher.id,
      key: "approved:demo-solution-rain",
      label: "Verified innovator",
      points: 50,
    },
    update: {},
  });
  await db.achievement.upsert({
    where: { userId_key: { userId: researcher.id, key: "completed:demo-solution-rain" } },
    create: {
      userId: researcher.id,
      key: "completed:demo-solution-rain",
      label: "Pilot pioneer",
      points: 150,
    },
    update: {},
  });
  await db.achievement.upsert({
    where: { userId_key: { userId: citizen.id, key: "resolved:demo-water-chennai" } },
    create: {
      userId: citizen.id,
      key: "resolved:demo-water-chennai",
      label: "Community changemaker",
      points: 100,
    },
    update: {},
  });
  for (const u of users)
    await db.notification.upsert({
      where: { id: `demo-welcome-${u.id}` },
      create: {
        id: `demo-welcome-${u.id}`,
        userId: u.id,
        title: "Welcome to CivicBridge",
        body: "This is your demonstration workspace. Explore challenges, collaborate, and turn ideas into impact.",
        href: "/dashboard",
      },
      update: {},
    });
  console.log(
    "Seed complete: five demo roles, eight reports, three innovations, and three collaboration workspaces. Demo password taken from DEMO_PASSWORD.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
