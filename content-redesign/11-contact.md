# Contact

---

## Hero Section

**Layout**: Centered content, max-width 700px

---

### Headline
```
Let's connect
```

**Typography**: H1 (40px), Semibold, neutral-900, centered

---

### Subheadline
```
I'm actively looking for Product Management opportunities and always happy to chat about product, civic tech, or the MBA-to-PM journey.
```

**Typography**: Text XL (20px), Regular, neutral-600, centered, max-width 600px, line-height 1.6

---

## Contact Methods

**Layout**: Centered cards or list, max-width 600px

---

### Primary Contact: Email
```
**Icon**: Mail icon
**Label**: Email
**Value**: isaacavazquez95@gmail.com
**Link**: mailto:isaacavazquez95@gmail.com
**CTA**: "Send email"

**Description**:
Best way to reach me for job opportunities, collaboration, or just to chat.
```

**Style**:
- Large card
- Icon + label + value + description
- CTA button (primary style)
- Hover effect

---

### LinkedIn
```
**Icon**: LinkedIn icon
**Label**: LinkedIn
**Value**: linkedin.com/in/isaac-vazquez
**Link**: https://linkedin.com/in/isaac-vazquez
**CTA**: "Connect on LinkedIn"

**Description**:
Follow my professional updates and connect for networking.
```

**Style**: Secondary card, similar to email card

---

### GitHub (Optional)
```
**Icon**: GitHub icon
**Label**: GitHub
**Value**: github.com/isaacavazquez
**Link**: https://github.com/isaacavazquez
**CTA**: "View GitHub"

**Description**:
See my code, side projects, and open-source contributions.
```

**Style**: Secondary card

---

## What I'm Looking For

**Section Title**: "What I'm looking for"

**Layout**: Single column, max-width 600px, centered

**Background**: neutral-50 section background

---

### Content
```
I'm currently interviewing for Product Manager roles at companies focused on:

**Cloud Infrastructure & Platform Tools**
- Developer platforms
- API products
- Cloud infrastructure (AWS, GCP, Azure)

**AI/ML Products**
- AI-powered tools for developers or end users
- Machine learning platforms
- Data analytics products

**Developer Tools**
- Tools that help engineers build better software
- Productivity and collaboration platforms
- Open-source projects

**What matters to me**:
- **Impact**: Building products people love and rely on
- **Craft**: Teams that care about quality and user experience
- **Growth**: Opportunity to learn from world-class PMs and engineers
- **Mission**: Products that solve real problems for real people

If you're hiring for roles like this, I'd love to chat. Even if you're not hiring but want to talk about product, I'm always happy to connect.
```

**Typography**:
- Body: Text LG (18px), Regular
- Bold sections: Semibold
- Bulleted lists with 16px spacing

---

## Topics I'm Happy to Discuss

**Section Title**: "Let's talk about"

**Layout**: 2-column grid on desktop, 1-column mobile

---

### Topic 1: Product Management
```
**Icon**: Briefcase

**Topics**:
- Breaking into PM
- PM interview prep
- Product frameworks (RICE, Jobs-to-be-Done, OKRs)
- Building product portfolios
```

### Topic 2: Civic Tech
```
**Icon**: Globe

**Topics**:
- Political technology and campaign tools
- Civic engagement and voter turnout
- Building products for nonprofits and campaigns
- Lessons from organizing
```

### Topic 3: MBA Journey
```
**Icon**: Graduation cap

**Topics**:
- MBA vs. jumping straight into PM
- UC Berkeley Haas experience
- MBA recruiting for PM roles
- ROI of business school
```

### Topic 4: AI/ML Products
```
**Icon**: Sparkles or Brain

**Topics**:
- Building AI products users trust
- Machine learning for non-technical PMs
- AI product management challenges
- Ethics in AI systems
```

**Card Style**: Same as focus cards (white, border, shadow, hover lift)

---

## Quick Contact Card (Alternative Layout)

**Layout**: Single centered card with contact info

```
**Email**: isaacavazquez95@gmail.com
**LinkedIn**: linkedin.com/in/isaac-vazquez
**Location**: San Francisco Bay Area
**Status**: Actively interviewing for PM roles

**Response Time**: I typically respond within 24-48 hours.
```

**Style**: Large card, clean typography, centered

---

## Component Breakdown

### Components Needed:
1. **ContactHero**
   - Centered headline + subheadline
   - Clean, minimal

2. **ContactCard**
   - Icon + label + value + description + CTA
   - Hover effects
   - Click to copy email (optional)

3. **TopicsGrid**
   - 2-column grid
   - Icon + title + list
   - Responsive

4. **LookingForSection**
   - Background section
   - Bulleted content
   - Emphasis on bold items

---

## Spacing & Layout

### Desktop (1024px+)
- Sections: 80px vertical padding
- Cards: 32px gap
- Container: max-width 700px for contact cards, 600px for prose

### Tablet (768px - 1023px)
- Sections: 64px vertical padding
- Topics grid: 2 columns maintained

### Mobile (< 768px)
- Sections: 48px vertical padding
- Grid: 1 column
- Compact spacing

---

## Animations

### On Page Load
- Hero fades in
- Contact cards stagger in (100ms delay)

### Hover
- Contact cards: lift + shadow increase
- CTA buttons: standard button hover

---

## SEO & Metadata

```html
<title>Contact Isaac Vazquez | Product Manager | Let's Connect</title>
<meta name="description" content="Get in touch with Isaac Vazquez about Product Management opportunities, civic tech, or the MBA journey. Actively interviewing for PM roles at top tech companies." />

<!-- Open Graph -->
<meta property="og:title" content="Contact Isaac Vazquez" />
<meta property="og:description" content="Let's talk about Product Management, civic tech, or building products that solve real problems." />
<meta property="og:type" content="profile" />
```

---

## Additional Features (Optional)

### 1. Contact Form (if desired)
```
**Fields**:
- Name (required)
- Email (required)
- Subject (optional)
- Message (required)

**Submit button**: "Send message"

**Success message**: "Thanks for reaching out! I'll get back to you within 24-48 hours."
```

**Note**: Email is simpler and more reliable. Only add a form if you want to track contact submissions.

---

### 2. Social Links (Compact)
```
**Layout**: Horizontal row of icon links

**Links**:
- LinkedIn
- GitHub
- Twitter/X (if applicable)
- Email

**Style**: Icon-only, circular buttons, subtle hover
```

---

### 3. Calendly Integration (Optional)
```
**CTA**: "Schedule a 30-minute call"
**Link**: [Calendly link]
**Description**: Pick a time that works for you, and let's chat.
```

---

## Accessibility Notes

- All contact methods should be keyboard accessible
- Email should be a clickable mailto: link
- Icons should have aria-labels
- Form fields should have proper labels (if using form)
- Focus states should be visible

---

**File**: `contact.md`
**Route**: `/contact`
**Last updated**: November 2025
