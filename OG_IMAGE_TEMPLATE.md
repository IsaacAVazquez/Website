# OG Image Creation Guide

## Quick Start with Canva (Recommended - 10 minutes)

### Option A: Use Canva Template

1. **Go to Canva:** https://www.canva.com/create/open-graph-images/
2. **Start with "Blank" template** (1200 x 630 px)
3. **Design Elements:**

```
Background:
- Gradient: #FF6B35 (left) → #F7B32B (right)
- Or solid: #FFFCF7 (warm cream)

Headshot:
- Upload: /public/images/headshot-new.png
- Position: Left side, circular crop
- Size: ~400px diameter

Text (Right Side):
┌─────────────────────────────┐
│                             │
│  ISAAC VAZQUEZ             │  <- Inter Bold, 72px, #2D1B12
│                             │
│  Technical Product Manager  │  <- Inter Medium, 36px, #FF6B35
│  & UC Berkeley MBA Candidate│
│                             │
│  🎯 6+ Years in Civic Tech │  <- Inter Regular, 24px, #4A3426
│  📍 Bay Area • Austin TX   │
│                             │
└─────────────────────────────┘
```

4. **Download:**
   - Format: PNG
   - Quality: High
   - Dimensions: 1200 x 630

5. **Save as:** `og-image.png` in `/public/` folder

---

## Option B: Figma Template

### Create from Scratch:

```figma
Frame: 1200 x 630 px

Layer 1: Background Rectangle
  - Fill: Linear Gradient 135°
  - Color 1: #FF6B35 (0%)
  - Color 2: #F7B32B (100%)
  - Opacity: 100%

Layer 2: Headshot Circle
  - Position: X=100, Y=115
  - Size: 400 x 400
  - Crop: Circle
  - Image: headshot-new.png
  - Border: 6px solid #FFFCF7

Layer 3: Name Text
  - Content: "ISAAC VAZQUEZ"
  - Font: Inter Bold, 72px
  - Color: #2D1B12
  - Position: X=550, Y=150
  - Letter Spacing: -2%

Layer 4: Title Text
  - Content: "Technical Product Manager &\nUC Berkeley MBA Candidate"
  - Font: Inter SemiBold, 36px
  - Color: #FF6B35
  - Position: X=550, Y=250
  - Line Height: 1.3

Layer 5: Details Text
  - Content: "🎯 6+ Years in Civic Tech & SaaS\n📍 Bay Area • Austin TX"
  - Font: Inter Regular, 24px
  - Color: #4A3426
  - Position: X=550, Y=380
  - Line Height: 1.5

Export:
  - Format: PNG
  - Scale: 1x
  - Quality: 100%
```

---

## Option C: HTML/CSS to Image (Developer Approach)

