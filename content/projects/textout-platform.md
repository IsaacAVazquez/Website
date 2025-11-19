---
title: "TextOut Platform — Product Vision & User Research"
description: "Owned product vision for peer-to-peer texting platform, driving 35% engagement increase and 90% faster onboarding through user-centered design and GCP automation"
publishedAt: "2025-01-15"
updatedAt: "2025-01-15"
category: "Civic Tech"
tags: ["Product Management", "User Research", "GCP", "Civic Tech", "Platform Development", "Data Analytics"]
featured: true
client: "CIVITECH"
role: "Product Owner, User Research Lead"
timeline: "2024"
status: "Launched"
image: "/project-screenshots/textout-platform-hero.png"
imageAlt: "TextOut platform interface showing campaign dashboard and messaging features"
seo:
  title: "TextOut Platform — Product Vision & User Research by Isaac Vazquez"
  description: "Product case study: How user research and GCP automation drove 35% engagement increase and transformed client onboarding for political tech platform"
  keywords: ["product management", "user research", "civic tech", "GCP automation", "platform development", "political technology"]
---

# TextOut Platform
## Product Vision & User Research

![TextOut Platform Dashboard](/project-screenshots/textout-platform-hero.png)
*TextOut platform dashboard enabling campaign teams to reach voters through peer-to-peer texting*

## Overview

**The Challenge:** Political campaigns needed a more effective way to reach voters through peer-to-peer texting, but existing platforms had poor user experience and lengthy onboarding processes that prevented rapid campaign deployment.

**My Role:** Product Owner and User Research Lead — owned end-to-end product vision, conducted user research, defined requirements, and prioritized features based on data-driven insights.

**Timeline:** January 2024 - December 2024

**Team:** Cross-functional team of 8 (Engineering, Design, QA, Data)

**Technologies:** GCP (Cloud Platform), Data Analytics Tools, User Research Platforms, Campaign Management Systems

---

## The Problem

### Context & Background

CIVITECH's TextOut platform powered peer-to-peer texting for political campaigns and advocacy organizations, enabling volunteer texters to reach voters at scale. However, the platform faced critical challenges:

**User Experience Issues:** Campaign teams struggled with confusing navigation, unclear messaging workflows, and limited visibility into campaign performance. Training new users took hours, and engagement dropped significantly after initial onboarding.

**Lengthy Onboarding:** Setting up a new campaign client required manual data uploads, custom configuration, and extensive back-and-forth with technical teams — often taking 2-3 weeks before campaigns could launch.

**Data Accessibility:** Campaign data lived in siloed systems, making it difficult for users to understand performance, optimize messaging strategies, or demonstrate ROI to stakeholders.

In an industry where timing is everything (elections happen on fixed deadlines), these friction points meant campaigns were losing critical days and failing to maximize their voter outreach potential.

### User Pain Points

- **Steep Learning Curve:** New campaign staff couldn't quickly learn the platform, requiring extensive training and documentation
- **Manual Data Management:** Campaign managers spent hours manually uploading voter lists and configuring settings
- **Limited Performance Visibility:** Teams lacked real-time insights into message delivery, engagement rates, and volunteer productivity
- **Slow Client Onboarding:** Technical setup delays prevented campaigns from launching quickly, especially critical in time-sensitive political environments
- **Cross-Platform Confusion:** Users had to jump between multiple tools to manage campaigns, leading to errors and inefficiency

---

## The Solution

### Strategic Approach

I approached this challenge through **user-centered product development:**

1. **Deep User Research:** Conducted extensive interviews with campaign managers, field organizers, and volunteer texters to understand their workflows, pain points, and goals
2. **Data-Driven Prioritization:** Analyzed usage data, support tickets, and user feedback to identify highest-impact improvement opportunities
3. **Iterative Validation:** Developed mockups and prototypes, testing with real users before committing to engineering resources
4. **Cross-Functional Alignment:** Facilitated workshops with engineering, design, and stakeholders to align on product vision and technical feasibility
5. **Automation-First Mindset:** Identified manual processes that could be automated to reduce friction and improve speed

### Key Features Delivered

#### Feature 1: Redesigned Campaign Dashboard
**What it does:** Centralized hub showing real-time campaign metrics, volunteer activity, and message performance with intuitive visualizations

**Why it matters:** Campaign managers needed to make quick decisions about messaging strategy, volunteer allocation, and outreach timing. The new dashboard provided at-a-glance insights that previously required manual data pulls and analysis.

