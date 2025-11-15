# SEO Quick Wins & Action Items

## 🎯 Do These First (1-2 Hours Total)

### 1. Create OG Image ⚡ CRITICAL
**Time:** 30 minutes | **Impact:** HIGH

**Quick Steps:**
```bash
1. Go to canva.com (free account)
2. Create 1200x630px design:
   - Warm gradient background (#FF6B35 to #F7B32B)
   - Text: "Isaac Vazquez"
   - "Technical Product Manager"
   - "UC Berkeley Haas MBA '27"
3. Download as PNG
4. Save to /public/og-image.png
5. Test: linkedin.com/post-inspector
```

**Why:** Every social share currently shows no image - looks unprofessional.

---

### 2. Generate New Sitemap ⚡
**Time:** 2 minutes | **Impact:** MEDIUM

```bash
npm run build
npm run postbuild  # Generates sitemap.xml
```

**Why:** Current sitemap has fantasy football pages that return 404s.

---

### 3. Submit Updated Sitemap to Google ⚡
**Time:** 5 minutes | **Impact:** MEDIUM

```bash
1. Go to search.google.com/search-console
2. Select property: isaacavazquez.com
3. Sitemaps > Add new sitemap
4. Enter: https://isaacavazquez.com/sitemap.xml
5. Submit
```

**Why:** Tells Google about new portfolio structure immediately.

---

### 4. Verify All Images Have Alt Text ⚡
**Time:** 15 minutes | **Impact:** MEDIUM

**Check these files:**
- `src/components/ModernHero.tsx` - Headshot image
- `src/app/page.tsx` - Company logos in timeline
- Any other Image components

**Template:**
```tsx
alt="Isaac Vazquez, Technical Product Manager and UC Berkeley Haas MBA Candidate"
alt="Civitech logo - Voter engagement platform"
alt="UC Berkeley Haas School of Business logo"
```

**Why:** Accessibility + Google Images ranking.

---

### 5. Add This to Homepage (Quick SEO Boost) ⚡
**Time:** 10 minutes | **Impact:** MEDIUM

**File:** `src/app/page.tsx` (or create new component)

Add an invisible H1 for SEO (hidden but readable by screen readers):

```tsx
<h1 className="sr-only">
  Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate based in Austin TX and San Francisco Bay Area
</h1>
```

**Why:** Ensures primary keyword target is in H1 (critical ranking factor).

---

## 📊 Week 1 Monitoring Checklist

### Google Search Console Setup
**Time:** 10 minutes

- [ ] Verify ownership of isaacavazquez.com
- [ ] Submit sitemap.xml
- [ ] Request indexing for key pages:
  - https://isaacavazquez.com/
  - https://isaacavazquez.com/about
  - https://isaacavazquez.com/projects
  - https://isaacavazquez.com/resume

### Test OG Tags
**Time:** 5 minutes

- [ ] Test on LinkedIn: linkedin.com/post-inspector
- [ ] Test on Twitter: cards-dev.twitter.com/validator
- [ ] Test on Facebook: developers.facebook.com/tools/debug/
- [ ] Share on LinkedIn to verify image appears

### Baseline Metrics (Record These)
**Time:** 15 minutes

**Google Search Console:**
- [ ] Current total impressions (last 28 days): _____
- [ ] Current total clicks (last 28 days): _____
- [ ] Average CTR: _____
- [ ] Average position: _____

**Top Queries (record top 5):**
1. _____
2. _____
3. _____
4. _____
5. _____

---

## 📈 Week 2-4 Actions

### Content Additions
**Time:** 2-3 hours each | **Impact:** HIGH

#### Option 1: Product Management Case Study
**File:** `/content/writing/civitech-voter-platform-case-study.mdx`

**Structure:**
```markdown
# Building a Voter Engagement Platform at Civitech

## Challenge
[150 words on the problem]

## My Role
Technical Product Manager & QA Lead

## Approach
1. User research
2. Cross-functional collaboration
3. Quality framework development

## Results
- Metric 1: X% improvement
- Metric 2: Y users reached
- Metric 3: Z quality increase

## Learnings
[Key takeaways for PM role]
```

**Target Keywords:** civic tech product manager, voter engagement platform, political technology

---

#### Option 2: "From QA to Product Management" Blog Post
**File:** `/content/blog/from-qa-engineer-to-product-manager.mdx`

**Target Keywords:**
- QA engineer to product manager
- Career transition product management
- Technical product manager background

**Outline:**
1. Why QA → PM is a natural transition
2. Skills that transfer (testing mindset, user empathy, technical knowledge)
3. Skills to develop (strategy, stakeholder management, roadmapping)
4. My journey (FSU → Civitech → UC Berkeley)
5. Advice for others making the transition

**Length:** 1500-2000 words

---

#### Option 3: Austin/Bay Area PM Job Market Analysis
**File:** `/content/writing/austin-vs-bay-area-product-manager-jobs.mdx`

