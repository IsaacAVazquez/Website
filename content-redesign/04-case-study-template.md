# Case Study Template

---

## Structure

All product case studies follow this PM-focused framework:

1. **Overview** - Quick context and key results
2. **Problem** - User problem and business context
3. **Discovery** - Research and insights
4. **Solution** - Product approach and decisions
5. **Execution** - How we built and launched
6. **Results** - Metrics and impact
7. **Learnings** - What I learned

---

## Header Section

**Layout**: Full-width hero, max-width 900px centered content

---

### Project Title
**Typography**: H1 (40px), Semibold, neutral-900

### Project Metadata
**Layout**: Horizontal row of metadata items

```
**Role**: [Your role]
**Timeline**: [Project duration]
**Company**: [Organization]
**Team**: [Team size and composition]
```

**Typography**: Text SM (14px), Medium, neutral-600

### Tags
**Layout**: Horizontal row of skill tags

```
Product Management • User Research • Python • Machine Learning
```

**Style**: Small pills, berkeley-blue background, white text, 4px padding

---

## Overview Section

**Section Title**: "Overview"

**Layout**: 2-column grid on desktop, 1-column mobile

---

### Left Column: Context
```
**Subheading**: The challenge

**Content**:
[2-3 sentences describing the problem you were solving and why it mattered]

**Example**:
Manual QA testing was consuming 40% of our engineering team's time, slowing down releases and increasing the risk of bugs reaching production. We needed a solution that could maintain quality while freeing up engineers to build features.
```

### Right Column: Key Results
```
**Subheading**: Impact

**Metrics List**:
• [Key metric 1 with number]
• [Key metric 2 with number]
• [Key metric 3 with number]
• [Key metric 4 with number]

**Example**:
• 40% reduction in manual QA work
• 60% faster bug detection
• 95% test accuracy
• Deployed across 3 product lines
```

**Card Style**: Light background (neutral-50), border, padding, clean separation

---

## Problem Section

**Section Title**: "The problem"

**Layout**: Single column, max-width 768px

---

### User Context
```
**Subheading**: Who we were building for

**Content**:
[Describe the users, their workflow, and their pain points]

**Example**:
Our QA team consisted of 5 engineers who manually tested every feature before release. They were spending hours clicking through test cases, documenting bugs in spreadsheets, and coordinating with developers to fix issues. The process was tedious, error-prone, and didn't scale as we grew.
```

### Business Context
```
**Subheading**: Why this mattered

**Content**:
[Explain the business impact and why solving this was a priority]

**Example**:
As we scaled from 10 to 50 engineers, our release velocity was slowing down. Manual QA became a bottleneck—releases that used to take days were taking weeks. Competitors were shipping faster, and we were losing ground.
```

### Problem Statement
```
**Format**: Callout box or emphasized text

**Content**:
How might we [action] so that [users] can [benefit]?

**Example**:
How might we automate repetitive QA tasks so that our QA engineers can focus on complex edge cases and our developers can ship features faster?
```

**Style**: Callout box with light blue background, border, prominent text

---

## Discovery Section

**Section Title**: "Discovery & research"

**Layout**: Mixed - prose + lists + quotes

---

### Research Methods
```
**Subheading**: How we learned

**Content**:
[Describe your research approach]

**Example**:
I conducted 12 user interviews with QA engineers and developers to understand their workflows. I shadowed the QA team for a week, observing how they tested features and identified patterns in their work. I also analyzed 6 months of bug reports to identify common failure modes.
```

### Key Insights
```
**Subheading**: What we learned

**Format**: Numbered or bulleted list of insights

**Example**:
1. **80% of bugs followed predictable patterns** - Most issues fell into categories: UI rendering, form validation, API errors, and edge cases. These could be automated.

2. **QA engineers wanted to focus on creative testing** - They valued exploratory testing and complex scenarios, not repetitive checkbox work.

3. **Developers needed faster feedback** - Waiting days for QA feedback slowed iteration. They wanted to catch bugs earlier in the dev process.
```

### User Quote (Optional)
```
**Format**: Large quote block

**Example**:
> "I spend half my day clicking through the same flows, checking if buttons work, if forms validate correctly. It's mind-numbing. I'd rather focus on weird edge cases that actually require human judgment."
>
> **— QA Engineer, User Interview**
```

**Style**: Large quote with left border (berkeley-blue), italic text, attribution below

---

## Solution Section

**Section Title**: "The solution"

**Layout**: Prose + images/diagrams + subsections

---

### Product Vision
```
**Subheading**: What we decided to build

**Content**:
[Describe your product approach at a high level]

**Example**:
We decided to build an AI-powered QA automation system that could learn from our existing test cases, identify patterns in bugs, and automatically test common user flows. The system would run continuously, catch bugs before they reached QA, and give developers immediate feedback.
```

### Product Principles
```
**Format**: Bulleted list or cards

**Example**:
• **Start simple, expand gradually** - Automate the most common test cases first, then expand to complex scenarios
• **Augment humans, don't replace them** - Free up QA engineers to focus on creative testing
• **Feedback in minutes, not days** - Run tests on every commit so developers catch bugs immediately
```

### Key Features
```
**Format**: Feature cards or subsections with images

**Feature 1: Automated Test Generation**
Build AI models that learn from historical test cases and generate new tests automatically.

**Feature 2: Visual Regression Testing**
Detect UI changes by comparing screenshots before and after code changes.

**Feature 3: Real-time Feedback Dashboard**
Show developers test results immediately after pushing code.
```

**Include**: Screenshots, diagrams, wireframes where relevant

---