**Technical approach:** Integrated real-time data pipelines with user-friendly visualization layer, designed with campaign team workflows in mind

![Campaign Dashboard](/project-screenshots/textout-dashboard.png)

#### Feature 2: GCP-Powered Client Onboarding Automation
**What it does:** Automated data import, validation, and campaign configuration using Google Cloud Platform services

**Why it matters:** Reduced onboarding from 2-3 weeks to same-day deployment, enabling campaigns to launch quickly during time-sensitive political windows

**Technical approach:** Built automated ETL pipelines in GCP to ingest client data from various formats, validate against campaign requirements, and configure platform settings without manual intervention

**Impact:** 90% reduction in onboarding time

#### Feature 3: Enhanced Messaging Workflow
**What it does:** Streamlined message creation, targeting, and deployment with clearer navigation and contextual guidance

**Why it matters:** Reduced user errors, improved message quality, and enabled faster campaign iteration based on real-time feedback

**Technical approach:** User research informed information architecture redesign, progressive disclosure of advanced features, and in-app guidance for common tasks

---

## Technical Architecture

### System Design

The TextOut platform integrated with CIVITECH's broader campaign management ecosystem:

```
Campaign Dashboard (React, TypeScript)
        ↓
Platform API (Node.js, REST)
        ↓
Campaign Management Services
        ↓
GCP Data Pipeline (ETL, Validation)
        ↓
Data Warehouse (Analytics, Reporting)
```

### Key Technical Decisions

**Decision 1: GCP for Automation Infrastructure**
- **What:** Built automated onboarding pipeline using Google Cloud Platform services (Cloud Functions, Cloud Storage, BigQuery)
- **Why:** GCP provided serverless architecture that could scale automatically, handle various data formats, and integrate with existing data systems
- **Trade-offs:** Required team to learn GCP ecosystem, but gained significant automation capabilities and reduced operational overhead

**Decision 2: Real-Time Analytics vs. Batch Processing**
- **What:** Implemented real-time data streaming for campaign metrics rather than daily batch updates
- **Why:** Campaign teams needed instant feedback to adjust strategies during active outreach periods
- **Trade-offs:** Higher infrastructure complexity, but dramatically improved user experience and campaign effectiveness

---

## The Outcome

### Quantitative Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **User Engagement** | Baseline | 35% higher | +35% |
| **Client Onboarding Time** | 2-3 weeks | Same day | -90% |
| **User Training Time** | 4-6 hours | 1-2 hours | -60% |
| **Support Tickets** | Baseline | 40% fewer | -40% |

**Key Results:**
- 📈 **35% Engagement Increase:** Users spent more time in platform, sent more messages, and completed more campaigns
- ⚡ **Same-Day Deployment:** GCP automation enabled new campaigns to launch in hours instead of weeks
- 💰 **Operational Efficiency:** Reduced support burden and enabled team to focus on strategic initiatives
- 😊 **User Satisfaction:** NPS improved significantly, with campaign managers citing ease of use as primary improvement

### Qualitative Feedback

> "The new dashboard completely changed how we run campaigns. We can see performance in real-time and make adjustments instantly. It's exactly what we needed."
> — Campaign Manager, Major Statewide Race

**Team/Stakeholder Response:**
The product improvements received enthusiastic feedback from both internal stakeholders and client campaign teams. Engineering teams appreciated the clear product vision and well-defined requirements. Sales teams reported easier demos and higher close rates with improved platform UX.

---

## Challenges & Learnings

### Major Challenges Faced

**Challenge 1: Balancing Speed with Research Rigor**
- **The Problem:** Campaign season timelines demanded fast delivery, but user research takes time to do properly
- **How We Solved It:** Implemented rapid research techniques (guerrilla testing, quick surveys, data analysis of existing usage patterns) to gather insights without extensive time investment
- **Outcome:** Maintained high-quality research insights while meeting aggressive timelines

**Challenge 2: Technical Feasibility of Automation**
- **The Problem:** Initial automation vision required significant GCP infrastructure that engineering team hadn't built before
- **How We Solved It:** Phased approach starting with highest-impact automation (data imports), then expanded to full workflow automation
- **Outcome:** Delivered immediate value while building toward comprehensive solution

**Challenge 3: Cross-Platform Data Integration**
- **The Problem:** Campaign data existed across multiple systems with inconsistent formats and standards
- **How We Solved It:** Developed data normalization layer in GCP that could handle various inputs and transform to consistent format
- **Outcome:** Unified data model that enabled seamless automation and analytics

### Key Learnings

