# Case Study: AI Voter Targeting Platform

---

## Header

### Project Title
```
AI Voter Targeting Platform
```

### Metadata
```
**Role**: Product Manager & Data Scientist
**Timeline**: 4 months (initial model), ongoing refinement
**Company**: Civitech / Open Progress
**Team**: 1 Engineer, 1 Data Scientist, Campaign Partners (15 campaigns)
```

### Tags
```
Machine Learning • Product Strategy • Python • Voter Data • Civic Tech • Campaign Strategy • Data Science
```

---

## Overview

### The Challenge
Democratic campaigns were wasting resources on low-propensity voters—people unlikely to turn out no matter how much outreach they received. Meanwhile, high-propensity voters who needed a nudge were being ignored. We needed an AI system that could identify which voters to prioritize for maximum turnout impact.

### Impact
- **12% increase** in voter turnout in target precincts
- **500K+ voters** analyzed across 15 campaigns
- **30% more efficient** resource allocation (fewer doors knocked, higher impact)
- **15 campaigns** deployed the model in 2024 elections

---

## The Problem

### Who We Were Building For

Our users were campaign field organizers running Democratic campaigns in competitive districts. Their workflow looked like this:

1. Download voter file with hundreds of thousands of records
2. Manually segment voters by precinct, party affiliation, and voting history
3. Assign canvassers to knock doors based on gut instinct
4. Hope they're targeting the right voters

The problem: They had no data-driven way to identify which voters would actually respond to outreach. They were knocking on doors of people who were either:
- **Already committed** to voting (waste of resources)
- **Never going to vote** no matter how much outreach they received (also waste)

Meanwhile, **persuadable high-propensity voters** who could be nudged to turn out were being missed.

### Why This Mattered

In competitive elections, turnout is everything. A 1-2% increase in turnout can decide races. But campaigns have limited resources: limited volunteers, limited time, limited money.

The business impact:
- **Lost elections**: Poorly targeted outreach meant losing winnable races
- **Wasted volunteer time**: Canvassers knocking on wrong doors
- **Burnout**: Volunteers getting discouraged by low response rates
- **Competitive disadvantage**: Republicans were using sophisticated targeting; Democrats were using spreadsheets

One field organizer told me:

> "We're knocking on 10,000 doors and maybe converting 200 voters. I know we're wasting time, but I don't have a better system. I'm just guessing."

### Problem Statement

**How might we identify high-propensity persuadable voters so that campaigns can allocate resources efficiently and maximize turnout?**

---

## Discovery & Research

### How We Learned

I ran a 6-week discovery phase working directly with campaigns:

**Campaign Shadowing**: Spent 2 weeks embedded with a local campaign, observing their targeting process and knocking doors with canvassers.

**Data Analysis**: Analyzed voter files from 10 past elections (2M+ voter records) to identify patterns in turnout behavior.

**User Interviews**: Conducted 15 interviews with field organizers, campaign managers, and data directors to understand their needs.

**Academic Research**: Studied political science literature on voter turnout models and persuasion tactics.

### What We Learned

**Key Insight 1: Past voting behavior is the strongest predictor of future turnout**

Voters who voted in the last 2 primaries were 5x more likely to vote in the next election than voters with no recent voting history. This was the foundation of our model.

**Key Insight 2: Age, party registration, and precinct matter**

Older voters (50+) turned out at 2x the rate of young voters (18-29). Registered Democrats in competitive precincts were more responsive to outreach than Democrats in deep-blue areas.

**Key Insight 3: Campaigns needed a simple "score" not complex dashboards**

Field organizers didn't have time to analyze multi-dimensional data. They needed a single number (0-100) that told them: "This voter is worth contacting."

**Key Insight 4: Trust was everything**

Campaigns were skeptical of "black box" AI models. They wanted to understand *why* a voter scored high or low. Explainability was critical for adoption.

One campaign manager said:

> "If you can't explain why your model says I should knock on this voter's door, I'm not going to trust it."

---

## The Solution

### What We Decided to Build

We built a machine learning model that scored every voter (0-100) on their likelihood to:
1. Turn out to vote
2. Respond to outreach (persuadability)

