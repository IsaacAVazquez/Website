# Case Study: TextOut SMS Platform

---

## Header

### Project Title
```
TextOut: SMS Voter Outreach Platform
```

### Metadata
```
**Role**: Product Manager
**Timeline**: 6 months (MVP to scale), ongoing
**Company**: Open Progress
**Team**: 3 Engineers, 1 Designer, Campaign Partners (100+ campaigns)
```

### Tags
```
Product Management • User Research • Roadmap Planning • Civic Tech • SMS Platform • Campaign Tools • Cross-functional Leadership
```

---

## Overview

### The Challenge
Democratic campaigns needed to reach millions of voters via text message, but existing SMS platforms were built for marketing, not political organizing. They were expensive, hard to use, and lacked features campaigns needed (peer-to-peer texting, compliance tools, volunteer management). We needed to build an SMS platform designed specifically for political campaigns.

### Impact
- **100+ campaigns** served (congressional, state, local)
- **2M+ voters** reached via text
- **15% average response rate** (3x industry standard)
- **$500K+ in platform revenue** in first year

---

## The Problem

### Who We Were Building For

Our users were campaign field directors and volunteer coordinators running Democratic campaigns. They needed to:
- Send mass texts to voters (10K-100K+ at a time)
- Enable volunteers to send personalized texts (peer-to-peer)
- Track responses and follow up with interested voters
- Comply with FEC regulations and carrier guidelines
- Manage volunteer access and permissions

Existing SMS platforms had major problems:

**Problem 1: Built for marketing, not organizing**
- Platforms like Twilio and SimpleTexting were designed for businesses sending promotional texts, not volunteers having conversations with voters.
- No support for peer-to-peer texting (required by carriers for political messages).

**Problem 2: Too expensive**
- Marketing platforms charged $0.02-0.05 per text. Campaigns sending 100K texts would pay $2K-5K per send.
- This priced out small campaigns and grassroots organizations.

**Problem 3: Bad volunteer experience**
- Volunteers had to use clunky web interfaces that weren't mobile-optimized.
- No training materials or onboarding flows.
- High error rates and low volunteer retention.

**Problem 4: Compliance nightmares**
- Campaigns risked FCC fines if they didn't follow opt-out rules, carrier guidelines, and FEC regulations.
- No built-in compliance features, so campaigns had to manage opt-outs manually.

### Why This Mattered

Text messaging is one of the most effective voter contact methods:
- **Higher open rates than email** (98% vs. 20%)
- **Faster responses than phone calls** (15% vs. 5%)
- **More personal than digital ads**

But without a platform built for campaigns, organizers were either:
- Paying too much for marketing tools
- Using hacked-together solutions that broke under load
- Risking compliance violations

One field director told me:

> "We're spending $5K per text blast on Twilio. We could hire another organizer with that money. But we don't have a better option."

### Problem Statement

**How might we build an affordable, easy-to-use SMS platform so that campaigns can reach voters at scale without breaking the bank or violating compliance rules?**

---

## Discovery & Research

### How We Learned

I ran a 4-week discovery phase to understand the problem:

**Campaign Shadowing**: Spent a week with a congressional campaign during their text banking operation. I watched volunteers send texts, observed their workflow, and documented pain points.

**User Interviews**: Conducted 20 interviews with field directors, volunteer coordinators, and campaign managers from campaigns of varying sizes (local, state, congressional).

**Volunteer Research**: Interviewed 15 volunteers about their text banking experience. What was confusing? What kept them engaged?

**Competitive Analysis**: Tested every major SMS platform (Twilio, Hustle, ThruText, Spoke) to identify gaps and opportunities.

**Compliance Research**: Studied FCC regulations, carrier guidelines, and FEC rules to understand legal requirements.

### What We Learned

**Key Insight 1: Volunteers needed mobile-first, dead-simple tools**

75% of volunteers were texting voters from their phones, not desktops. Existing platforms had mobile web interfaces that were slow, buggy, and hard to use.

Volunteers wanted:
- Fast load times
- One-tap responses (pre-written scripts)
- Clear instructions on what to say
- Real-time feedback on their progress

**Key Insight 2: Campaigns prioritized cost over features**

When I asked campaigns what mattered most, they said: "Make it cheap." Features were important, but affordability was non-negotiable.

Campaigns wanted to pay $0.01 per text or less (half the cost of competitors).

**Key Insight 3: Compliance was a top 3 concern**

Every campaign manager mentioned compliance. They were terrified of FCC fines ($10K+ per violation) or getting blacklisted by carriers.

They needed:
- Automatic opt-out handling
- Compliance warnings when messages violated rules
- Audit logs for FEC reporting

**Key Insight 4: Campaigns valued "launch in minutes" onboarding**