### Product Decisions
```
**Subheading**: Key decisions I made

**Format**: Decision + rationale

**Example**:
**Decision**: Start with visual regression testing instead of building custom ML models from scratch.

**Rationale**: Visual regression was the highest-impact, lowest-effort automation we could ship quickly. It would give the team immediate value while we built more complex ML features.
```

---

## Execution Section

**Section Title**: "Building & launching"

**Layout**: Timeline or phases

---

### Development Process
```
**Subheading**: How we built it

**Content**:
[Describe your development approach, sprints, milestones]

**Example**:
We worked in 2-week sprints with a cross-functional team of 2 engineers, 1 designer, and 1 QA lead. I ran daily standups, weekly sprint planning, and bi-weekly stakeholder reviews. We shipped an MVP in 6 weeks, then iterated based on feedback.
```

### Roadmap / Phases
```
**Phase 1 (Weeks 1-2): Discovery & Planning**
• User research
• Technical feasibility assessment
• Roadmap prioritization

**Phase 2 (Weeks 3-6): MVP Development**
• Visual regression testing
• Dashboard for test results
• Integration with CI/CD pipeline

**Phase 3 (Weeks 7-10): Iteration & Expansion**
• AI-powered test generation
• Performance optimizations
• Rollout to additional product lines
```

### Cross-functional Collaboration
```
**Subheading**: How we worked together

**Content**:
[Describe how you led the team, managed stakeholders, resolved conflicts]

**Example**:
I held weekly syncs with engineering, design, and QA leadership to align on priorities. When engineering pushed back on timeline, I worked with them to identify MVP scope we could ship in 6 weeks instead of 12. I also ran bi-weekly demos for the executive team to maintain buy-in.
```

---

## Results Section

**Section Title**: "Impact & results"

**Layout**: Metrics cards + analysis

---

### Key Metrics
```
**Layout**: Grid of metric cards (2x2 or 3 columns)

**Metric Card 1**:
40% reduction
Manual QA work

**Metric Card 2**:
60% faster
Bug detection

**Metric Card 3**:
95% accuracy
Test pass rate

**Metric Card 4**:
3 product lines
Deployed
```

**Style**: Large number (display size), label below, card with background and border

---

### Qualitative Impact
```
**Subheading**: What changed

**Content**:
[Describe non-quantitative impacts]

**Example**:
QA engineers reported higher job satisfaction—they were finally doing creative, high-value work instead of repetitive testing. Developers appreciated getting instant feedback on their code. Releases became more predictable and less stressful.
```

### User Feedback
```
**Format**: Quote or testimonial

**Example**:
> "This changed how we work. I can push code and know within minutes if I broke something. It's like having a safety net."
>
> **— Senior Engineer**
```

---

## Learnings Section

**Section Title**: "What I learned"

**Layout**: Single column, reflective prose

---

### Key Takeaways
```
**Subheading**: Lessons from this project

**Format**: Numbered list with explanation

**Example**:

1. **Start with user pain, not technology** - I originally wanted to build custom ML models because it sounded impressive. But users needed visual regression testing first. Solving the real pain point created immediate value.

2. **Ship an MVP, then iterate** - Waiting 12 weeks to ship a perfect solution would have cost us momentum. Shipping in 6 weeks with limited scope got us feedback faster and built team confidence.

3. **Cross-functional collaboration is everything** - The best ideas came from working closely with QA engineers and developers. They understood the problem better than I did, and I needed their expertise to build the right solution.

4. **Metrics tell the story** - Tracking the right metrics (manual QA hours, bug detection time) helped us prove impact and secure buy-in for future investment.
```

### What I'd Do Differently
```
**Content**:
[Honest reflection on what you'd change]

**Example**:
I would have involved the QA team earlier in the roadmap planning process. I made some feature decisions in isolation that didn't align with their workflow, and we had to backtrack. Co-creating the roadmap with users would have saved time.
```

---

## Next Project CTA

**Layout**: Card or section at bottom

```
**Headline**: See more work

**Grid of Related Projects** (2-3 cards):
- [Project thumbnail + title]
- [Project thumbnail + title]

**OR**

**CTA Button**: "View all projects"
```

---

## Component Breakdown

### Components Needed:
1. **CaseStudyHeader**
   - Title + metadata + tags
   - Clean, hierarchical layout

2. **OverviewCard**
   - 2-column layout
   - Context + results

3. **ProblemStatement**
   - Callout box
   - Prominent "How might we" format

4. **InsightsList**
   - Numbered insights
   - Bold titles + descriptions

5. **UserQuote**
   - Large quote block
   - Left border accent
   - Attribution

6. **FeatureCard**
   - Title + description + image
   - Grid layout

7. **MetricCard**
   - Large number
   - Label
   - Card styling

8. **TimelinePhases**
   - Vertical timeline or phases
   - Clear milestones

9. **LearningsList**
   - Numbered list
   - Reflective tone

---

## Spacing & Layout

### Desktop (1024px+)
- Prose max-width: 768px
- Sections: 80px vertical padding
- Grid gaps: 32px

### Tablet (768px - 1023px)
- Adjusted widths
- 2-column grids maintained
- 64px section padding

### Mobile (< 768px)
- Single column
- 48px section padding
- Compact spacing

---

## SEO & Metadata

```html
<title>[Project Title] Case Study | Isaac Vazquez</title>
<meta name="description" content="[One-sentence summary of project and impact]" />

<!-- Open Graph -->
<meta property="og:title" content="[Project Title] | Isaac Vazquez" />
<meta property="og:description" content="[Project summary]" />
<meta property="og:image" content="[Project thumbnail URL]" />
<meta property="og:type" content="article" />
```

---

**File**: `case-study-template.md`
**Usage**: Template for all project case studies
**Last updated**: November 2025