**Target Keywords:**
- Product manager jobs Austin
- Product manager jobs Bay Area
- PM job market comparison

**Very high value for location-based searches!**

---

### Link Building (Ongoing)
**Time:** 1 hour/week | **Impact:** HIGH (long-term)

**Week 2:**
- [ ] Update LinkedIn profile URL to: isaacavazquez.com
- [ ] Add website to UC Berkeley Haas student directory
- [ ] Request Civitech team page link

**Week 3:**
- [ ] Join Austin Product Management meetup groups (link in bio)
- [ ] Post on LinkedIn linking to portfolio
- [ ] Medium article with backlink

**Week 4:**
- [ ] Guest post on UC Berkeley blog
- [ ] Reach out to Consortium for fellow directory listing
- [ ] Comment on product management blogs with link

---

## 🎯 30-Day SEO Sprint Plan

### Week 1: Foundation
- [x] Fix sitemap configuration
- [x] Update all meta descriptions
- [x] Add FAQ schema
- [x] Fix /about 404 error
- [ ] Create OG image ⚡
- [ ] Submit to Google Search Console ⚡
- [ ] Verify alt text on images ⚡

### Week 2: Content
- [ ] Write case study (Civitech or similar)
- [ ] Add H1 tags to all pages
- [ ] Internal linking audit
- [ ] Create 2-3 blog posts

### Week 3: Technical
- [ ] Add lastmod dates (real file dates)
- [ ] Implement Article schema for blog posts
- [ ] Create dedicated landing page: /product-manager-austin
- [ ] Speed optimization audit

### Week 4: Promotion
- [ ] Build 5-10 backlinks
- [ ] Share content on LinkedIn (weekly)
- [ ] Engage with PM communities
- [ ] Monitor rankings and adjust

---

## 📊 Success Metrics (Track Monthly)

### Primary KPIs
- **Organic Traffic:** _____ → Target: +50% in 3 months
- **Keyword Rankings:**
  - "Isaac Vazquez product manager": Position _____
  - "Product manager Austin TX": Position _____
  - "UC Berkeley MBA product manager": Position _____

### Secondary KPIs
- **Average Position:** _____ → Target: <10
- **CTR:** _____% → Target: >5%
- **Pages/Session:** _____ → Target: >2
- **Contact Form Submissions:** _____ → Target: +30%

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This:
1. **Keyword Stuffing** - Don't repeat "product manager" 50 times on one page
2. **Duplicate Content** - Each page needs unique content
3. **Ignoring Mobile** - 60% of searches are mobile
4. **Slow Site** - >3s load time hurts rankings
5. **Missing Schema** - Structured data is critical for rich results
6. **Broken Links** - Check for 404s monthly
7. **Thin Content** - Pages should be 300+ words minimum

### ✅ Do This Instead:
1. **Natural Keyword Usage** - Write for humans, optimize for Google
2. **Unique Value Props** - Each page has different focus
3. **Mobile-First Testing** - Test on real devices
4. **Performance Monitoring** - Core Web Vitals
5. **Rich Structured Data** - Person, Organization, FAQPage, etc.
6. **Link Maintenance** - Monthly check for broken links
7. **Quality Content** - 1000+ word blog posts with real insights

---

## 🔗 Useful Resources

### SEO Tools (Free)
- **Google Search Console** - search.google.com/search-console
- **Google PageSpeed Insights** - pagespeed.web.dev
- **Schema Validator** - validator.schema.org
- **Mobile-Friendly Test** - search.google.com/test/mobile-friendly
- **Rich Results Test** - search.google.com/test/rich-results

### Keyword Research (Free Tier)
- **Google Trends** - trends.google.com
- **Answer the Public** - answerthepublic.com
- **Keyword Surfer** - Chrome extension
- **Ubersuggest** - neilpatel.com/ubersuggest

### Rank Tracking (Free Options)
- **Google Search Console** - Built-in position tracking
- **Mangools** - Free tier for basic tracking
- **SERPWatcher** - Limited free queries

---

## 📞 Questions?

If you need help with any of these SEO improvements:

1. **OG Image Creation** - Use Canva.com (easiest)
2. **Schema Validation** - Use validator.schema.org
3. **Sitemap Issues** - Check next-sitemap docs
4. **Content Strategy** - Focus on authentic experience sharing

**Remember:** SEO is a marathon, not a sprint. Consistency over 3-6 months yields best results.

---

## ✅ Final Checklist Before Launch

- [ ] OG image created and tested
- [ ] All pages have unique meta descriptions
- [ ] Sitemap generated and submitted
- [ ] Google Search Console configured
- [ ] Alt text on all images
- [ ] H1 tags on all pages
- [ ] Schema markup validated
- [ ] Mobile responsive verified
- [ ] Page speed <3 seconds
- [ ] No 404 errors
- [ ] Canonical URLs set
- [ ] Social sharing tested

**Next Action:** Create OG image! (30 minutes)
