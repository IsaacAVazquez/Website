# Home / Landing Page

---

## Hero Section

**Layout**: Full-width background with centered content, max-width 1024px

**Visual**: Gradient background (berkeley-blue to darker blue), white text, generous padding (96px vertical on desktop, 64px mobile)

---

### Headline
```
Isaac Vazquez
MBA → Product Manager
```

**Typography**: Display XL (60px), Medium weight (500), tight leading (1.1)

---

### Subheadline
```
Building cloud AI tools that solve real problems for real people.
```

**Typography**: Text XL (20px), Regular weight (400), neutral-100 color

---

### One-Sentence Pitch
```
Technical Product Manager with a background in AI, civic tech, and political campaigns—transitioning from UC Berkeley Haas MBA to PM roles at top tech companies.
```

**Typography**: Text LG (18px), Regular weight, neutral-200 color, max-width 700px, centered

---

### CTA Buttons

**Layout**: Horizontal row, center-aligned, 16px gap

**Primary CTA**:
- Text: "View my work"
- Link: `/projects`
- Style: Primary button (berkeley-blue background, white text)

**Secondary CTA**:
- Text: "Get in touch"
- Link: `/contact`
- Style: Secondary button (white border, white text, transparent background)

---

## Companies & Logos Section

**Section Title**: "Experience at"

**Layout**: Horizontal row of logos/company names, centered, wrapping on mobile

**Companies** (logo or text):
- UC Berkeley Haas School of Business
- Open Progress
- Civitech
- Apple (interviewed)
- CampaignHQ
- Various political campaigns

**Style**: Neutral-400 color, opacity 0.7, hover opacity 1.0, grayscale filters for logos

**Typography**: Text SM (14px), Medium weight, uppercase letter-spacing

---

## What I'm Focused On Now

**Section Title**: "What I'm focused on now"

**Typography**: H2 (32px), Semibold, neutral-900

**Layout**: 2-column grid on desktop, 1-column on mobile, 32px gap

---

### Card 1: Product Management
```
**Icon**: Briefcase or Product icon

**Title**: Product Management

**Description**:
Pursuing PM roles at top tech companies focused on cloud infrastructure, AI/ML tools, and developer platforms. Actively interviewing and building my product portfolio.
```

### Card 2: UC Berkeley MBA
```
**Icon**: Graduation cap

**Title**: UC Berkeley Haas MBA

**Description**:
Second-year MBA student at UC Berkeley Haas, graduating May 2025. Focused on product strategy, go-to-market, and technology leadership.
```

### Card 3: Civic Tech
```
**Icon**: Globe or Community icon

**Title**: Civic Technology

**Description**:
Building tools that increase voter turnout and political engagement. Long-term goal: found a political tech startup that empowers grassroots campaigns.
```

**Card Style**:
- Background: white
- Border: 1px solid neutral-200
- Border radius: 12px
- Padding: 32px
- Shadow: shadow-sm
- Hover: shadow-md + translateY(-4px)
- Transition: 250ms ease-out

---

## Featured Projects

**Section Title**: "Featured work"

**Typography**: H2 (32px), Semibold, centered, margin-bottom 48px

**Layout**: 3-column grid on desktop, 2-column tablet, 1-column mobile, 32px gap

---

### Project Card 1: AI QA Automation
```
**Image**: Screenshot or diagram (16:9 aspect ratio)

**Category**: Product Management • AI/ML

**Title**: AI-Powered QA Automation

**Description**:
Built an AI system that automated 40% of manual QA testing, reducing bug detection time from days to hours. Led cross-functional team of engineers and designers.

**Metrics**:
• 40% reduction in manual QA work
• 60% faster bug detection
• Deployed across 3 product lines

**CTA**: "View case study →"
**Link**: `/projects/ai-qa-automation`
```

### Project Card 2: Voter Targeting Model
```
**Image**: Data visualization or campaign screenshot

**Category**: Civic Tech • Data Science

**Title**: AI Voter Targeting Platform

**Description**:
Developed machine learning model that identified high-propensity voters, increasing turnout by 12% in local elections. Processed 500K+ voter records.

**Metrics**:
• 12% increase in voter turnout
• 500K+ voters analyzed
• Deployed in 15 campaigns

**CTA**: "View case study →"
**Link**: `/projects/voter-targeting`
```

### Project Card 3: TextOut Platform
```
**Image**: TextOut platform interface

**Category**: Product • Civic Tech

**Title**: TextOut: SMS Outreach Platform

**Description**:
Led product development for SMS voter outreach platform serving 100+ Democratic campaigns. Drove feature roadmap and user research.

**Metrics**:
• 100+ campaigns served
• 2M+ voters reached
• 15% average response rate

**CTA**: "View case study →"
**Link**: `/projects/textout`
```