The model combined:
- **Voting history** (primary elections, general elections, local elections)
- **Demographics** (age, party registration, gender)
- **Geographic data** (precinct competitiveness, turnout trends)
- **Past campaign contacts** (response rates, door knock history)

We integrated this into a simple web dashboard where campaigns could:
- Upload voter files
- Get scored lists within hours
- Export prioritized contact lists for canvassers
- Track performance and refine targeting

### Product Principles

- **Accuracy over complexity**: A simple, accurate model beats a complex, hard-to-explain model
- **Explainability builds trust**: Show *why* a voter scored high or low
- **Speed matters**: Campaigns need results in hours, not days
- **Make it actionable**: Don't just give scores—give contact lists ready for canvassers

### Key Features

**Feature 1: Turnout Score (0-100)**

Every voter gets a score predicting their likelihood to vote. Scores are based on:
- Voting history (50% weight)
- Demographics (30% weight)
- Geographic factors (20% weight)

**Impact**: Campaigns could prioritize outreach to voters scoring 60-85 (high-propensity persuadables).

---

**Feature 2: Explainability Dashboard**

For each voter, the system shows:
- Why they scored high or low
- Key factors influencing their score
- Recommended outreach strategy

Example:
> **Score: 78 (High Priority)**
>
> **Why**: Voted in last 2 primaries, age 55, registered Democrat in competitive precinct.
>
> **Recommendation**: Door knock or phone call. High likelihood to respond.

**Impact**: Built trust with campaigns who could explain the model to their teams.

---

**Feature 3: Bulk Upload & Export**

Campaigns upload voter files (CSV with 100K+ records). System processes files in <1 hour and returns:
- Scored voter list
- Prioritized contact list (top 20% of voters)
- Walk lists segmented by precinct

**Impact**: Reduced targeting time from days (manual Excel work) to hours (automated scoring).

---

**Feature 4: Performance Tracking**

After campaigns deploy the model, we track:
- Actual turnout vs. predicted turnout
- Response rates by score range
- Model accuracy over time

This feedback loop improves the model for future elections.

**Impact**: Model accuracy improved from 82% to 91% over 3 election cycles.

---

### Key Product Decisions

**Decision 1: Use logistic regression, not deep learning**

**Rationale**: Deep learning models are powerful but hard to explain. Logistic regression is simpler, faster, and interpretable—critical for campaign trust. We prioritized explainability over marginal accuracy gains.

**Decision 2: Focus on turnout prediction, not persuasion**

**Rationale**: Early user research suggested campaigns also wanted to predict *who* to persuade (swing voters). But persuasion is much harder to model than turnout. We scoped down to turnout prediction for the MVP, with persuasion as a future feature.

**Decision 3: Build a web app, not a Python script**

**Rationale**: Campaigns needed a user-friendly interface, not a command-line tool. Building a web app increased development time but made the product accessible to non-technical field organizers.

---

## Building & Launching

### How We Built It

We worked in 3-week sprints with a small, scrappy team:
- **1 Engineer**: Web app development (Flask, React)
- **1 Data Scientist**: Model training and refinement
- **Me (PM/Data Scientist)**: Product strategy, user research, stakeholder management, model validation

I ran:
- **Weekly sprint planning** with the team
- **Bi-weekly user feedback sessions** with campaign partners
- **Monthly model reviews** to assess accuracy and iterate

### Roadmap

**Phase 1 (Weeks 1-6): Discovery & Model Training**
- User research (campaign shadowing, interviews)
- Data collection (voter files from past elections)
- Initial model training (logistic regression)
- Model validation (cross-validation, accuracy testing)

**Phase 2 (Weeks 7-10): MVP Development**
- Web app for voter file upload
- Scoring engine (batch processing)
- Export functionality (CSV download)
- Basic explainability (feature importance)

**Phase 3 (Weeks 11-14): Pilot Launch**
- Deploy with 3 pilot campaigns
- Track performance (turnout, response rates)
- Gather feedback and iterate
- Refine model based on real-world data