Campaigns operate on tight timelines. They needed to launch text programs in hours, not days.

Competitors required 2-3 days of setup (account approval, script review, volunteer training). Campaigns wanted same-day launches.

---

## The Solution

### What We Decided to Build

We built **TextOut**, an SMS platform designed specifically for political campaigns. Key differentiators:

1. **Peer-to-peer texting**: Volunteers send personalized texts from their devices (compliant with carrier rules)
2. **Affordable pricing**: $0.01 per text (50% cheaper than competitors)
3. **Mobile-first interface**: Optimized for volunteers texting from phones
4. **Built-in compliance**: Automatic opt-outs, carrier rule enforcement, FEC audit logs
5. **Launch in minutes**: No multi-day setup process

### Product Principles

- **Make it cheap**: Campaigns are resource-constrained; affordability is non-negotiable
- **Make it simple**: Volunteers should be able to start texting within 5 minutes of signing up
- **Make it compliant**: Campaigns should never worry about FCC fines or carrier violations
- **Make it effective**: Optimize for response rates, not just volume

### Key Features

**Feature 1: Mobile-First Texting Interface**

Volunteers access a mobile-optimized web app where they:
1. See a list of voters to contact
2. Tap to send a pre-written script (customizable)
3. Receive responses in real-time
4. Use quick-reply buttons for common responses

**Impact**: 80% of volunteers used mobile devices. Mobile-first design increased volunteer retention by 35%.

---

**Feature 2: Script Templates & Training**

Campaigns upload scripts (tested for compliance and effectiveness). Volunteers see:
- Opening message
- Common responses (Yes/No/Maybe)
- How to handle objections
- When to escalate to campaign staff

New volunteers complete a 5-minute training module before sending texts.

**Impact**: Reduced volunteer errors by 60%. Increased response rates by 20% (better messaging).

---

**Feature 3: Automatic Opt-Out Handling**

When a voter replies "STOP" or "UNSUBSCRIBE", the system:
- Immediately removes them from the contact list
- Logs the opt-out for compliance
- Notifies the volunteer (no action needed)

**Impact**: 100% compliance with FCC opt-out rules. Zero violations in first year.

---

**Feature 4: Real-Time Analytics Dashboard**

Campaign managers see:
- How many texts sent
- Response rates
- Volunteer activity
- Opt-out rates
- Cost per contact

**Impact**: Campaigns could track ROI and optimize messaging in real-time.

---

**Feature 5: Volunteer Management**

Campaign managers can:
- Invite volunteers via email
- Assign specific voter lists to volunteers
- Track volunteer performance
- Send encouragement messages to top performers

**Impact**: Increased volunteer engagement. Top volunteers sent 2x more texts when they saw leaderboards.

---

### Key Product Decisions

**Decision 1: Build peer-to-peer, not broadcast texting**

**Rationale**: Carrier rules require peer-to-peer for political messages (one volunteer sending to 10-20 voters at a time, not mass blasts). Competitors were trying to work around this with workarounds. We built the platform natively for peer-to-peer, which made it more compliant and scalable.

**Decision 2: Prioritize mobile web over native apps**

**Rationale**: Building iOS + Android apps would take 6+ months. A mobile-optimized web app could ship in 2 months and work across all devices. We prioritized speed to market.

**Decision 3: Charge per-text, not per-campaign**

**Rationale**: Campaigns wanted predictable costs. Per-text pricing was simpler than monthly subscriptions and aligned with their usage patterns (high volume during campaign season, zero off-season).

**Decision 4: Start with Democratic campaigns only**

**Rationale**: We had deep relationships in the Democratic ecosystem and understood their needs. Expanding to Republican campaigns would require different messaging, compliance rules, and partnerships. We scoped to Democrats for MVP.

---

## Building & Launching

### How We Built It

We worked in 2-week sprints with a cross-functional team:
- **3 Engineers**: Backend (SMS routing, compliance), frontend (web app), infrastructure
- **1 Designer**: Mobile UI/UX, volunteer onboarding flow
- **Me (PM)**: Product strategy, user research, roadmap, stakeholder management

I ran:
- **Daily standups** (15 min) to unblock the team
- **Weekly sprint planning** to prioritize features
- **Bi-weekly user testing** with campaign partners
- **Monthly all-hands** to align on vision and celebrate wins

### Roadmap

**Phase 1 (Weeks 1-4): Discovery & Design**
- User research (shadowing, interviews)
- Competitive analysis
- Compliance research
- Wireframes and user flows

**Phase 2 (Weeks 5-10): MVP Development**
- Peer-to-peer texting engine
- Mobile web interface
- Script templates
- Automatic opt-out handling
- Basic analytics

**Phase 3 (Weeks 11-14): Pilot Launch**
- Deploy with 5 pilot campaigns
- Volunteer onboarding and training
- Gather feedback and iterate
- Performance tracking