Create this HTML and screenshot it at 1200x630:

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Inter', sans-serif;
    }
    .og-container {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #FF6B35 0%, #F7B32B 100%);
      display: flex;
      align-items: center;
      padding: 0 80px;
      box-sizing: border-box;
    }
    .headshot {
      width: 400px;
      height: 400px;
      border-radius: 50%;
      border: 6px solid #FFFCF7;
      object-fit: cover;
      margin-right: 80px;
    }
    .content {
      flex: 1;
    }
    .name {
      font-size: 72px;
      font-weight: 700;
      color: #2D1B12;
      margin: 0 0 20px 0;
      letter-spacing: -1.5px;
    }
    .title {
      font-size: 36px;
      font-weight: 600;
      color: #FF6B35;
      margin: 0 0 30px 0;
      line-height: 1.3;
    }
    .details {
      font-size: 24px;
      font-weight: 400;
      color: #4A3426;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="og-container">
    <img src="images/headshot-new.png" alt="Isaac Vazquez" class="headshot">
    <div class="content">
      <h1 class="name">ISAAC VAZQUEZ</h1>
      <p class="title">Technical Product Manager<br>& UC Berkeley MBA Candidate</p>
      <p class="details">🎯 6+ Years in Civic Tech & SaaS<br>📍 Bay Area • Austin TX</p>
    </div>
  </div>
</body>
</html>
```

**Save as:** `og-image-template.html`

**Screenshot:**
1. Open in Chrome
2. Set viewport to 1200x630
3. Use DevTools Device Toolbar
4. Screenshot and save as `og-image.png`

---

## Option D: Quick Online Tool

### Use OG Image Generator (Fastest - 5 minutes):

1. **Go to:** https://www.opengraph.xyz/
2. **Or:** https://ogimage.gallery/
3. **Fill in:**
   - Title: "Isaac Vazquez"
   - Subtitle: "Technical Product Manager & UC Berkeley MBA Candidate"
   - Background: Gradient (#FF6B35 to #F7B32B)
   - Upload headshot
4. **Download PNG**
5. **Rename to:** `og-image.png`

---

## Verification Checklist

After creating the image:

✅ **Dimensions:** Exactly 1200 x 630 pixels
✅ **Format:** PNG (not JPEG)
✅ **File Size:** < 1MB (ideally 200-500KB)
✅ **Location:** `/public/og-image.png`
✅ **Text Readable:** All text is crisp and legible
✅ **Colors Match:** Uses warm design system colors
✅ **Headshot Clear:** Professional and high-quality

---

## Test Your OG Image

### Before Deployment:

**Local Test:**
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# View page source
# Look for: <meta property="og:image" content="https://isaacavazquez.com/og-image.png" />
```

### After Deployment:

**Social Media Validators:**

1. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Enter: https://isaacavazquez.com
   - Verify image appears correctly

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Enter: https://isaacavazquez.com
   - Check "Card preview"

3. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Enter: https://isaacavazquez.com
   - Click "Scrape Again" to refresh

4. **Generic OG Validator**
   - URL: https://www.opengraph.xyz/url/https://isaacavazquez.com
   - Instant preview

---

## Pro Tips

### Image Optimization:
```bash
# After creating, optimize with:
# Mac: ImageOptim (drag and drop)
# Online: https://tinypng.com
# CLI: npx @squoosh/cli --mozjpeg auto og-image.png
```

### Design Best Practices:
- **Safe Zone:** Keep important content 100px from edges
- **Contrast:** Ensure 4.5:1 minimum for text readability
- **Branding:** Consistent with site theme (#FF6B35, #F7B32B)
- **Quality:** Use high-res headshot (at least 800px)
- **Typography:** Inter font (matches site)

### Alternative Layouts:

**Layout 1: Centered**
```
┌──────────────────────┐
│                      │
│   [Headshot Circle]  │
│                      │
│   ISAAC VAZQUEZ      │
│   Technical PM       │
│   UC Berkeley MBA    │
│                      │
└──────────────────────┘
```

**Layout 2: Split**
```
┌───────────┬──────────┐
│           │          │
│ Headshot  │ Name     │
│           │ Title    │
│           │ Details  │
│           │          │
└───────────┴──────────┘
```

**Layout 3: Minimal**
```
┌──────────────────────┐
│ Gradient Background  │
│                      │
│ ISAAC VAZQUEZ        │
│ Product Manager      │
│                      │
└──────────────────────┘
```

---

## Resources

**Fonts:**
- Inter: https://fonts.google.com/specimen/Inter
- Download: https://rsms.me/inter/

**Icons/Emojis:**
- 🎯 Target (goals/focus)
- 📍 Location pin
- 💼 Briefcase (professional)
- 🎓 Graduation cap (education)
- 🚀 Rocket (growth/innovation)

**Color Palette:**
```css
--primary: #FF6B35      /* Sunset Orange */
--secondary: #F7B32B    /* Golden Yellow */
--accent: #FF8E53       /* Coral */
--neutral-bg: #FFFCF7   /* Warm Cream */
--text-dark: #2D1B12    /* Dark Brown */
--text-medium: #4A3426  /* Medium Brown */
```

**Inspiration:**
- LinkedIn OG images: https://www.linkedin.com/help/linkedin/answer/a521928
- Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- OG Image Gallery: https://ogimage.gallery

---

## Troubleshooting

**Image not showing in social preview:**
- Clear cache: https://developers.facebook.com/tools/debug/
- Check file permissions (should be readable)
- Verify path is correct: `/public/og-image.png`
- Ensure deployed to production

**Image looks pixelated:**
- Use exactly 1200 x 630 dimensions
- Export at 100% quality
- Use PNG, not JPEG
- Don't upscale smaller images

**Text too small on mobile:**
- Keep font sizes 36px+ for readability
- Test on actual mobile device
- Use high contrast colors

**File too large:**
- Compress with TinyPNG
- Reduce quality to 85-90%
- Convert to WebP (but keep PNG as fallback)

---

**Estimated Time:** 10-30 minutes depending on method
**Difficulty:** Easy
**Tools Required:** Canva (free) or Figma (free)
**Result:** Professional OG image ready for social sharing