**Phase 4 (Weeks 15-16): Full Rollout**
- Expand to 15 campaigns
- Documentation and training
- Automated performance tracking
- Model improvements based on feedback

### Cross-functional Collaboration

**Challenge**: Campaigns were skeptical of AI and worried about "replacing human judgment."

**How I handled it**: I positioned the model as a tool to *augment* field organizers, not replace them. I ran training sessions explaining how the model worked, showed real examples, and emphasized that humans still made final decisions. This built trust.

**Challenge**: Data quality varied wildly across campaigns.

**How I handled it**: I built a data validation step that flagged issues (missing fields, formatting errors) before processing. This prevented bad data from breaking the model and gave campaigns clear feedback on how to fix their voter files.

**Challenge**: The engineering team wanted to build a complex dashboard with 20+ features.

**How I handled it**: I pushed back and insisted on an MVP with 3 core features: upload, score, export. We could add dashboards later. Shipping quickly and getting feedback was more important than feature bloat.

---

## Impact & Results

### Key Metrics

**12% increase**
in voter turnout (target precincts)

**500K+ voters**
analyzed across 15 campaigns

**30% more efficient**
resource allocation

**15 campaigns**
deployed in 2024 elections

### Qualitative Impact

**Campaigns felt more confident in their targeting**: Field organizers reported feeling less like they were guessing and more like they had a data-driven plan.

**Volunteers were more motivated**: Canvassers saw higher response rates when targeting high-scoring voters, which kept them engaged and reduced burnout.

**Campaigns won competitive races**: 3 of the 15 campaigns using the model won races decided by <2% margins. They attributed part of their success to better targeting.

### User Feedback

> "This changed how we run campaigns. We're not wasting time on voters who were never going to turn out. We're focusing on people we can actually move."
>
> **— Field Organizer, Competitive House Race**

> "I was skeptical, but the model was right. The voters it told us to prioritize had way higher response rates than our old targeting method."
>
> **— Campaign Manager**

---

## What I Learned

### Key Takeaways

**1. Simplicity beats complexity in high-stakes environments**

Campaigns don't have time for complex tools. A simple score (0-100) was infinitely more useful than a multi-dimensional dashboard. Lesson: Match your product to your user's context. Field organizers working 80-hour weeks need simplicity, not sophistication.

**2. Trust is a feature, not a nice-to-have**

Campaigns wouldn't adopt the model until they understood *why* it made certain predictions. Explainability was as important as accuracy. Lesson: For AI products, interpretability is critical for adoption.

**3. Start with a narrow problem, then expand**

We originally wanted to predict turnout *and* persuasion. Scoping down to just turnout let us ship faster and build trust before tackling harder problems. Lesson: Solve one problem really well before adding more.

**4. Real-world validation beats lab accuracy**

Our model tested at 85% accuracy in cross-validation, but we didn't know if it would work in real campaigns until we ran pilots. Real-world feedback was 10x more valuable than lab metrics. Lesson: Get your product in users' hands as fast as possible.

**5. Product decisions are often data + judgment calls**

Should we use logistic regression or deep learning? Should we focus on turnout or persuasion? Data informed these decisions, but ultimately they required judgment about user needs, technical constraints, and strategic priorities. Lesson: PMs need to balance data with intuition.

### What I'd Do Differently

**Start with smaller campaigns first**: We piloted with medium-sized campaigns (50K+ voters), which meant higher stakes and more pressure. Starting with smaller, lower-stakes campaigns would have let us iterate faster.

**Build better onboarding**: Many campaigns struggled to upload voter files correctly. A guided onboarding flow with examples and validation would have reduced support burden.

**Invest in automated testing earlier**: We manually tested the model on every new voter file, which was time-consuming. Automated testing would have scaled better as we onboarded more campaigns.

---

## See More Work

**Related Projects**:
- [AI-Powered QA Automation](/projects/ai-qa-automation)
- [TextOut SMS Platform](/projects/textout)
- [RunningMate Campaign Tool](/projects/runningmate)

**Or**: [View all projects](/projects)

---

**File**: `voter-targeting.md`
**Route**: `/projects/voter-targeting`
**Last updated**: November 2025
