/** Academy — static editorial content (features/00 isn't the right place;
 * this is its own section, not part of the CV builder). Module/lesson
 * definitions and body copy live here, in code, rather than a DB table —
 * same reasoning as `TemplateId`: this is content the founder edits by
 * asking Claude, not user-generated data, so a migration per copy edit would
 * be the wrong tool. The DB only stores per-user completion
 * (`AcademyLessonProgress`, see repository.ts).
 *
 * Content is a curated slice of the founder's own Skool classroom
 * (candl-consulting-5721), ported over lesson by lesson. The "[AI]
 * Validating Your CV Against a Job Description" lesson from that classroom
 * is deliberately omitted — that's what the CV Optimizer report already
 * does in this app.
 *
 * Two access tiers, matching `hasActiveEntitlement` (see @cv-maker/contracts
 * billing.ts): `standaloneLessons` are free for every account; every lesson
 * inside a `group` requires an active entitlement (or ADMIN). */
import type { AcademyLessonBody } from "@cv-maker/contracts";

export type AcademyLessonDefinition = {
  slug: string;
  title: string;
  isFree: boolean;
  body: AcademyLessonBody;
};

export type AcademyGroupDefinition = {
  slug: string;
  title: string;
  lessons: AcademyLessonDefinition[];
};

function textLesson(
  slug: string,
  title: string,
  isFree: boolean,
  markdown: string,
): AcademyLessonDefinition {
  return { slug, title, isFree, body: { kind: "text", markdown: markdown.trim() } };
}

/** The 8 "LinkedIn Profile Optimisation" lessons are all short videos (11-18
 * min) in the source classroom, with no text/transcript to port. Shipped as
 * placeholders — see the plan this shipped from
 * (/Users/rneves/.claude/plans/streamed-brewing-pillow.md) — real videos get
 * wired in once they're supplied separately. */
function videoLesson(slug: string, title: string): AcademyLessonDefinition {
  return { slug, title, isFree: false, body: { kind: "video", placeholder: true } };
}

export const ACADEMY_STANDALONE_LESSONS: AcademyLessonDefinition[] = [
  textLesson(
    "credibility-building-trust",
    "Credibility: Building Trust That Gets You Hired",
    true,
    `
You're tired. I know.

The strategy work drained you. All that reflecting. All that honesty. All those questions that forced you to sit with uncomfortable truths about what you want and what you've been settling for.

It took energy you didn't think you had. But here's what I need you to understand: everything with the power to change requires investment, nurturing, and showing up when you're exhausted to do the work anyway. And you did that.

Now we turn all of that clarity into something the world can see.

## Why You're Not Getting Interviews

You've been doing everything you were told to do. Updating your CV. Applying to jobs. Tweaking keywords. Running your resume through AI tools that promise to optimize it for ATS systems.

And still, nothing. Or worse, rejections that don't even make sense because you know you're qualified.

Here's the truth most career advice won't tell you: the hiring market has changed, and you're still playing by the old rules.

You're trying to look like the most capable person in the pile — the one who knows the most frameworks, the one with the longest list of technical skills, the one who sounds the most impressive on paper. But companies aren't hiring for capability anymore. **They're hiring to mitigate risk.**

Every hiring manager has been burned. Every recruiter has championed someone who looked perfect and then couldn't deliver. Every team has suffered through a bad hire that set them back six months.

So when they read your CV, they're not thinking, "Wow, this person knows a lot." They're thinking, *"Can I trust this person? Will they solve problems or create them? Are they the safe bet?"*

And if your materials don't answer that question clearly, you don't get the interview. It doesn't matter how qualified you are.

## Why Everyone Sounds the Same

You know the story. Every CV reads like it was written by the same person. The same buzzwords. The same vague claims about being a "passionate team player" who "thrives in fast-paced environments." Half of them probably were written by the same AI tool.

And that's the problem. AI can mimic patterns. It can generate competent-sounding text. It can optimize for keywords. But it can't build trust. It can't communicate the deeper truth of who you are as a professional. It can't position you as someone worth betting on. It can't bridge the gap between what you've done and what the hiring manager actually needs.

That requires strategy, narrative, and clarity about what makes you different and why that difference matters. That's what we're building here.

## What This Module Does

We're going to take everything you've discovered about yourself, your strategy, and your experience and turn it into three resources that actually work:

- An ATS-friendly resume that gets past the filters and makes a human want to call you.
- A LinkedIn profile that positions you as the obvious choice for the roles you're targeting.
- A cover letter template that speaks directly to what companies need and why you're the one who can deliver it.

But here's what matters most: you're not just getting templates. You're learning the principles behind what works.

Because I don't want you to follow advice blindly. I want you to understand why certain language builds trust, why specific structures communicate competence, why one way of positioning yourself opens doors while another keeps them closed.

When you understand the why, you're not dependent on me or anyone else anymore. You become the expert on your own narrative.

## I Need You to Believe

I know you're exhausted. I know you've invested more energy into this process than you thought you had to give.

But you're here because what you've been doing wasn't working. Because hope isn't a strategy. Because spray and pray wasn't getting you closer to the role you actually want.

The work you've done so far matters. It's the foundation everything else is built on.

Now we make it visible. We turn your clarity into credibility. We build materials that don't just list what you've done — they demonstrate why it matters and why you're the safest bet in the room.

This is where everything changes. Let's build your credibility.
`,
  ),
  textLesson(
    "do-cvs-actually-matter",
    "Do CVs Actually Matter Anymore?",
    true,
    `
I need to address something you're probably thinking.

"Why am I spending all this time on my CV when AI is screening everything? When recruiters are drowning in applications? When everyone says it's all about networking anyway?"

Fair question. Let me show you what happened to me.

## Two Recruiters, Two Conversations, Same Result

I got approached by two different recruiters for two high-stakes positions. Both senior leadership roles. Both at companies I'd heard of. Both requiring someone with my specific background.

I ran my validation framework on both opportunities — checked them against my strategy, my drivers, my deal-breakers. One matched. One didn't. Here's what happened:

**Situation 1:** Got an inbound message from a recruiter sourcing for a Fractional CTO role. I'd sent my CV for pre-evaluation and validated my needs. I declined to move forward — the company didn't match my needs and motivations. The role was impressive on paper, but it wasn't aligned with what I'd defined in my strategy.

The recruiter's response? They insisted on proceeding anyway. They said my CV made so much sense for what they were looking for that they wanted to explore if there was any way to make it work. I still said no, because I have a strategy and I stick to it. But here's the point: my CV did its job. It created enough conviction that they wanted me even after I turned them down.

**Situation 2:** Different company. Strong alignment with my strategy. I validated the role and said yes, let's talk. The recruiter came back with two things: strong validation that my CV was exactly what they needed, and an urgent request to move to the next phase. Fast-tracked. No games. No waiting in line with 200 other applicants.

## CVs Are Read When Written Right

I know it's hard to believe in 2026. You've heard the stories — ATS systems rejecting qualified candidates, recruiters spending 6 seconds per CV, AI tools screening applications before humans ever see them.

All of that is true. But here's what's also true: **CVs are read when they're written right.**

When your CV immediately answers the six objections. When it removes doubt instead of creating it. When it positions you as the obvious choice instead of one of many maybes.

When you do that, recruiters don't just read your CV. They remember it. They fight to get you into the process. They reach out directly instead of waiting for you to apply.

That's what happened to me. That's what happens to my clients when they build their materials correctly.

## The Difference Between a CV That Gets Read and One That Gets Skipped

Most CVs fail because they're optimized for the wrong thing. They're trying to be comprehensive, trying to list everything, trying to impress with volume.

The CVs that get read? They're optimized for clarity and conviction. They make it immediately obvious who you are, what you deliver, and why you're the right fit. They don't make recruiters work to figure out if you're relevant. They don't create doubt about your trajectory or your impact. They don't bury the value in noise.

They eliminate the six objections in the first 20 seconds. And when you do that, your CV doesn't just get read. It gets acted on.

## This Is Why Your Materials Matter

Yes, networking gets you in front of people. Yes, referrals open doors. Yes, relationships create opportunities.

But when that recruiter or hiring manager or industry leader asks, "Send me your CV," what happens next?

If your materials are strong, they validate the connection. They reinforce the conversation. They move things forward. If your materials are weak, they create doubt. They stall momentum. They make people second-guess the referral.

Your CV isn't separate from your networking. It's part of the same system.

The goal is to have both working together: a network that gets you access, and materials that close the deal once you have it. That's what we're building.
`,
  ),
];

