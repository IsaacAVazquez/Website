# Writing / Blog

---

## Hero Section

**Layout**: Centered content, max-width 900px

---

### Headline
```
Writing about product, civic tech, and building things
```

**Typography**: H1 (40px), Semibold, neutral-900, centered

---

### Subheadline
```
Thoughts on product management, lessons from political campaigns, reflections on the MBA journey, and ideas about technology that empowers people.
```

**Typography**: Text XL (20px), Regular, neutral-600, centered, max-width 700px

---

## Blog Post Grid

**Layout**: Vertical list of blog post cards

**Desktop**: Single column, max-width 800px, centered
**Mobile**: Full width with padding

---

## Featured Posts

### Post 1: The PM Skills You Actually Need (Fully Written)
```
**Date**: November 15, 2025
**Category**: Product Management
**Read Time**: 8 min
**Excerpt**:
After 100+ PM interviews and 3 years building products, here are the skills that actually matter—and the ones everyone talks about but rarely use.

**Link**: `/blog/pm-skills-you-actually-need`
**Status**: ✅ Fully written (see separate file)
```

---

### Post 2: From Campaign Organizer to Product Manager
```
**Date**: November 8, 2025
**Category**: Career • Civic Tech
**Read Time**: 10 min
**Excerpt**:
What political campaigns taught me about product management: user research in the field, ruthless prioritization under pressure, and leading teams through chaos.

**Link**: `/blog/campaign-organizer-to-pm`
**Status**: 📝 Outline only
```

**Outline**:
1. **Introduction**: Why campaign organizing is surprisingly good training for PM
2. **User research = Voter contact**: Talking to thousands of voters taught me to listen, identify patterns, and validate assumptions
3. **Prioritization under constraints**: Campaigns operate with limited time, money, and people—just like product teams
4. **Leading without authority**: Motivating volunteers is like influencing cross-functional teams
5. **Data-driven decisions**: Campaigns track everything; so should PMs
6. **Shipping under pressure**: Election day doesn't move; neither do product deadlines
7. **What campaigns didn't teach me**: Business strategy, technical depth, long-term thinking
8. **Conclusion**: Unconventional paths make better PMs

---

### Post 3: Why I Chose an MBA Over Jumping Straight Into PM
```
**Date**: October 25, 2025
**Category**: MBA • Career
**Read Time**: 7 min
**Excerpt**:
Everyone says MBAs are unnecessary for PM. So why did I spend two years and six figures at business school? Here's my reasoning.

**Link**: `/blog/why-mba-for-pm`
**Status**: 📝 Outline only
```

**Outline**:
1. **Introduction**: The conventional wisdom (skip the MBA, just get PM experience)
2. **Why I disagreed**: Gaps in my background (business strategy, finance, marketing)
3. **What MBA taught me that work couldn't**: Strategy frameworks, financial modeling, cross-functional collaboration
4. **The network matters**: Access to recruiters, alumni, and peer learning
5. **The recruiting advantage**: MBA PM recruiting pipelines at top companies
6. **What I gave up**: 2 years of salary, opportunity cost
7. **Would I do it again?**: Honest reflection
8. **Conclusion**: MBAs aren't for everyone, but here's when they make sense

---

### Post 4: Building AI Products: What I Learned Shipping an ML Model to Campaigns
```
**Date**: October 12, 2025
**Category**: AI/ML • Product Management
**Read Time**: 12 min
**Excerpt**:
Shipping an AI voter targeting model taught me that the hardest parts of AI products aren't technical—they're trust, explainability, and change management.

**Link**: `/blog/building-ai-products`
**Status**: 📝 Outline only
```

**Outline**:
1. **Introduction**: The hype vs. reality of AI products
2. **The technical part was easy**: Training the model, achieving 85% accuracy
3. **The hard part: Trust**: Campaigns didn't trust "black box" predictions
4. **Explainability is a feature**: How we built transparency into the product
5. **Change management matters more than accuracy**: Getting users to adopt AI
6. **Data quality is everything**: Garbage in, garbage out—how we handled messy voter data
7. **The AI product checklist**: Trust, explainability, data quality, change management
8. **Conclusion**: AI products are 20% ML, 80% product management