**Phase 4 (Weeks 15-24): Scale & Growth**
- Expanded analytics dashboard
- Volunteer management features
- Integrations (voter databases, CRM tools)
- Rollout to 100+ campaigns

### Cross-functional Collaboration

**Challenge**: Engineering wanted to build a complex AI-powered response suggestion system.

**How I handled it**: I pushed back and said: "Let's ship a simple quick-reply system first and validate that volunteers actually need AI suggestions." We shipped quick replies in 2 weeks. User feedback showed they were sufficient. We never built the AI feature. Lesson: Validate demand before building complex features.

**Challenge**: Campaigns wanted same-day onboarding, but carriers required 2-3 days for account approval.

**How I handled it**: I negotiated with carriers to pre-approve accounts in bulk for known political organizations. This reduced approval time from 3 days to <1 hour. Product solution: We built a waitlist system that pre-approved campaigns during off-peak times.

**Challenge**: Volunteers were confused by compliance rules.

**How I handled it**: I worked with our legal advisor and designer to create a simple, visual compliance training module (5 min). Volunteers loved it. One said: "I finally understand why we do things this way."

---

## Impact & Results

### Key Metrics

**100+ campaigns**
served (local, state, congressional)

**2M+ voters**
reached via text

**15% average response rate**
(3x industry standard of 5%)

**$500K+ platform revenue**
in first year

### Qualitative Impact

**Campaigns saved money**: Switching from Twilio ($0.03/text) to TextOut ($0.01/text) saved campaigns an average of $3K per cycle. One campaign said:

> "We saved $10K on texting and used that money to hire two more organizers."

**Volunteers stayed engaged**: Volunteer retention increased by 35% compared to previous text banking tools. Volunteers appreciated the mobile-first design and clear instructions.

**Campaigns won races**: 15 of the 100+ campaigns using TextOut won competitive races. They attributed part of their success to effective voter contact.

### User Feedback

> "TextOut is the first text platform that actually works for campaigns. It's fast, cheap, and our volunteers love it."
>
> **— Field Director, Congressional Campaign**

> "I used to dread text banking on other platforms. TextOut makes it actually enjoyable."
>
> **— Volunteer**

---

## What I Learned

### Key Takeaways

**1. Deep user empathy leads to better products**

Spending a week shadowing campaigns gave me insights I never would have gotten from interviews alone. I saw volunteers struggle with slow interfaces, confuse compliance rules, and drop off due to bad onboarding. These observations directly shaped the product. Lesson: Go where your users are. Observe their workflows in real life.

**2. Constraints drive creativity**

Campaigns needed same-day onboarding, but carriers required 2-3 day approvals. This constraint forced us to build a waitlist system and pre-approval process that became a competitive advantage. Lesson: Constraints aren't blockers; they're opportunities to innovate.

**3. Simplicity is a feature**

Engineering wanted to build AI response suggestions, complex analytics, and advanced targeting. Users just wanted a fast, simple interface to send texts. Saying no to complexity and shipping simple features created a better product. Lesson: Ruthlessly prioritize simplicity.

**4. Pricing is a product decision**

Choosing $0.01 per text (vs. $0.02 or $0.05) was a product decision, not just a business decision. It made TextOut accessible to small campaigns and grassroots organizations who couldn't afford competitors. This expanded our market and differentiated us. Lesson: Pricing affects who can use your product. Design pricing for your target users.

**5. Compliance is a feature, not overhead**

Campaigns were terrified of FCC fines. Building compliance directly into the product (automatic opt-outs, audit logs, compliance training) gave them peace of mind and became a selling point. Lesson: In regulated industries, compliance is a competitive advantage.

### What I'd Do Differently

**Launch with fewer features**: We shipped the MVP with 8 features. In retrospect, we could have launched with 4 (texting interface, scripts, opt-outs, analytics) and added the rest based on feedback. Faster time to market would have given us more learning cycles.

**Invest in better onboarding metrics**: We tracked overall volunteer retention, but didn't track drop-off at each step of onboarding. Better instrumentation would have helped us identify and fix friction points faster.

**Build integrations earlier**: Campaigns wanted to sync TextOut with their CRM tools (NGP VAN, ActionKit). We waited 6 months to build integrations. Doing it earlier would have increased adoption and reduced manual work for campaigns.

---

## See More Work

**Related Projects**:
- [AI-Powered QA Automation](/projects/ai-qa-automation)
- [Voter Targeting AI Platform](/projects/voter-targeting)
- [RunningMate Campaign Tool](/projects/runningmate)

**Or**: [View all projects](/projects)

---

**File**: `textout.md`
**Route**: `/projects/textout`
**Last updated**: November 2025