**On Product Development:**
- User research early and often prevents costly rework later. The insights gained from talking to campaign managers shaped feature priorities and saved months of building the wrong things.
- Data-driven prioritization builds stakeholder confidence. When I showed usage data and user feedback supporting feature decisions, buy-in was immediate.
- Automation is a product feature, not just engineering efficiency. The GCP automation directly solved user pain points and became a competitive differentiator.

**On Technical Implementation:**
- Start with simplest automation that delivers value, then expand. We didn't need to automate everything on day one.
- Real-time data pipelines are worth the complexity for time-sensitive use cases like political campaigns.
- Cloud platforms like GCP enable small teams to build enterprise-grade automation without massive infrastructure teams.

**On Team Collaboration:**
- Product vision needs to be crystal clear for cross-functional teams to execute well. I created detailed user stories and acceptance criteria that aligned everyone.
- Regular stakeholder communication prevents scope creep and maintains focus. Weekly demos and feedback sessions kept the project on track.
- Celebrating small wins builds momentum. Each automation milestone energized the team for the next phase.

---

## Project Gallery

### User Interface

![Campaign Dashboard Full View](/project-screenshots/textout-dashboard-full.png)
*Complete campaign dashboard showing real-time metrics, volunteer activity, and message performance*

![Message Creation Workflow](/project-screenshots/textout-messaging.png)
*Streamlined messaging workflow with contextual guidance and targeting options*

### Data & Analytics

![Performance Analytics](/project-screenshots/textout-analytics.png)
*Detailed analytics showing message delivery, engagement rates, and campaign ROI*

### Onboarding Automation

![GCP Pipeline Dashboard](/project-screenshots/textout-gcp-pipeline.png)
*Automated onboarding pipeline reducing setup time by 90%*

---

## Technologies Used

### Product & Research
- **User Research:** UserTesting, Hotjar, Direct Interviews
- **Product Management:** Jira, Confluence, Figma (for mockups)
- **Analytics:** Google Analytics, Mixpanel, Custom Campaign Analytics

### Cloud Infrastructure
- **Platform:** Google Cloud Platform (GCP)
- **Services:** Cloud Functions, Cloud Storage, BigQuery, Pub/Sub
- **Data Pipeline:** Automated ETL workflows
- **Monitoring:** Cloud Monitoring, Logging

### Platform Stack
- **Frontend:** React, TypeScript
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Real-Time:** WebSockets for live updates

### Tools & Services
- **Design:** Figma (mockups and prototypes)
- **Project Management:** Jira, Notion
- **Communication:** Slack, Zoom
- **Version Control:** GitHub

---

## Future Roadmap

**Planned Enhancements:**
- [ ] Predictive analytics for optimal message timing and targeting
- [ ] AI-powered message optimization suggestions
- [ ] Deeper integration with voter file systems
- [ ] Mobile app for volunteer texters
- [ ] Advanced A/B testing framework for message performance

**Exploration Areas:**
- Machine learning models for engagement prediction
- Natural language processing for message sentiment analysis
- Automated volunteer recruitment and onboarding
- Cross-campaign learning and best practice identification

---

## Links & Resources

- **Related Case Study:** [Campaign Analytics Dashboard](/projects/campaign-analytics-dashboard)
- **Related Blog Post:** [Building Product in Civic Tech](/blog/product-management-civic-tech)
- **Company:** [CIVITECH](https://civitech.com)

---

## Reflections

**What made this project successful:**
The combination of deep user research and technical automation. By truly understanding campaign team workflows and pain points, we built features that solved real problems. The GCP automation wasn't just a technical achievement — it was a direct response to user needs for faster onboarding.

**What I'd do differently:**
I would have involved engineering earlier in user research sessions. While I effectively translated research insights into requirements, having engineers hear directly from users would have sparked even more creative technical solutions.

**Impact on my growth:**
This project solidified my belief that great product management sits at the intersection of user empathy and technical possibility. I learned to think both strategically (what should we build?) and tactically (how will we build it?), and to communicate effectively across all stakeholders — from campaign managers to software engineers to executive leadership.

It also reinforced that product management is about saying "no" as much as "yes." We had dozens of feature requests, but focusing on the highest-impact improvements (engagement and onboarding) delivered far more value than trying to do everything.

---

**Project Status:** Launched and in active use by political campaigns
**Last Updated:** December 2024

[← Back to All Projects](/projects) • [Get in Touch →](/contact)

---

_The best products don't just work well — they make users feel empowered to do their best work._
