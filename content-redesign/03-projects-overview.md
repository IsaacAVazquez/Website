# Projects / Product Portfolio

---

## Hero Section

**Layout**: Centered content, max-width 900px

---

### Headline
```
Product work that drives impact
```

**Typography**: H1 (40px), Semibold, neutral-900, centered

---

### Subheadline
```
I've led product development for AI systems, civic tech platforms, and campaign tools that reached millions of users. Here's a selection of my work, told through the lens of product management frameworks.
```

**Typography**: Text XL (20px), Regular, neutral-600, centered, max-width 700px, line-height 1.6

---

## Filter / Category Navigation (Optional)

**Layout**: Horizontal pill navigation, centered, 16px gap

**Categories**:
- All Projects
- Product Management
- AI / Machine Learning
- Civic Tech
- Campaign Tools

**Style**:
- Inactive: neutral-600 text, transparent background, border
- Active: berkeley-blue text, light blue background
- Hover: subtle background change
- Transition: 150ms

---

## Project Grid

**Layout**: Grid of project cards

**Desktop**: 2 columns, 40px gap
**Tablet**: 2 columns, 32px gap
**Mobile**: 1 column, 24px gap

---

### Project Card Structure

Each card contains:
- **Image**: 16:9 aspect ratio, featured image or screenshot
- **Category**: Small label (e.g., "Product Management • AI/ML")
- **Title**: H3 size, project name
- **Excerpt**: 2-3 sentence summary
- **Key Metrics**: 2-3 impact metrics in a compact list
- **Tags**: Skill tags (e.g., "User Research", "Python", "Roadmap")
- **CTA**: "View case study →"

**Card Style**:
- Background: white
- Border: 1px solid neutral-200
- Border radius: 12px
- Padding: 32px
- Shadow: shadow-sm
- Hover: shadow-md + translateY(-4px)
- Transition: 250ms ease-out

---

## Featured Projects List

### 1. AI-Powered QA Automation
```
**Image**: Screenshot of QA dashboard or AI system in action

**Category**: Product Management • AI/ML

**Title**: AI-Powered QA Automation System

**Excerpt**:
Led product development for an AI system that automated 40% of manual QA testing at a growing SaaS company. Reduced bug detection time from days to hours while improving test coverage.

**Key Metrics**:
• 40% reduction in manual QA work
• 60% faster bug detection
• Deployed across 3 product lines

**Tags**: Product Management, Machine Learning, Python, Cross-functional Leadership, AI/ML

**Link**: `/projects/ai-qa-automation`
```

---

### 2. Voter Targeting AI Platform
```
**Image**: Data visualization or campaign dashboard

**Category**: Civic Tech • Data Science

**Title**: AI Voter Targeting Platform

**Excerpt**:
Built a machine learning model that identified high-propensity voters, increasing turnout by 12% in local elections. Processed 500K+ voter records and deployed across 15 campaigns.

**Key Metrics**:
• 12% increase in voter turnout
• 500K+ voters analyzed
• Deployed in 15 campaigns

**Tags**: Machine Learning, Product Strategy, Python, Voter Data, Campaign Strategy

**Link**: `/projects/voter-targeting`
```

---

### 3. TextOut: SMS Outreach Platform
```
**Image**: TextOut platform interface

**Category**: Product • Civic Tech

**Title**: TextOut SMS Platform

**Excerpt**:
Led product development for an SMS voter outreach platform serving 100+ Democratic campaigns. Drove feature roadmap, conducted user research, and managed cross-functional team of engineers and designers.

**Key Metrics**:
• 100+ campaigns served
• 2M+ voters reached
• 15% average response rate

**Tags**: Product Management, User Research, Roadmap Planning, Civic Tech

**Link**: `/projects/textout`
```

---

### 4. RunningMate: Campaign Management Tool
```
**Image**: RunningMate dashboard

**Category**: Product • Campaign Tools

**Title**: RunningMate Campaign Platform

**Excerpt**:
Product lead for campaign management platform used by Democratic candidates and organizers. Integrated voter databases, field operations, and fundraising tools in a single platform.

**Key Metrics**:
• 50+ campaigns managed
• 200K+ voter contacts tracked
• $1M+ in fundraising processed

**Tags**: Product Management, Platform Strategy, User Research, Campaign Tools

**Link**: `/projects/runningmate`
```

---

### 5. Fantasy Football Analytics (Side Project)
```
**Image**: Fantasy football tier chart

**Category**: Side Project • Data Visualization

**Title**: Fantasy Football Draft Analytics

**Excerpt**:
Built a fantasy football analytics platform with tier-based rankings, draft trackers, and player comparison tools. Integrated D3.js visualizations and automated data pipeline for weekly updates.

**Key Metrics**:
• 10K+ monthly users
• Real-time tier calculations
• Automated weekly data refresh

**Tags**: Product Development, D3.js, TypeScript, Data Pipeline, Side Project

**Link**: `/projects/fantasy-football`
```

---

## Call to Action

**Layout**: Centered, max-width 600px, 80px vertical padding

---

### Content
```
**Headline**: Want to see more?

**Description**:
These case studies represent a selection of my product work. If you want to discuss any of these projects in detail, learn about my PM process, or talk about opportunities, I'd love to connect.

**CTA Button**: "Get in touch"
**Link**: `/contact`
```

---

## Component Breakdown

### Components Needed:
1. **ProjectsHero**
   - Centered headline + subheadline
   - Clean, minimal design

2. **CategoryFilter** (optional)
   - Pill-style navigation
   - Active state styling
   - Click to filter projects

3. **ProjectCard**
   - Image + category + title + excerpt + metrics + tags + CTA
   - Hover lift effect
   - Responsive layout

4. **ProjectGrid**
   - 2-column responsive grid
   - Consistent spacing
   - Scroll animations

---

## Spacing & Layout

### Desktop (1024px+)
- Hero: 80px vertical padding
- Grid: 2 columns, 40px gap
- Container: max-width 1280px

### Tablet (768px - 1023px)
- Grid: 2 columns, 32px gap
- Smaller padding

### Mobile (< 768px)
- Grid: 1 column
- 24px gap
- Compact card padding

---

## Animations

### On Page Load
- Hero fades in (500ms)
- Cards stagger in (100ms delay between each)

### On Scroll
- Cards fade + slide up when visible

### Hover
- Card: translateY(-4px) + shadow increase
- CTA link: underline appears
- Image: subtle scale (1.0 → 1.05)

---

## SEO & Metadata

```html
<title>Product Portfolio | Isaac Vazquez | PM Case Studies</title>
<meta name="description" content="Product management case studies showcasing AI systems, civic tech platforms, and campaign tools that drove measurable impact." />

<!-- Open Graph -->
<meta property="og:title" content="Product Portfolio | Isaac Vazquez" />
<meta property="og:description" content="PM case studies in AI, civic tech, and product development." />
<meta property="og:type" content="website" />
```

---

**File**: `projects.md` or `portfolio.md`
**Route**: `/projects`
**Last updated**: November 2025