**Card Style**:
- Image: 16:9 aspect ratio, 12px border radius, object-fit cover
- Category: Text XS (12px), Medium weight, berkeley-blue color, uppercase, letter-spacing
- Title: H4 (20px), Semibold, neutral-900
- Description: Text Base (16px), Regular, neutral-600, line-height 1.6
- Metrics: Bulleted list, Text SM (14px), neutral-700
- CTA: Inline link style, berkeley-blue with hover underline

---

## Current Status / Now Section

**Section Title**: "What I'm doing now"

**Typography**: H2 (32px), Semibold

**Layout**: Single column, max-width 768px, centered

**Background**: neutral-50 section background

---

### Content
```
**Last updated**: November 2025

I'm currently:

• **Interviewing for PM roles** at companies like Stripe, Atlassian, and Google Cloud—focused on developer tools, AI/ML products, and cloud infrastructure.

• **Finishing my MBA** at UC Berkeley Haas. Graduating in May 2025 with concentrations in Product Management and Data Analytics.

• **Building my product portfolio** with case studies that demonstrate my PM skills: user research, roadmap prioritization, cross-functional leadership, and data-driven decision making.

• **Cooking new recipes** every week, hiking in the East Bay hills, and spending time with family in Southern California.

**Where I want to be**:

Short-term (next 2 years): Product Manager at a top tech company, working on cloud/AI tools that developers love.

Long-term (5-10 years): Founder of a political tech startup that makes it easier for grassroots campaigns to reach voters and win elections.
```

**Typography**:
- Body: Text LG (18px), Regular weight, neutral-700
- Bold items: Semibold weight
- Bullets: 24px margin between items
- Max-width: 700px

---

## Final CTA Section

**Layout**: Centered, max-width 600px, generous padding (80px vertical)

**Background**: White

---

### Content
```
**Headline**: Let's work together

**Subheadline**:
I'm actively looking for Product Management opportunities in cloud, AI/ML, and developer tools. If you're hiring or want to chat about product, civic tech, or the MBA-to-PM path, I'd love to hear from you.

**CTA Button**: "Get in touch"
**Link**: `/contact`
**Style**: Primary button (large size)
```

**Typography**:
- Headline: H2 (32px), Semibold, neutral-900
- Subheadline: Text LG (18px), Regular, neutral-600, line-height 1.6
- Button: 16px text, 14px vertical padding, 32px horizontal padding

---

## Component Breakdown

### Components Needed:
1. **HeroSection**
   - Gradient background
   - Centered content
   - Headline + subheadline + pitch
   - CTA button group

2. **CompanyLogos**
   - Horizontal scrolling row
   - Grayscale + opacity effects
   - Responsive wrapping

3. **FocusCard**
   - Icon + title + description
   - Hover effects
   - Grid layout

4. **ProjectCard**
   - Image + category + title + description + metrics + CTA
   - Hover lift effect
   - 16:9 image ratio

5. **NowSection**
   - Bulleted list styling
   - Emphasis on bold items
   - Centered, readable width

6. **CTASection**
   - Centered layout
   - Large button
   - Generous spacing

---

## Spacing & Layout

### Desktop (1024px+)
- Hero: 96px vertical padding
- Sections: 80px vertical padding, 64px between sections
- Container: max-width 1280px, 80px horizontal padding
- Content: max-width 768px for prose

### Tablet (768px - 1023px)
- Hero: 80px vertical padding
- Sections: 64px vertical padding
- Container: 40px horizontal padding
- Grid: 2 columns for projects

### Mobile (< 768px)
- Hero: 64px vertical padding
- Sections: 48px vertical padding
- Container: 20px horizontal padding
- Grid: 1 column

---

## Animations

### On Page Load
1. Hero fades in (opacity 0 → 1, 500ms)
2. Content slides up (translateY 20px → 0, 350ms, staggered 100ms)

### On Scroll
1. Sections fade in when 20% visible (intersection observer)
2. Cards slide up with stagger

### Hover States
1. Buttons: shadow-sm → shadow-md, 150ms
2. Cards: translateY 0 → -4px, shadow-sm → shadow-md, 250ms
3. Links: underline appears, 150ms

---

## SEO & Metadata

```html
<title>Isaac Vazquez | Product Manager | UC Berkeley MBA</title>
<meta name="description" content="Technical Product Manager with AI, civic tech, and campaign background. UC Berkeley Haas MBA candidate pursuing PM roles at top tech companies." />

<!-- Open Graph -->
<meta property="og:title" content="Isaac Vazquez | Product Manager" />
<meta property="og:description" content="Building cloud AI tools that solve real problems for real people." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://isaacavazquez.com" />
<meta property="og:image" content="https://isaacavazquez.com/og-image.jpg" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Isaac Vazquez | Product Manager" />
<meta name="twitter:description" content="Building cloud AI tools that solve real problems for real people." />
```

---

**File**: `index.md` or `home.md`
**Route**: `/`
**Last updated**: November 2025