const rebrandingYourResumeLessons: AcademyLessonDefinition[] = [
  textLesson(
    "how-recruiters-actually-read-your-cv",
    "How Recruiters Actually Read Your CV",
    false,
    `
Before we build your materials, you need to understand the person who's going to read them. Not the idealized version. The real one.

The recruiter is sitting at their desk with 200 unread applications, three interview panels to schedule before lunch, and a hiring manager breathing down their neck because the role has been open for six weeks.

They're human. And they're burning out.

## The Reality Behind the Inbox

Recruiters are drowning. Thousands of applications. Tight deadlines. Targets they can barely hit while juggling requisitions across multiple teams, in different time zones, with competing priorities.

They don't have time to carefully read every CV. They don't have the luxury of giving everyone a fair shot. So they've developed a system: a fast, brutal filter that helps them cut through the noise and protect their sanity.

And here's what most candidates don't understand: **recruiters aren't looking for reasons to select you. They're looking for reasons to reject you.**

It's not personal. It's survival. When you have 200 CVs and need to shortlist 10, you can't carefully evaluate everyone's potential. You scan for red flags — for anything that creates doubt, for signals that say "risky hire" instead of "safe bet."

One moment of confusion, one vague bullet point, one gap that doesn't make sense, and you're out. Not because you're unqualified. Because they don't have time to figure out if you are.

## The Six Objections That Kill Your Application

I spent months working with a group of recruiters to understand exactly what they're screening for in those first ten seconds. What emerged was a framework — six objections they're actively working to eliminate before they'll even consider calling you.

If your CV doesn't immediately answer these six questions, you don't move forward.

### 1. "Am I wasting my time?"

What they're really asking: can I instantly understand who you are and whether you're relevant to this role?

This is the first filter, the make-or-break moment that happens in seconds. They need to immediately grasp what you do, what level you operate at, and whether you match the role they're trying to fill. If they have to work to figure that out, you're already losing.

A strong CV answers this before they even start reading — clear positioning, consistent language, obvious fit. A weak one makes them guess, and they won't.

**What removes this objection:**
- A headline that immediately connects you to the role: "Senior Backend Engineer | Distributed Systems & Platform Architecture"
- A brief summary that bridges your experience to what they need
- Job titles and companies that make sense for the seniority level they're hiring

**What triggers this objection:**
- Generic positioning like "Experienced software developer seeking new opportunities"
- No clarity on what type of problems you solve or environments you thrive in
- Language that could describe anyone in your field

The five-second test: if they can't explain what you do and where you fit after a quick glance at the top of your CV, you've failed this filter.

### 2. "Will this person raise or lower the standard?"

What they're really asking: does this person just do the job, or do they make everything around them better?

Every hire changes the team's trajectory. Strong hires elevate standards, improve processes, and make others better. Weak hires maintain the status quo at best, or drag performance down at worst.

**What removes this objection:**
- Action verbs that demonstrate ownership: led, redesigned, transformed, established, scaled
- Clear evidence of improvement: faster, more reliable, higher quality, more efficient
- Signs you've elevated others: mentorship, documentation, process improvements, knowledge sharing

**What triggers this objection:**
- Passive language like "responsible for," "worked on," or "contributed to"
- Descriptions that sound like job requirements, not achievements
- No evidence of initiative, leadership, or positive change

The bar-raising test: would this bullet point make a hiring manager think you'd elevate their team's performance, or just fill a seat?

> "Led migration of monolithic application to microservices architecture, reducing deployment time from 2 hours to 15 minutes while improving system reliability to 99.95% uptime, enabling team to ship features 3x faster." — that's ownership, improvement, and measurable impact on team capability.

### 3. "Do they understand the business?"

What they're really asking: can this person connect technical work to outcomes that actually matter to the company?

Technical skill is table stakes. What separates good candidates from great ones is the ability to think beyond the code, beyond the system, and understand how their work drives business value.

**What removes this objection:**
- Results tied to business metrics: revenue impact, customer satisfaction, conversion rates, retention, cost reduction
- Evidence of cross-functional collaboration with product, design, sales, marketing, or leadership
- Language that shows you understand the customer problem, not just the technical solution

**What triggers this objection:**
- Bullets full of technologies and tools with no mention of why they mattered
- Internal-only metrics that don't connect to user or business outcomes
- No sign you've worked beyond your immediate technical domain

The business value test: remove all the technical jargon from your bullet point. Does what's left still communicate clear value? If not, you're missing the business connection.

> "Rebuilt checkout flow architecture, reducing page load time by 40% and cart abandonment by 12%, resulting in $2.3M additional annual revenue." — that's technical execution connected directly to customer experience and business outcomes.

### 4. "Is their story coherent?"

What they're really asking: does this career path make sense, or does it look random and unfocused?

A coherent story signals intentionality — growth, learning, strategic thinking about your career. An incoherent story raises questions about stability, decision-making, and whether you know what you actually want.

**What removes this objection:**
- Clear progression in scope, responsibility, or technical depth
- Brief context for transitions that might otherwise seem random
- Consistent thread that ties different roles together, even across industries or specialties
- Growing impact and ownership over time

**What triggers this objection:**
- Multiple short stints with no explanation
- Title jumps that don't match demonstrated scope
- Gaps or transitions that create confusion
- Random-seeming pivots with no connecting narrative

The coherence test: read your job titles and tenures out loud in chronological order. Does it sound like intentional growth, or does it raise more questions than it answers?

Career pivots, industry changes, and non-linear paths aren't automatically bad. What matters is whether someone reading your CV can quickly understand why you made those moves. One line of context often transforms confusion into clarity.

### 5. "Do they bring signal or noise?"

What they're really asking: can this person think clearly and communicate precisely?

How you write your CV is a preview of how you'll communicate on the job. Clear, concise writing signals organized thinking. Messy, verbose, buzzword-heavy writing signals the opposite.

**What removes this objection:**
- Short, scannable bullet points with clear action and outcome
- Specific language over generic buzzwords
- Consistent formatting that makes information easy to parse
- Appropriate white space and visual hierarchy

**What triggers this objection:**
- Dense paragraphs that bury key information
- Overuse of empty words like "innovative," "dynamic," "passionate," or "team player"
- Cluttered layouts that create cognitive overload
- Vague statements that could mean anything

The clarity test: pick any bullet point and read it out loud. Can you immediately understand what was done and why it mattered? If you have to read it twice, it's noise.

> "Redesigned API authentication layer to support OAuth 2.0, cutting integration time for new partners from 3 weeks to 2 days and enabling 15 new partnerships in Q1." — crisp, specific, immediately understandable.
>
> Compare that to: "Responsible for various improvements to authentication systems and partner integration processes." — that says nothing. It's filler masquerading as experience.

### 6. "Have they operated at the scale this role demands?"

What they're really asking: has this person already faced problems, complexity, and pressure similar to what this role requires?

Scale isn't just about company size or user numbers. It's about the magnitude of problems you've solved, the pace you've operated at, the stakeholders you've navigated, and the weight of the decisions you've made.

**What removes this objection:**
- Clear indicators of scope: team size, customer base, transaction volume, data scale
- Evidence of cross-functional influence across multiple teams or departments
- Mentions of architectural complexity: distributed systems, multi-region infrastructure, platform work
- Signs of high-stakes decision-making with visible business impact
- Proof of navigating ambiguity in complex organizational environments

**What triggers this objection:**
- No mention of scope or scale anywhere
- Experience limited to small teams or isolated projects
- Achievements that lack context about magnitude or reach
- Nothing that demonstrates decisions with real consequence

The scale test: would the problems you solved and the decisions you made translate directly to this role's level of complexity, or is there a significant gap?

> "Architected payment processing system handling 50M transactions monthly across 12 countries, coordinating across 8 engineering teams and 4 departments to deliver zero-downtime migration that reduced processing costs by $4M annually." — multiple dimensions of scale at once: team coordination, geographic complexity, high volume, cross-functional leadership, business impact.

## What This Means for You

Now you know the game. Six objections. Six filters. Six reasons a recruiter will reject your CV in the first ten seconds.

Your job isn't to be perfect. Your job is to remove doubt — to answer these six questions so clearly, so immediately, that the recruiter has no reason to pass on you.

That's what we're building next: a CV that doesn't just list what you've done, but systematically eliminates every objection standing between you and the interview. Let's build it right.
`,
  ),
  textLesson(
    "verbs-why-your-word-choice-matters",
    "Verbs: Why Your Word Choice Matters",
    false,
    `
You've heard the advice a thousand times. "Use action verbs." "Avoid passive language." "Say 'led' instead of 'responsible for.'" But nobody ever explained why.

Why does it matter whether you write "responsible for managing a team" versus "led a team of 8 engineers"? Because the words you choose don't just describe what you did — they reveal how you think about your role in making it happen.

## What Passive Language Actually Communicates

When you write "responsible for," "involved in," "worked on," or "contributed to," you're technically describing work you did. But here's what a recruiter hears: *"I was present while work happened around me."*

Passive language removes you from the center of the action. It makes you sound like a participant, not a driver — like someone who was assigned tasks, not someone who owned outcomes.

It creates doubt. Not about your technical ability — about your sense of ownership, your initiative, your willingness to take accountability for results. And in a market where companies are hiring to mitigate risk, doubt is disqualifying.

## What Action Verbs Actually Do

Action verbs put you in the driver's seat. They position you as the person who made decisions, drove change, delivered results, and took ownership of outcomes.

- When you write "Led migration of legacy system," the recruiter sees leadership.
- When you write "Designed API architecture," they see strategic thinking.
- When you write "Reduced deployment time by 60%," they see measurable impact.
- When you write "Debugged critical performance bottleneck," they see technical depth and problem-solving.

These aren't just stylistic choices. They're psychological signals that shape how the reader perceives your level of agency, competence, and accountability.

## The Psychological Difference

Two versions of the same experience:

> Passive: "Was responsible for overseeing the development of new features for the platform."
>
> Active: "Led development of 12 platform features, coordinating across 3 teams to deliver on schedule and increase user engagement by 25%."

The first is vague — it doesn't tell us what you actually did, who was involved, or what changed. The second is specific — it shows leadership, coordination, measurable outcomes, and clear ownership. Same experience, completely different perception of your role in it.

Another example, for individual contributors:

> Passive: "Worked on improving database performance issues."
>
> Active: "Optimized database queries and redesigned indexing strategy, reducing query response time by 70% and eliminating timeout errors affecting 50K daily users."

## Why This Matters for Risk Assessment

Recruiters are scanning to eliminate risk. One of their core fears is hiring someone who will need constant direction — someone who waits to be told what to do, who doesn't take ownership when things go wrong.

Passive language reinforces that fear. Action verbs eliminate it. When your CV consistently uses strong, active language, you signal:

- **Ownership** — you don't just participate, you drive.
- **Initiative** — you don't wait for permission, you identify problems and solve them.
- **Accountability** — you tie your work to outcomes, not just activities.
- **Clarity of thought** — you can articulate your impact precisely.

These are the signals that move you from "maybe" to "yes."

## How to Choose the Right Verb

Not all action verbs are created equal. The right verb depends on what you're trying to communicate:

- **Leadership and influence:** led, directed, established, championed, drove, coordinated, aligned
- **Creation and building:** designed, architected, built, developed, engineered, created, launched
- **Improvement and optimization:** improved, optimized, enhanced, streamlined, reduced, accelerated, transformed
- **Problem-solving:** solved, resolved, diagnosed, debugged, troubleshot, identified, eliminated
- **Impact and scale:** scaled, expanded, grew, increased, delivered, achieved, enabled
- **Strategy and planning:** defined, shaped, formulated, established, structured, planned, prioritized
- **Collaboration and mentorship:** mentored, coached, guided, collaborated, partnered, aligned, supported

Choose verbs that accurately reflect your level of ownership and the nature of your contribution. Don't inflate. Don't undersell. Just be precise about what you actually did.

## Power Verbs by Impact Type

A reference list, organized by the type of impact you're communicating:

- **Ownership & Leadership:** led, directed, managed, oversaw, headed, championed, drove, spearheaded, coordinated, orchestrated, guided, steered, established
- **Technical Building & Creation:** built, developed, engineered, implemented, coded, programmed, designed, architected, created, constructed, assembled, composed, deployed, shipped, launched, released
- **System Design & Architecture:** designed, architected, structured, modeled, planned, conceived, devised, formulated, blueprinted
- **Improvement & Optimization:** improved, optimized, enhanced, streamlined, refined, upgraded, modernized, transformed, restructured, redesigned, reduced, accelerated, increased, boosted, maximized, minimized
- **Problem-Solving & Debugging:** solved, resolved, diagnosed, debugged, fixed, troubleshot, identified, eliminated, addressed, mitigated, prevented, corrected, patched
- **Performance & Reliability:** stabilized, hardened, strengthened, secured, monitored, maintained, sustained, ensured, guaranteed
- **Scale & Growth:** scaled, expanded, grew, increased, multiplied, amplified, extended, broadened, enlarged
- **Refactoring & Technical Debt:** refactored, rewrote, migrated, consolidated, simplified, decoupled, modularized, extracted, cleaned up
- **Testing & Quality:** tested, validated, verified, audited, reviewed, inspected, quality-assured, automated
- **Analysis & Research:** analyzed, evaluated, assessed, investigated, researched, examined, measured, quantified, profiled, benchmarked, traced
- **Integration & Connection:** integrated, connected, linked, interfaced, synchronized, unified, consolidated, merged
- **Documentation & Knowledge Sharing:** documented, wrote, authored, published, standardized, codified, formalized
- **Collaboration & Influence:** collaborated, partnered, aligned, coordinated, facilitated, influenced, advised, consulted, mentored, coached, guided, trained, enabled, onboarded
- **Strategy & Planning:** defined, shaped, formulated, established, structured, planned, prioritized, strategized, mapped, outlined
- **Delivery & Execution:** delivered, executed, implemented, completed, achieved, accomplished, finalized, shipped, released, launched

## Real Examples: Weak vs. Strong

**Backend Development**
> Weak: "Worked on improving API performance."
> Strong: "Optimized API response times by implementing Redis caching and query batching, reducing average latency from 800ms to 120ms and supporting 5x traffic growth."

**Frontend Development**
> Weak: "Responsible for building user interface components."
> Strong: "Engineered reusable React component library adopted across 6 product teams, reducing UI development time by 40% and ensuring design consistency."

**Infrastructure**
> Weak: "Helped with the migration to Kubernetes."
> Strong: "Orchestrated migration of 30 microservices from EC2 to Kubernetes, reducing infrastructure costs by 35% and enabling zero-downtime deployments."

**Debugging & Problem-Solving**
> Weak: "Fixed bugs in the payment system."
> Strong: "Diagnosed and resolved critical race condition in payment processing that was causing 2% transaction failures, recovering $400K in monthly revenue."

**Testing & Quality**
> Weak: "Was responsible for testing the application."
> Strong: "Automated end-to-end testing pipeline using Cypress, increasing test coverage from 45% to 85% and catching 90% of regressions before production."

**Refactoring**
> Weak: "Worked on code refactoring."
> Strong: "Refactored legacy authentication module, eliminating 3,000 lines of duplicated code and reducing new feature implementation time by 60%."

## The Test: Does This Verb Show Ownership?

Before you use any verb in your CV, ask yourself: *"Does this verb position me as the person who made this happen, or as someone who was present while it happened?"*

If it's the latter, choose a stronger verb. Your CV isn't a job description. It's proof of what you've driven, owned, and delivered. Make every word count.

## What's Next

Now that you understand why action verbs matter and have a toolkit of strong alternatives, we're ready to build the actual structure of your CV. Next, we'll break down how to construct bullet points that systematically eliminate all six objections while communicating your experience with precision and impact.
`,
  ),
  textLesson(
    "the-5-second-rule",
    "The 5-Second Rule",
    false,
    `
In this class, I want you to understand how CVs are actually read. You've heard it a thousand times: "Recruiters spend 5 seconds on your CV before deciding." And it sounds terrifying — five seconds to determine your professional worth?

But that's not actually how it works. Let me demystify this for you.

## What the 5-Second Rule Really Means

The 5-second rule doesn't mean a recruiter reads your entire CV in 5 seconds and makes a final decision. No one can read a document that fast and make accurate decisions without it backfiring.

What it actually means is this: **recruiters work in 5-second checkpoints.** They scan your CV in intervals. At each checkpoint, they're evaluating whether you've passed the filters so far — whether the risk is low enough to keep reading, whether you're worth the next five seconds of their attention.

- First 5 seconds: do I understand who this person is and whether they're relevant? (Objection #1) Pass? You get another 5 seconds.
- Next 5 seconds: do they show ownership and impact? (Objections #2 and #3) Pass? You get another 5 seconds.
- Next 5 seconds: does their story make sense, is it coherent? (Objection #4) Pass? You get another 5 seconds.
- Final 5 seconds: have they operated at the scale we need? Is this clear and well-presented? (Objections #5 and #6) Pass? You move to the shortlist.

## The Reality: 20 Seconds, 4 Checkpoints

In reality, a full CV evaluation takes around 20 seconds. That's four checkpoints to make your point, reduce risk, and convince the recruiter you're worth a conversation. Twenty seconds to eliminate doubt. Twenty seconds to prove you're the safe bet.

That's why positioning is everything. That's why every section, every bullet, every word needs to work in your favor. You're not writing for someone who has time to carefully read and reflect. You're writing for someone who's scanning fast, looking for signals, and making quick risk assessments.

## Why This Matters for Your CV

Understanding the checkpoint system changes how you approach your CV. You're not trying to impress someone who's reading every word carefully — you're trying to pass four quick filters that determine whether you're worth deeper consideration.

**Checkpoint 1: The Top (Intro + Summary).** Can they immediately tell who you are and whether you're relevant? If this fails, they stop. Game over.

**Checkpoint 2: Core Achievements or First Experience Bullets.** Do you show clear ownership and measurable impact? If this fails, they move on — you looked generic.

**Checkpoint 3: Career Progression.** Does your story make sense? Is there a logical trajectory? If this fails, they question your stability or focus.

**Checkpoint 4: Scale and Presentation.** Have you operated at the right level? Is this easy to read and well-structured? If this fails, they doubt you can handle the complexity of the role or communicate clearly.

## What This Means for You

Every section of your CV needs to earn the next checkpoint.

Your intro and summary need to be so clear that within 5 seconds, the recruiter knows exactly who you are and why you're relevant. Your core achievements or first few experience bullets need to demonstrate ownership and impact immediately. Your career progression needs to tell a coherent story that doesn't raise questions. Your scale, clarity, and structure need to be obvious — no hunting for information, no clutter, no confusion.

That's how you survive all four checkpoints. That's how you get to 20 seconds and move to the shortlist. Keep pushing.
`,
  ),
  textLesson(
    "exercise-read-your-cv-like-a-recruiter",
    "Exercise: Read Your CV Like a Recruiter",
    false,
    `
You've learned how recruiters think. You understand the six objections that kill applications. You know why action verbs matter and which ones signal ownership versus passivity.

Now it's time to turn that lens on yourself. This exercise will be uncomfortable. That's the point.

You're going to read your current CV the way a recruiter would — not the way you hope they'll read it, not with the benefit of context or the assumption of good faith. The way they actually read it: fast, critical, looking for reasons to reject.

## Why This Matters

Most people never see their own CV objectively. They read it with all the context in their head — they know what they meant to say, they fill in the gaps automatically, they give themselves the benefit of the doubt because they know their story.

But recruiters don't have that context. They have ten seconds and 200 other CVs waiting. If your CV doesn't immediately eliminate their doubts, you're out — not because you're unqualified, but because they can't tell that you're qualified quickly enough.

This exercise forces you to see what they see: the confusion, the vagueness, the missed opportunities — exactly where your CV is failing you. Once you see it, you can fix it.

## How to Approach This Exercise

### Step 1: Get into the recruiter mindset

You're not you anymore. You're a recruiter. You're tired. You're behind on your targets. You've been staring at CVs for three hours and you have 50 more to review before end of day.

You don't have patience for vagueness. You don't have time to decode what someone might have meant. You're scanning for signals that say "safe bet" or "risky hire." You're not trying to give anyone a chance — you're trying to eliminate doubt fast.

### Step 2: Open your current CV and your ideal job description side by side

Pull up the CV you've been using — the one you've sent to companies, the one that hasn't been getting you interviews. Next to it, open the ideal job description you identified in Phase 1. You're going to evaluate your CV against that specific role.

### Step 3: Scan your CV for 10 seconds

Set a timer. Ten seconds. Look at your CV the way a recruiter would on first pass. Then ask yourself:

- Can I immediately tell what this person does and what level they operate at?
- Do I understand how they're relevant to this role?
- Does anything stand out as impressive in those ten seconds?

Be honest. If the answer to any of these is no, that's a red flag.

### Step 4: Evaluate your CV against the six objections

Now go deeper. Work through each objection systematically. For each one, write down your honest assessment — where does your CV succeed, where does it fail, what creates doubt?

**Objection 1: "Am I wasting my time?"** Look at the top half of your CV — headline, summary, first role. Is it immediately clear what kind of role you're targeting? Does your positioning match the job description's requirements? Document whether your CV passes this filter, what's unclear or vague, and what would need to change to eliminate this doubt instantly.

**Objection 2: "Will this person raise or lower the standard?"** Scan your bullet points, your verbs, how you describe your work. Do your bullets show ownership, or do they sound like job descriptions? Document how many bullets use passive language, which bullets actually demonstrate initiative, and where you're underselling your impact.

**Objection 3: "Do they understand the business?"** Look for business context and outcomes in your experience. Do your bullets connect technical work to business outcomes? Document how many bullets are purely technical with no business context, and what outcomes are missing.

**Objection 4: "Is their story coherent?"** Read your job titles and tenures in order. Does your career progression make sense? Document which transitions raise questions and where context is missing.

**Objection 5: "Do they bring signal or noise?"** Evaluate the clarity and precision of your writing. Are your bullets short and scannable, or dense paragraphs? Document which bullets are too long, too vague, or too cluttered.

**Objection 6: "Have they operated at the scale this role demands?"** Compare your experience to the job description's requirements. Does your CV show you've worked at the level this role demands? Document where scale is missing or unclear, and whether your experience genuinely matches this role's demands.

### Step 5: Be ruthless

This is not the time to be kind to yourself. If something is vague, call it out. If a bullet point says nothing, write that down. If your CV makes you work to understand what you do, admit it.

The goal isn't to feel bad. The goal is clarity. You need to see exactly where your CV is failing so you know what to fix. Don't defend it, don't explain it away — just document what's actually there and what's missing.

### Step 6: Document everything, including where you might be exaggerating

Create a new document called "CV Audit - [Your Name]." Write down your findings for each objection. Be specific — quote the weak bullet points, identify the gaps, note where you're underselling yourself and where you're being too vague.

But also catch where you might be overstating. Go through each bullet point one more time and ask: *"Did I really do this?"* — not in the "was I present when it happened" way, but in the "can I own this statement in an interview" way. *"If someone wanted to discuss this in detail, could I back my argument deeply?"*

Could you explain the context, the decisions you made, the challenges you faced, the specifics of how you delivered the result? If the answer is no — if you'd fumble or hedge or need to walk back the claim — flag it.

Document any bullets where you're taking full credit for something you only partially contributed to, where the language is stronger than your actual level of ownership, where you'd struggle to defend the claim in depth during an interview, or where the result is accurate but you can't explain how you achieved it.

This isn't about being modest. It's about being accurate. Your CV should show your impact fully, but it should never claim things you can't substantiate. Exaggeration gets exposed in interviews, and when it does, you lose all credibility.

This document is your roadmap for what needs to change.

## What Happens Next

Once you've completed your audit, you'll have a clear picture of where your CV is failing you. This exercise isn't about tearing down your CV — it's about seeing it clearly so we can rebuild it strategically: the version that eliminates doubt, the version that gets you interviews.

Let's find the gaps so we can close them.
`,
  ),
  textLesson(
    "cv-layout-and-structure-make-or-break",
    "CV Layout & Structure: Make or Break",
    false,
    `
I hope the last exercise gave you clarity — not just about what's working and what's not in your CV, but about how recruiters actually think. The pressure they're under. The speed at which they make decisions. The filters they use to protect their sanity. Maybe you even developed some empathy for them.

They're not trying to reject you because they're mean. They're trying to survive an overwhelming workload while making hiring decisions that could make or break a team.

Now it's time to use that understanding — to clean house and build a narrative that connects, that eliminates doubt, that makes you an interview magnet.

## Starting From the Basics: Layout and Ground Rules

This should be basic. Yet so many people fail here. You can have incredible experience, compelling achievements, and perfect language — but if your CV's structure is broken, none of it matters.

A bad structure will kill you in two different ways.

**1. CV parsing fails.** Most companies use Applicant Tracking Systems (ATS) to manage the flood of applications. These systems parse your CV, extract the information, and structure it in a database so recruiters can search and filter candidates. If the ATS can't parse your CV correctly, it risks missing important context from your profile. Missing context leads to poor evaluation, and poor evaluation leads to rejection. To get to the human, you need to beat the machine first.

**2. Adding noise and cognitive load.** If you beat the machine, you still need to keep the human engaged. Remember the five-second checkpoints — if your structure is sloppy, if data is unclear or hard to follow, you're adding cognitive load. The recruiter has to work to understand you, and when they have to work, they move on. A confusing layout is a red flag, and we already know what recruiters do with red flags: they reject.

## The Ground Rules for CV Layout

These aren't suggestions. They're non-negotiables if you want your CV to survive both the machine and the human.

**1. Single column, always.** Two-column layouts look fancy. They also confuse ATS parsers and force recruiters to jump around the page. Your CV should flow naturally from top to bottom — one clear path, no hunting for information.

**2. No personal information beyond the essentials.** Your CV needs your name, email, phone number, and location (city/country is enough). It does not need your full address, your photo (unless you're in a region where it's standard practice), your date of birth, your marital status, or your nationality (unless visa sponsorship is relevant). Keep it professional. Keep it relevant.

**3. It must read with full context from top to bottom and left to right.** This is critical. Every section should flow logically. Every bullet should be self-contained. Every piece of information should make sense in the order it appears. Don't make the recruiter backtrack or guess.

**4. Clean fonts.** Use fonts that are easy to read on screen and in print — Verdana, Montserrat, Open Sans, Calibri, Arial. Avoid script fonts, decorative fonts, and anything that prioritizes style over readability. Your CV is not a design portfolio. It's a communication tool. Clarity over creativity.

**5. Text size: not too big, not too small.** Body text should be 11-12pt. Headers can be 14-16pt to create visual hierarchy. Your name at the top can be 18-20pt. If the recruiter has to squint, it's too small. If it looks like a children's book, it's too big.

**6. Content hierarchy: use headers, paragraphs, and bulleted lists.** Structure helps the brain process information quickly. Use clear section headers (Experience, Education, Skills), brief paragraphs or summary lines for context, and bulleted lists to highlight achievements and responsibilities. Don't create walls of text. Don't make everything a bullet. Balance structure with readability.

**7. No graphs, bars, stars, or silly graphics.** Those skill bars that show you're "80% proficient in Python"? Meaningless. Those star ratings for soft skills? Unprofessional. Those visual progress indicators? They add noise and confuse ATS systems. Save the creativity for your portfolio. Keep your CV clean.

**8. Use a chronological style.** Your most recent experience should come first. Recruiters want to see what you've done lately, not what you did a decade ago. Work backward in time.

## Why This Matters More Than You Think

These rules might seem basic, even boring. But this is the foundation. If your structure is broken, your content doesn't matter. If the ATS can't parse it, a human never sees it. If the human has to work to understand it, they move on.

Get the foundation right, and everything else becomes easier. Mess it up, and you're fighting an uphill battle from the start.

## What's Next

Now that you know the ground rules, we're going to build on this foundation — how to structure your resume, which components are mandatory or optional. But first, make sure your layout is clean and the structure is solid. Everything we build next depends on this.
`,
  ),
  textLesson(
    "chronological-vs-skills-based-structure-matters",
    "Chronological vs. Skills-Based: Structure Matters",
    false,
    `
Before we dive into building your CV, we need to address a choice you might have encountered: chronological CV or skills-based CV?

Let me save you the decision: we're using chronological. Here's why.

## The Difference

Skills-based CVs organize your experience by skill categories rather than by timeline — grouping achievements under headings like "Leadership," "Technical Skills," or "Project Management." They're designed for early-stage professionals who don't have significant experience yet. When you're just starting out, your selling proposition is your skills, your potential, and your commitment to learning. Your experiences are secondary because you simply haven't accumulated enough of them yet.

Chronological CVs organize your experience by time, starting with your most recent role and working backward. They show your career trajectory, your growth, your progression, your track record of delivery.

## Why We're Using Chronological

Because you're not early in your career anymore. You're a senior professional with solid experience. You have a story to tell, and that story is your strength.

Recruiters expect chronological CVs from candidates at your level. They're trained to read them. ATS systems are built to parse them. Hiring managers trust them because they can see progression, stability, and context.

For senior roles, a skills-based CV raises questions: "Why isn't their experience front and center?" "What are they not showing me?" "Are they trying to hide a gap or pivot?"

You don't need to create those questions. You need to eliminate doubt. Your experience is your proof. Your timeline is your narrative. Your progression is your value. Chronological format showcases all of that clearly.

## Your CV Is an Arch

A chronological CV isn't just a list of jobs. It's a narrative — your pitch, your unique selling proposition. It shows where you've been, what you've built, and where you're going. It positions you as the logical next hire for the role you're targeting.

But most importantly, it mitigates risk. Every section, every bullet, every piece of information is strategically placed to eliminate the six objections. When structured correctly, your CV becomes a high-converting document — one that moves recruiters from "maybe" to "yes" in those critical first few seconds.

## The Winning Structure

This isn't theory. This is tested and validated by over 200 customers who went through this program and landed jobs. Some sections are required. Some are optional. But the order matters — this sequence drives the reader through a logical flow, highlights what matters most for senior positions, and addresses the six-objections framework in priority.

**The order:**

1. **Intro Section** (Name, Tag, Contacts) — Mandatory. Your identity and how to reach you.
2. **Summary** — Mandatory. Your professional positioning in 2-4 lines.
3. **Core Achievements** — Optional. A snapshot of your biggest wins, positioned upfront to grab attention.
4. **Experience** — Mandatory. Your professional history, the core of your CV.
5. **Projects** — Optional. Relevant work outside traditional employment, if it strengthens your case.
6. **Education** — Mandatory. Your academic foundation.
7. **Certifications** — Optional. Professional credentials that support your target role.
8. **Languages** — Required or Optional. Required if the job demands multiple languages to perform the role; optional if English is the default and no other languages are needed.
9. **Articles & Publications** — Optional. Thought leadership, if relevant to your positioning.
10. **Core Competencies** — Required. Your technical toolkit, keywords for ATS and recruiters.

## Why This Order Works

This structure prioritizes what recruiters care about most: your recent experience and your ability to deliver. It front-loads impact. Your intro positions you. Your summary tells them exactly who you are. Your core achievements (if included) prove value immediately. Your experience section builds the case in detail. Everything else supports the narrative without diluting it.

And critically, this structure respects the five-second checkpoints — the most important information lives where recruiters look first.

## One Page, Two Pages, or More?

Here's my philosophy: your CV can have multiple pages, but you need to deliver your value on the first two pages.

If you're a senior professional with 10+ years of experience, forcing everything into one page means either cutting critical context or shrinking text to the point of unreadability. Neither serves you.

Two pages is fine. Three pages can work if you have extensive, relevant experience. But here's the rule: the first page must hook them, and the second page must close the case. If they haven't decided to interview you by the end of page two, page three won't save you.

Keep the five-second checkpoint rule in mind. Front-load your value. Make every word on page one count.

## What's Next

We're going to break down each component in detail, one by one — exactly what to include, how to structure it, and why it matters.
`,
  ),
  textLesson(
    "summary-your-5-second-pitch",
    "Summary: Your 5-Second Pitch",
    false,
    `
Let's talk about the most controversial section of your CV: the summary.

Some people say it's unnecessary — a waste of space. "Just let my experience speak for itself." Others say it's critical — the hook that determines whether someone keeps reading or moves on.

I'm on the side of those who say it matters. Here's why.

## Why the Summary Section Exists

Remember Objection #1: "Am I wasting my time?" Recruiters need to know, fast, whether you're relevant to the role they're trying to fill. They don't have time to decode your experience, connect the dots between your roles, or infer what kind of position you're targeting. You have five seconds to answer that question for them.

The summary section does that. It clearly states who you are, why you're interesting, and what value you bring. It positions you immediately so the recruiter knows whether to invest more time in your CV. Without it, they're guessing — and when they have to guess, they move on.

## What a Summary Is (and Isn't)

A summary is not your life story. It's not a paragraph about your journey, your passions, or your career aspirations. It's a pitch — a positioning statement, a narrative hook designed to create curiosity and the desire to keep reading.

It should be 2-3 sentences, no more than 4 lines, focused on who you are, what you do, and the value you deliver.

It should not be generic ("Passionate software engineer seeking new opportunities"), vague ("Experienced professional with strong communication skills"), or a list of adjectives ("Dynamic, innovative, results-driven leader").

Your summary needs to pitch you in a way that aligns with your needs, motivations, and drivers from your 360º strategy form. It's not about what sounds impressive — it's about what's true and relevant to the role you're targeting.

## What Makes a Strong Summary

An example:

> "Senior engineering leader with a track record of scaling teams, shaping product strategy, and turning complex, ambiguous problems into simple, valuable solutions for customers. I believe tech is a tool. What matters to me is the customer experience, the business outcome, and the clarity of the product we deliver. I thrive in product-led environments where engineering works hand in hand with product, design, and customer-facing teams to move the business forward."

Why this works:

1. **It immediately positions the person.** "Senior engineering leader" — you know the level right away.
2. **It highlights their core value.** "Scaling teams, shaping product strategy, turning complex problems into simple solutions" — you understand what they do and how they operate.
3. **It reveals their philosophy and priorities.** "Tech is a tool... what matters is the customer experience, the business outcome, and clarity" — this tells you how they think, not just what they've done.
4. **It signals environment fit.** "Product-led environments where engineering works hand in hand with product, design, and customer-facing teams" — this tells you where they thrive and eliminates mismatches early.

This summary doesn't just describe experience. It communicates identity, values, and fit. That's what you're aiming for.

## The Summary Formula

*[Your level/role] with [years or context] [doing what specific thing]. I [believe/value/prioritize statement that reveals your philosophy]. I thrive in [type of environment] where [conditions that bring out your best work].*

A few variations:

**Backend Engineer:** "Senior backend engineer with 6 years of experience building high-performance systems for fast-growing SaaS companies. I believe great engineering means solving the right problems, not just writing clever code. I thrive in collaborative environments where technical decisions are tied directly to customer impact and business outcomes."

**Engineering Manager:** "Engineering manager with 8 years leading cross-functional teams in high-growth startups. I value clarity, ownership, and creating environments where engineers can do their best work. I thrive in dynamic organizations where speed, quality, and continuous improvement aren't trade-offs but shared goals."

**Staff Engineer:** "Staff engineer specializing in distributed systems and platform architecture for B2B SaaS. I care most about building systems that scale, creating clarity in ambiguity, and enabling teams to ship faster without breaking things. I thrive in technically complex environments where I can balance deep technical work with cross-team collaboration."

## Quick-Start Questions to Trigger Your Thinking

Before you write your summary, answer these:

1. What's your current level and area of focus? (e.g., Senior Backend Engineer, Engineering Manager, Staff Engineer specializing in X)
2. What's the core value you deliver? (e.g., scaling systems, building teams, solving ambiguous problems, driving technical strategy)
3. What do you believe or value most in your work? (e.g., customer outcomes over technical complexity, clarity over chaos, quality and speed as complementary goals)
4. What type of environment brings out your best work? (e.g., product-led, fast-paced, collaborative, high-autonomy, technically complex)
5. Looking at your 360º strategy form, what are your top 3 career drivers? (e.g., impact, autonomy, technical depth, collaboration, business outcomes)

Use your answers to craft a summary that's authentic, specific, and aligned with the roles you're targeting.

## Common Mistakes to Avoid

- **Being too generic.** "Experienced software engineer with strong problem-solving skills seeking a challenging role." This could describe anyone. It positions nobody.
- **Listing skills instead of telling a story.** "Proficient in Python, Kubernetes, AWS, PostgreSQL, and Agile methodologies." That's not a summary, that's a keyword dump — save it for Core Competencies.
- **Making it about what you want instead of what you deliver.** "Looking for a role where I can grow my leadership skills and work on innovative projects." Recruiters don't care what you want. They care what you bring. Flip the focus.
- **Writing a novel.** If your summary is 6+ lines, it's too long. Nobody's reading that in the first five seconds. Cut it down.

## Your Task

Open your resume template and write your summary. Use the formula. Answer the quick-start questions. Look at your 360º form for alignment.

Draft it. Read it out loud. Ask yourself: "Does this immediately tell someone who I am and why I'm relevant?" If yes, you're done. If no, refine it until it does.

This section sets the tone for everything that follows. Get it right, and you've earned the recruiter's attention. Let's make those five seconds count.
`,
  ),
  textLesson(
    "core-achievements-making-your-bold-claims",
    "Core Achievements: Making Your Bold Claims",
    false,
    `
This section is optional. But if you have strong, defensible claims that immediately demonstrate your value, this section can be a game-changer.

Here's what it does: it front-loads your impact before the recruiter even gets to your experience section. It answers three critical objections in the first five seconds:

- **Objection #1: "Am I wasting my time?"** You show immediately that you've delivered real results.
- **Objection #2: "Will this person raise or lower the standard?"** You prove you've elevated teams, systems, or outcomes.
- **Objection #3: "Do they understand the business?"** You demonstrate that your work connects to measurable business value.

This section, when done right, creates momentum. It makes the recruiter want to keep reading because you've already proven you're worth their time. But here's the catch: if you don't have strong claims, skip this section entirely.

## When to Use Core Achievements

Use this section if you have 3-5 bold, specific accomplishments that are directly relevant to your target role, demonstrate clear measurable impact, show technical depth/leadership/business value, and would make a recruiter think "I need to talk to this person."

If your achievements feel weak, generic, or forced, don't include them. A mediocre Core Achievements section doesn't help you — it adds noise. And noise is a red flag.

## The Rules for Core Achievements

**1. Be bold, but be honest.** You're allowed to make bold claims here — this is where you highlight your biggest wins. But don't exaggerate. If a recruiter or hiring manager asks you to discuss any of these achievements in depth during an interview, you need to be able to explain the context and constraints, your specific role and decisions, the execution and challenges, and the measurable outcome and why it mattered. If you can't do that, the claim doesn't belong here.

**2. Be direct and succinct.** Each achievement should be one line — maybe two if absolutely necessary. No paragraphs. You're delivering impact statements that make someone want to learn more.

**3. Make them measurable.** Vague achievements don't work. "Improved system performance" says nothing. "Reduced API response time by 65%, supporting 3x traffic growth without infrastructure cost increase" says everything. Quantify wherever possible: percentages, time saved, revenue impact, user growth, cost reduction, team size, system scale.

**4. Connect to business outcomes.** Remember Objection #3. Your achievements should show that your work mattered beyond the code — say why it mattered to customers, users, revenue, efficiency, or the company's ability to execute.

## What Strong Core Achievements Look Like

**Backend Engineer:**
- Redesigned payment processing architecture, reducing transaction failure rate from 4% to 0.2% and recovering $1.2M in annual revenue
- Led migration to Kubernetes, cutting infrastructure costs by 40% while improving deployment frequency from weekly to daily
- Built real-time analytics pipeline processing 50M events daily, enabling product team to ship data-driven features 3x faster

**Engineering Manager:**
- Scaled engineering team from 8 to 25 while maintaining 95% retention and reducing time-to-productivity for new hires by 50%
- Established cross-functional delivery framework that reduced feature cycle time from 8 weeks to 3 weeks across 4 product teams
- Led technical turnaround that improved system uptime from 97% to 99.9%, eliminating customer-impacting incidents for 6 consecutive months

**Staff Engineer:**
- Architected multi-region distributed system serving 200M requests daily with 99.99% uptime across 12 countries
- Established platform standards and tooling adopted by 50+ engineers, reducing onboarding time by 60%
- Led technical strategy for critical migration affecting 10M users, delivering zero-downtime cutover and $3M annual cost savings

## What Weak Core Achievements Look Like

- **Too long and generic:** "Successfully collaborated with cross-functional teams including product managers, designers, and stakeholders to deliver high-quality software solutions that improved overall system performance and enhanced user experience across multiple platforms while maintaining best practices and coding standards." Says nothing specific.
- **Vague with no real value:** "Led the implementation of modern development practices and agile methodologies to improve team efficiency and code quality." What practices? How much improvement?
- **Buzzwords masking emptiness:** "Drove innovative solutions leveraging cutting-edge technologies to optimize performance and deliver exceptional results in a fast-paced environment." Sounds impressive, means nothing.

## The Test: Would You Want to Discuss This in an Interview?

Before you include any achievement, ask yourself:

1. If the interviewer asks me to walk through this in detail, can I deliver a compelling 5-minute explanation of what I did, why it mattered, and how I made it happen?
2. Can I explain the specific decisions I made, the tradeoffs I considered, and why this approach was the right one?
3. Can I quantify the before and after? Do I have actual numbers, or am I using vague terms like "improved" and "enhanced"?
4. If they ask who else was involved, can I clearly articulate my specific contribution versus the team's contribution?
5. Does this achievement differentiate me from other candidates, or could anyone with similar experience make this same claim?

If you can't answer these confidently, the achievement is weak. Cut it.

## When to Skip This Section Entirely

Skip Core Achievements if you don't have 3-5 strong, defensible claims, your achievements feel generic or forced, you're unsure whether they make you shine, or they don't directly connect to your target role.

If this section doesn't help you 1000%, it will backfire — it becomes filler, it becomes noise, it makes the recruiter question whether you actually delivered what you're claiming.

Better to have no Core Achievements section than a weak one. Your experience section will carry your case. Let it do the work.

## Your Task

Look at your Context Mapping document. Review your biggest wins from the past 5-7 years. Identify 3-5 achievements that are bold and specific, measurable and defensible, directly relevant to your target role, and proof that you raise the bar, deliver business value, and operate at scale.

Draft them. Read them out loud. Test them against the five challenging questions above. Ask yourself: "Would these make me want to interview this person?"

If yes, you've got your Core Achievements section. If no, skip it and move on — your experience section will tell the story.
`,
  ),
  textLesson(
    "experiences-your-core-proof",
    "Experiences: Your Core Proof",
    false,
    `
This is the most important section of your CV. Everything else supports this. Your summary positions you. Your core achievements hook attention. But your experience section is where you prove you can deliver.

This is where recruiters spend the most time — evaluating whether you've operated at the level they need, solved problems similar to theirs, and delivered results that matter. Get this right, and you've made your case. Get it wrong, and nothing else can save you.

## The Chronological Order: Most Recent First

Your experience must be listed in reverse chronological order — most recent role at the top, then the one before that, and so on. Recruiters want to see what you've been doing lately.

You don't need to list all your roles — just the last 7-10 years, and the ones that really add value to your desired role.

## The Header: Role, Company, and Period

Each role should start with a single line: **Role Title | Company Name | Years of Employment.**

> Senior Backend Engineer | Stripe | 2022 - Present
>
> Staff Engineer | Shopify | 2019 - 2022

Everything on one line. Clean. Scannable. Easy to parse for both humans and ATS systems.

## Why Years Only (No Months)

Here's a rule that will feel uncomfortable but protects you: **list only years, not months.**

Why? Because short tenures immediately raise red flags. Imagine you started a job in January 2024 and left in April 2024 — four months. Maybe it wasn't a fit. Maybe you found something better. Doesn't matter — when a recruiter sees "Jan 2024 - Apr 2024," their brain goes straight to: "Why did this person leave so quickly? Are they a job hopper?"

Hiring is expensive. It requires coordination across multiple people, departments, and resources. So when a recruiter sees short tenures, the risk calculation shifts, and the result is rejection.

But when you list years only, "2024" could mean 12 months or 1 month — the recruiter doesn't know without asking. Psychologically, they skim in years, and the tenure looks more stable. The red flag doesn't trigger during the screening phase. Will they ask about it in the interview? Probably — but by then, you're in the room, and you've already cleared the first filter.

## Describing Your Experience: The RAT Framework

Now let's talk about how to describe what you actually did in each role. Most people either write vague job descriptions or throw a random mix of tasks and achievements at the page, hoping something sticks. We're not doing that.

We're using the **RAT framework: Responsibilities, Accomplishments, Takeaways.** This framework is designed to systematically address the objections that kill your application (#2 through #6). When you write using RAT, you move away from just describing your work and start eliminating doubt.

**R = Responsibilities.** These are the first 1-2 bullets for any role. They set the context — what were you hired to do, what was your mandate, what were you held accountable for? This isn't about listing every task — it's about framing your scope, your ownership, and the expectations of the role. This addresses Objection #4 (coherent story), #5 (signal vs. noise), and #6 (scale).

> "Led backend engineering for payments platform serving 2M transactions monthly across 8 countries." — that's a responsibility. It tells the recruiter what you owned, the scale you operated at, and the environment you worked in.

**A = Accomplishments.** These are the 2-4 bullets that follow your responsibilities. They show what you actually delivered — that you didn't just do the job, you excelled at it, improved things, delivered measurable outcomes. This addresses Objection #2 (raising the bar), #3 (business understanding), and #6 (scale).

**Critical: focus on YOU.** Yes, most work happens in teams. But this is your CV, not the team's CV. You need to focus on your specific contribution, your decisions, your ownership, the outcomes you drove. Be a bit selfish here — this isn't the place for humility.

> Instead of: "The team redesigned the payment flow." Write: "Redesigned payment authorization flow, reducing failed transactions from 3.5% to 0.8% and recovering $800K in annual revenue."

Accomplishments can be quantitative or qualitative. Both matter.

Quantitative examples:
- "Reduced API response time by 65%, enabling the platform to handle 3x traffic growth without additional infrastructure cost"
- "Cut deployment time from 2 hours to 15 minutes by rebuilding CI/CD pipeline, accelerating release velocity across 6 teams"
- "Improved system uptime from 97% to 99.9%, eliminating 90% of customer-impacting incidents over 12 months"

Qualitative examples:
- "Established incident response framework and on-call rotation, creating clarity and accountability that significantly reduced mean time to resolution"
- "Architected event-driven microservices architecture, enabling independent team deployment and eliminating cross-team bottlenecks"
- "Mentored 5 junior engineers through code reviews and pairing sessions, accelerating their growth from junior to mid-level within 18 months"

Don't force numbers where they don't exist or don't make sense — real accomplishments matter more than manufactured metrics. But when you have numbers, use them.

**T = Takeaways.** This isn't a written bullet. It's the overall feeling you're creating for the reader — the framework or set of problems you want them to know you can solve. When someone finishes reading your bullets for a role, what should they walk away thinking? "This person can scale systems under pressure." "This person understands how to balance speed and quality." "This person can lead cross-functional initiatives that deliver business value."

The takeaway is the sum of your R and A bullets — the implicit message you're crafting through what you choose to highlight. This is how you address Objections #2, #3, #4, and #6 holistically.

## How R and A Work Together

The structure is clear and deliberate: start with 1-2 R bullets to set the context (what did you own, what was the scope and scale), then follow with 2-4 A bullets to prove what you delivered. R is R. A is A. Keep them distinct.

**Example structure:**

Senior Backend Engineer | Stripe | 2022 - Present

- Led backend engineering for payments platform processing 2M transactions monthly across 8 countries *(R — scale)*
- Managed on-call rotation and incident response for mission-critical payment services *(R — scale and responsibility)*
- Redesigned payment authorization flow, reducing failed transactions from 3.5% to 0.8% and recovering $800K annually *(A — quantitative, Objections #2 and #3)*
- Architected event-driven fraud detection system, reducing chargebacks by 40% while maintaining sub-100ms processing latency *(A — quantitative, Objections #2, #3, #6)*
- Established CI/CD pipeline and deployment standards adopted by 6 engineering teams, reducing deployment time from 2 hours to 15 minutes *(A — quantitative, Objections #2 and #6)*
- Mentored 3 mid-level engineers through architectural decisions and code reviews, accelerating their promotion readiness *(A — qualitative, Objection #2)*

**Takeaway (T):** this person can build reliable, high-scale systems that directly impact revenue and risk. They understand both technical depth and business outcomes. They raise the standard for their team and operate at a significant scale.

## Your Task: Write Your Experience Section

**Step 1:** Open your Context Mapping document and your Ideal Job Description side by side — your Context Mapping has the raw material, your Job Description tells you what to emphasize.

**Step 2:** For each role, write 1-2 R bullets and 2-4 A bullets. Start with Responsibilities — set the context, scope, and scale. Then move to Accomplishments — what did you deliver, focused on YOU, using both quantitative and qualitative accomplishments where they make sense.

**Step 3:** Test your bullets against the objections. After writing, review each bullet: does it show you raise the bar (#2)? Does it connect to business outcomes (#3)? Does it fit coherently into your career story (#4)? Is it clear and scannable (#5)? Does it demonstrate the scale this role demands (#6)? If any bullet fails these tests, revise it.

**Step 4:** Reflect on your Takeaway. After writing your bullets, step back and ask: "If someone reads this, what will they think I'm good at?" If the takeaway isn't clear or doesn't align with your target role, revise your bullets.

**Step 5:** Practice — don't cheat. You'll be tempted to paste your context into an AI tool and let it write your bullets. Don't — not yet. The only way to master this framework is to practice it yourself first. Once you've written your first draft, then you can use AI to refine it, not replace your thinking.

## Optional: A Prompt to Refine Your Work

Once you've written your experience bullets, you can use a prompt like this to get feedback:

> You are a seasoned recruiter experienced in reviewing resumes, and also a copywriter and personal brand coach. I'm using the RAT framework (Responsibilities, Accomplishments, Takeaways) to write my resume. R bullets set context and scale; A bullets show measurable impact focused on MY ownership; T is the overall takeaway, not its own bullet. My bullets should address: raising the standard, business understanding, story coherence, signal vs. noise, and scale. Review my draft below and tell me whether my R bullets set context and scale, whether my A bullets demonstrate clear impact and ownership, whether R and A are properly distinct, whether the bullets are clear and scannable, and where I should improve.
>
> [Paste your experience section here]

Use this after you've done the hard work yourself — let it help you refine, not replace your thinking.

## What's Next

The experience section is where your CV lives or dies. Take your time with this. Write multiple drafts. Test your bullets against the objections framework. Focus on YOU — your ownership, your decisions, your results.
`,
  ),
  textLesson(
    "projects-only-if-it-builds-your-case",
    "Projects: Only If It Builds Your Case",
    false,
    `
This section is optional. And honestly, for most people, it should stay that way.

I only recommend adding a Projects section if you have work that directly contributes to building your case — work that demonstrates impact, solves real problems, and shows measurable traction.

This has nothing to do with all the repos you might have on GitHub. It has nothing to do with the app you built on a weekend. It has nothing to do with tutorials you followed or side experiments you never shipped.

Projects are valid when they bring extra impact, when they prove you can deliver outside traditional employment, when they show initiative, technical depth, or domain expertise that strengthens your positioning.

## What Makes a Project Worth Including

A project deserves a spot on your CV if it meets these criteria:

1. **It solves a real problem** — not a toy problem, not a "wouldn't it be cool if" problem, but a real problem that real people or companies face.
2. **It has measurable traction** — downloads, users, stars, adoption. If no one's using it, it's a learning exercise, not a project worth highlighting.
3. **You can speak to its impact with depth** — if someone asks about it in an interview, can you discuss what problem it solves and why it matters, who uses it and how, the technical decisions you made and why, and the impact it's had? If not, it doesn't belong here.

## Why Most Projects Don't Belong on Your CV

As a hiring manager, I'm tired of seeing CVs that say "I have over 200 libraries published on NPM." Nice. We get to the interview, we start talking about those libraries, and nothing comes — no adoption, no users, no impact. Just repos sitting there collecting digital dust.

That doesn't build your case. It raises questions: "Why are they padding their CV with projects no one uses? Do they understand what meaningful work looks like? Are they confusing activity with impact?" Don't be that person.

## When a Project Actually Matters: A Real Example

A CTO I helped in the past had developed a library in PHP with millions of downloads per week and thousands of stars on the repo. Real adoption, real impact — we kept it on his CV.

He jumped into a technical round. Someone read his CV and called out: "Damn, are you the creator of this library? We use it in our project." Different frame. Different mood. Different vibe. One that helped him. He got the job.

That's the kind of project that deserves to be on your CV — something real, something that made someone else's work easier, something people actually use and value.

## How to Structure the Projects Section

**Project Name | Brief Description | Timeline (Optional)**, then 2-4 bullets that follow the same principles as your experience section: what problem does it solve, what impact has it had, what makes it technically interesting or valuable.

**Example:**

OpenAuth PHP | Open-source OAuth 2.0 library for PHP | 2019 - Present

- Built lightweight OAuth 2.0 implementation adopted by 5,000+ projects with 8M+ weekly downloads on Packagist
- Reduced typical OAuth integration time from 2 days to 2 hours through simplified API and comprehensive documentation
- Maintains 99.5% test coverage and backwards compatibility across 4 major PHP versions, ensuring reliability for production use
- Active maintenance with 3K+ GitHub stars and contributions from 40+ developers globally

**Takeaway:** this person can build tools that solve real problems at scale. They understand developer experience and maintainability. They're technically credible.

## What Not to Include

Skip projects that have no users or adoption, were built for learning rather than solving a real problem, you can't discuss in depth during an interview, don't connect to your target role, are unfinished or abandoned, or only exist in your private repos. These don't strengthen your case — they dilute it.

## The Test: Would This Impress You?

Before adding any project, ask yourself: "If I were hiring for my target role and saw this project on a CV, would I be impressed? Would I want to ask about it? Would it make me think this person is more credible?"

If yes, include it. If no or "maybe," skip it. Better to have no Projects section than a weak one.

## Your Task

Review any projects, open-source contributions, or side work you've done. Ask: does this solve a real problem? Does it have measurable traction or adoption? Can I speak to its impact in depth? Does it strengthen my case for my target role?

If you have 1-3 projects that meet all these criteria, add them. If you don't, skip this section entirely — your experience section will carry your case.
`,
  ),
  textLesson(
    "education-keep-it-simple",
    "Education: Keep It Simple",
    false,
    `
Let's make this quick.

People overthink the Education section. They list every course, every honor, every academic project, every extracurricular activity from two decades ago.

Unless you're targeting the academic sector or a C-suite role where your academic performance really matters, stop. This needs to be basic. Declutter it.

## Why Education Matters Less Than You Think

Here's a fun fact: many IT companies are formally ditching formal education as a requirement. They care more about what you've built, what you've delivered, and whether you can solve their problems than where you went to school or what your GPA was.

If you've been working for 5+ years, your experience speaks louder than your degree ever will. So keep this section clean. Basic works.

## The Format

**[Degree], [University], [Year of Conclusion].** That's it. One line per degree. No paragraphs. No descriptions. No GPA. No coursework. No honors.

**Example:**

Education

- MSc in Software Engineering, ISCTE, 2027 (expected)
- Bachelor's Degree in Computer Science, Harvard University, 2011

## Your Task

Look at your Education section. Is it clean? Is it one line per degree? If not, simplify it. Cut the fluff. Keep the facts. Let your experience do the talking. Done.
`,
  ),
  textLesson(
    "certifications-when-ego-meets-reality",
    "Certifications: When Ego Meets Reality",
    false,
    `
I know this one's going to hurt.

You've invested time, money, energy — late nights studying, practice exams, the relief when you finally passed. That certification sitting on your wall or your LinkedIn profile is proof: proof that you put in the work, proof that you reached a certain level of knowledge, proof that you earned something.

And I need you to know: that matters. It's an achievement. You should be proud of it.

But there's an uncomfortable truth we need to face together: **if that certification doesn't help you get the job you're targeting, it doesn't belong on your CV.**

## Why This Is So Hard

I get it, I really do. I have certifications in Java, Python, SOA Architecture, Career Coaching, and at least ten others. I worked for them. I paid for them. Some of them weren't cheap.

And you know what? None of them would help me land a VP of Engineering role. Zero. Nothing. They'd actually work against me.

The reason is that they don't signal what that role needs. They make the recruiter question my focus, my trajectory, my understanding of what the role actually requires. They're titles. Just titles. Not proof of what I can deliver at that level.

And letting go of them on my CV stung. I still have that itch sometimes — that voice that says, "But I worked so hard for that. It cost me so much. I need it there." But I don't. And neither do you.

## The Real Question

Here's what you need to ask yourself for every certification on your CV: **"Does this directly support my case for the role I'm targeting?"**

Not "Did I work hard for it?" Not "Did it cost me money?" Not "Am I proud of it?" Does it help the recruiter see me as the right fit for this specific role?

If the answer is yes, keep it. If the answer is no, it has to go.

## What Actually Belongs Here

A certification belongs on your CV if:

1. **It's directly relevant to the role you're targeting.** If the job requires AWS expertise and you're an AWS Certified Solutions Architect, keep it.
2. **It's recent or actively maintained.** Certifications from 10 years ago that you never renewed are expired in more ways than one.
3. **It signals expertise at the right level.** If you're targeting senior roles, entry-level certifications don't help — they make you look junior.
4. **It's recognized and valued in your target market.** A certification from a no-name platform no one's heard of doesn't add credibility.

If it doesn't meet all four criteria, cut it.

## The Format (If You Keep Any)

**[Certification Name], [Issuer], [Year Accomplished or Validity Year if Applicable]**

**Examples:**

- AWS Certified Solutions Architect – Professional, Amazon Web Services, valid by 2026
- Certified Kubernetes Administrator (CKA), Cloud Native Computing Foundation, 2024
- Professional Scrum Master (PSM II), Scrum.org, 2023

One line each. Clean. No fluff.

## The Emotional Work I Need You to Do

I know you're sitting there looking at your certifications right now. Some of them cost you $500. Some took you months to prepare for. Some represent a version of yourself you worked really hard to become. And I'm asking you to delete them. That's hard. I've been there. I still feel it.

But here's what I need you to remember: your CV is not a museum. It's not a shrine to everything you've ever accomplished. It's a strategic document designed to get you one thing: an interview for the role you actually want. Every line that doesn't serve that goal is working against you.

So take a breath. Feel the discomfort. Acknowledge what those certifications meant to you. And then delete the ones that don't serve your next step. You're not erasing your achievements. You're just choosing what to showcase.

## Your Task

Go through your certifications one by one. For each one, ask: is this directly relevant to my target role? Is this recent or actively maintained? Does this signal expertise at the right level? Is this recognized and valued in my target market?

If it's a yes to all four, keep it. If it's a no to any of them, delete it.

And if you're struggling, remember: the goal isn't to show everything you've ever done. The goal is to show you're the right person for this role. Let go of what doesn't serve you. Keep what does.
`,
  ),
  textLesson(
    "languages-required-or-optional",
    "Languages: Required or Optional?",
    false,
    `
This one's straightforward. The Languages section is either required or optional, depending on your target role.

## When It's Required

Include a Languages section if the job explicitly requires or strongly benefits from multiple languages to perform the role. For example:

- You're applying for roles in multilingual markets (e.g., EU-based companies serving multiple countries)
- The job description mentions language requirements beyond English
- The company operates globally and language skills are a competitive advantage
- Customer-facing roles where language diversity matters

If language skills are part of the job requirements, this section is mandatory.

## When It's Optional

Skip the Languages section if English is the default and sufficient for the role, and no other languages add meaningful value. If the job doesn't require or benefit from additional languages, this section becomes clutter — it takes up space that could be used to strengthen other parts of your CV.

## How to Format It

If you're including this section, keep it simple:

Languages

English (Native/Fluent) | Spanish (Professional working proficiency) | French (Conversational)

Be honest about your proficiency. Don't oversell — if they need the language and you claimed fluency, you'll be found out immediately in the interview.

## Your Task

Look at your target job descriptions. Do they mention language requirements? Do they operate in multilingual environments? If yes, include the Languages section with your relevant languages and honest proficiency levels. If no, skip it entirely. Simple as that.
`,
  ),
  textLesson(
    "articles-and-publications-establishing-authority",
    "Articles & Publications: Establishing Authority",
    false,
    `
This section is optional. But if you have the right kind of published work, it can significantly strengthen your positioning by establishing credibility and authority in your field.

## What Belongs Here

This section is for exceptional, recognized publications that demonstrate thought leadership, technical expertise, or strategic insight. Include:

- Papers published in recognized journals or industry magazines
- Books or book chapters you've authored
- Major conference presentations or proceedings
- Technical articles in well-known industry publications
- Research papers or whitepapers with significant impact

Do not include your personal blog posts (unless you have exceptional reach and influence relevant to the role), Medium articles with minimal engagement, generic LinkedIn posts, internal company documentation, or unpublished work.

## The Blog Post Exception

Personal blog posts generally don't belong here. However, if your blog has a strong, measurable reach with an audience directly relevant to your target role, you can highlight it as a Core Achievement instead.

> Example: "Built technical blog reaching 50K monthly readers, establishing thought leadership in distributed systems architecture and driving inbound opportunities from top tech companies." That's an accomplishment, not a publication.

## Why This Section Matters

For senior individual contributors, technical leaders, and executives, publications signal that you're recognized in your field, that you can articulate complex ideas clearly to diverse audiences, that you contribute to the broader community and industry, that you're seen as an authority rather than just a practitioner, and that you think strategically about your domain.

This is particularly valuable for roles like Staff/Principal Engineer, Engineering Manager, Director, VP of Engineering, CTO, or any position where thought leadership, influence, and strategic thinking matter.

If you don't have this kind of work, skip the section entirely. It's better to have no publications section than a weak one filled with blog posts no one read.

## How to Format It

Keep it clean and structured:

**[Author(s)] | [Title] | [Publication Date] | [Publisher] | [ISBN if applicable]**
(Optional) 2-3 sentences describing the goal of the piece and why it's important.

**Example (paper):**

André Freitas, Benedikt Kämpgen, João Gabriel Oliveira, Sean O'Riain, Edward Curry | Representing Interoperable Provenance Descriptions for ETL Workflows. ESWC 2012 Workshop Highlights, Lecture Notes in Computer Science (LNCS) | Springer Verlag | 2012.

**Example (book, with description):**

The Engineering Leadership Playbook: Strategies for Team Success and Business Growth | Raphael Neves | 2024 | Apress | ISBN 979-8-8688-0139-6
Comprehensive guide on building high-performing engineering teams grounded in customer-centricity, operational excellence, and people development. The book shares strategies for tech leaders to become strategic business partners, bridging technical execution with business outcomes.

## Your Task

Review any publications, papers, or books you've contributed to. Ask: is this published in a recognized venue? Does it demonstrate expertise, leadership, or strategic thinking relevant to my target role? Would a hiring manager at my target level be impressed by this?

If yes to all three, include it with the format above. If no, or if you only have blog posts with minimal reach, skip this section entirely. Quality over quantity. Authority over activity.
`,
  ),
  textLesson(
    "core-competencies-your-ats-and-keyword-strategy",
    "Core Competencies: Your ATS and Keyword Strategy",
    false,
    `
This is the last section of your CV. And I see too many people getting this wrong — they put it right below the summary, creating a massive wall of buzzwords that pushes their actual experience off the first page. They don't organize it, they don't think strategically about it, they just dump every skill they've ever touched into a list and hope for the best.

Stop. Let me show you how to do this right.

## Why This Section Exists (And Where It Goes)

Core Competencies serves two purposes:

1. **ATS filtering.** Applicant Tracking Systems scan for keyword matches. This section helps you pass those filters by including the skills from the job description in a format the system can easily parse.
2. **Quick recruiter scan (the 20% who actually read it).** When recruiters do look at this section, they're using the 5-second rule — they want to confirm you have the technical toolkit and soft skills the role requires.

That's it. That's the job. This section doesn't deliver much value for decision-makers — that happens in your experience section. But it does matter for getting past the initial filters, so we treat it strategically.

**Where it goes:** at the end of your CV, not at the top. Your summary, achievements, and experience need to be front and center. This section supports them, it doesn't replace them.

## Don't Go Wild With Buzzwords

Yes, this section is for keywords, but that doesn't mean you create a pool of every buzzword you've ever heard. Everything here should be something you actually use or have used professionally, relevant to your target role, and defensible if someone asks you about it in an interview.

Don't list skills you touched once in a tutorial five years ago. Don't add buzzwords just because they're trendy. As always: strategy over noise.

## Organize for Scannability

Even though 80% of recruiters won't read this section closely, the 20% who do are using the 5-second rule. Make their job easy by organizing your skills into clear, logical blocks. I recommend three main categories:

- **Leadership & Soft Skills**
- **Engineering & Development**
- **Tools & Platforms**

This structure works for senior ICs, tech leaders, and executives — it covers the range of skills that matter at these levels without creating clutter.

**Example structure:**

Core Competencies

- **Leadership & Soft Skills:** Team Leadership, Cross-functional Collaboration, Agile Methodologies (Scrum, Kanban), Coaching & Mentorship, Process Optimization, Stakeholder Management, Strategic Planning, Problem Solving, Communication, Decision Making, Conflict Resolution, Critical Thinking, Empathy, Adaptability, Time Management, Meeting Facilitation
- **Engineering & Development:** Software Architecture, System Design, Full Software Development Lifecycle (SDLC), Continuous Integration (CI/CD), Test Automation, Security Features Implementation, API Integration, Web Development, Microservices, Distributed Systems, Java, Python, Ruby, Rails, Kotlin, Spring, SQL
- **Tools & Platforms:** AWS, Azure, Docker, Kubernetes, GitHub, Jenkins, Terraform, PostgreSQL, MongoDB, Datadog, Grafana, Jira, Confluence

## The LinkedIn Skills Connection

Here's a tip that will amplify your visibility beyond just your CV: most job searches happen on LinkedIn, and recruiters use LinkedIn Recruiter to search for candidates by skills.

When you're building your Core Competencies section, cross-reference your skills with LinkedIn's standardized skill names. Why? Because if your CV skills match your LinkedIn skills, and both match what recruiters are searching for, you increase your discoverability significantly.

Use LinkedIn's skill naming conventions where possible — it creates consistency across your materials and makes you easier to find.

## Your Task

**Step 1:** Identify your core competencies. Go through your Context Mapping, your experience section, and your target job descriptions. List every skill you use regularly or have used professionally, can discuss confidently in an interview, and that's relevant to your target role.

**Step 2:** Organize into three blocks — Leadership & Soft Skills, Engineering & Development, Tools & Platforms.

**Step 3:** Cross-check with LinkedIn Skills — search for your skills in LinkedIn's skill library and use their standardized naming where it makes sense.

**Step 4:** Add to your CV, at the end, after Education, Certifications, Languages, and Publications.

## Final Note

This section won't get you the job. But it will help you get past the filters that stand between you and the human who can. Treat it strategically. Organize it clearly. Make it relevant. And then let your experience section do the real work.
`,
  ),
];