---

### Post 5: The Tools Campaigns Need But Don't Have
```
**Date**: September 28, 2025
**Category**: Civic Tech • Product Ideas
**Read Time**: 9 min
**Excerpt**:
After working on 10+ Democratic campaigns, I've seen the same problems over and over. Here are the tools campaigns desperately need—and why no one has built them yet.

**Link**: `/blog/tools-campaigns-need`
**Status**: 📝 Outline only
```

**Outline**:
1. **Introduction**: Campaign tech is stuck in 2010
2. **Problem 1: Fundraising is still painful**: Why isn't there a "Stripe for campaigns"?
3. **Problem 2: Volunteer management is a mess**: Recruiting, scheduling, and retaining volunteers
4. **Problem 3: Voter data is fragmented**: NGP VAN is expensive and clunky
5. **Problem 4: Field operations lack real-time tools**: Canvassing apps that actually work
6. **Problem 5: Analytics are an afterthought**: Campaigns need dashboards, not Excel
7. **Why these problems persist**: Funding, regulation, election cycles
8. **The opportunity**: Building the political tech platform of the future
9. **Conclusion**: This is the startup I want to build someday

---

## Blog Post Card Structure

Each card contains:
- **Date**: Small text, neutral-500
- **Category**: Colored label (berkeley-blue for PM, warm-gold for Career, etc.)
- **Title**: H3 size, clickable
- **Excerpt**: 2-3 sentence summary
- **Read time**: Small text (e.g., "8 min read")
- **CTA**: "Read more →"

**Card Style**:
- Background: white
- Border: 1px solid neutral-200
- Border radius: 12px
- Padding: 32px
- Shadow: shadow-sm
- Hover: shadow-md + translateY(-2px)
- Transition: 250ms ease-out

---

## Subscribe Section (Optional)

**Layout**: Card at top or bottom of blog list

**Content**:
```
**Headline**: Get new posts in your inbox

**Description**:
I write about product management, civic tech, and the MBA journey. Subscribe to get new posts when they're published.

**Form**:
- Email input field
- Subscribe button

**Style**: Highlighted card with subtle background (neutral-50)
```

---

## Component Breakdown

### Components Needed:
1. **BlogHero**
   - Centered headline + subheadline

2. **BlogPostCard**
   - Date + category + title + excerpt + read time + CTA
   - Hover effects

3. **BlogPostList**
   - Vertical list of cards
   - Consistent spacing

4. **SubscribeCard** (optional)
   - Email input + submit button
   - Newsletter signup

---

## Spacing & Layout

### Desktop (1024px+)
- Post cards: Max-width 800px, centered
- Card spacing: 40px between posts
- Padding: 32px inside cards

### Mobile (< 768px)
- Full width with 20px padding
- Card spacing: 24px
- Compact padding (24px inside cards)

---

## Animations

### On Page Load
- Hero fades in
- Post cards stagger in (100ms delay between each)

### On Scroll
- Cards fade + slide up when visible

### Hover
- Card: translateY(-2px) + shadow increase
- Title: color shift to berkeley-blue

---

## SEO & Metadata

```html
<title>Writing & Blog | Isaac Vazquez | Product Management & Civic Tech</title>
<meta name="description" content="Thoughts on product management, civic tech, AI/ML, and the MBA journey. Writing about building products that solve real problems." />

<!-- Open Graph -->
<meta property="og:title" content="Writing | Isaac Vazquez" />
<meta property="og:description" content="Product management, civic tech, and lessons from political campaigns." />
<meta property="og:type" content="website" />
```

---

**File**: `blog.md` or `writing.md`
**Route**: `/blog` or `/writing`
**Last updated**: November 2025