const linkedInProfileOptimisationLessons: AcademyLessonDefinition[] = [
  videoLesson("how-recruiters-use-linkedin-for-sourcing", "How Recruiters Use LinkedIn For Sourcing"),
  videoLesson("banner-and-photo-making-a-good-first-impression", "Banner & Photo: Making a Good First Impression"),
  videoLesson("headline-your-mini-pitch-message", "Headline: Your Mini Pitch Message"),
  videoLesson("open-to-work-the-right-way", "Open To Work: The Right Way"),
  videoLesson("about-your-optimised-pitch", "About: Your Optimised Pitch"),
  videoLesson("featured-and-activity-debunking-the-myth", "Featured & Activity: Debunking the Myth"),
  videoLesson("experience-your-entry-door", "Experience: Your Entry Door"),
  videoLesson("others-last-but-not-least", "Others: Last But Not Least"),
];

export const ACADEMY_GROUPS: AcademyGroupDefinition[] = [
  { slug: "rebranding-your-resume", title: "Rebranding Your Resume", lessons: rebrandingYourResumeLessons },
  {
    slug: "linkedin-profile-optimisation",
    title: "LinkedIn Profile Optimisation",
    lessons: linkedInProfileOptimisationLessons,
  },
];

const ALL_LESSONS: AcademyLessonDefinition[] = [
  ...ACADEMY_STANDALONE_LESSONS,
  ...ACADEMY_GROUPS.flatMap((group) => group.lessons),
];

const LESSONS_BY_SLUG = new Map(ALL_LESSONS.map((lesson) => [lesson.slug, lesson]));

export function findLessonDefinition(slug: string): AcademyLessonDefinition | undefined {
  return LESSONS_BY_SLUG.get(slug);
}

export function isFreeLessonSlug(slug: string): boolean {
  return LESSONS_BY_SLUG.get(slug)?.isFree ?? false;
}
