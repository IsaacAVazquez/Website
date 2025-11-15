# OG Image Requirements for SEO

## Critical: Missing OG Image

**File needed:** `/public/og-image.png`

### Specifications:
- **Dimensions:** 1200x630px (Facebook/LinkedIn standard)
- **Format:** PNG or JPG
- **Max file size:** <1MB (ideally <300KB)

### Design Recommendations:

#### Content to Include:
1. **Name:** Isaac Vazquez (large, prominent)
2. **Title:** Technical Product Manager
3. **Subtitle:** UC Berkeley Haas MBA Candidate '27
4. **Location:** Austin & Bay Area
5. **Background:** Warm gradient (sunset orange #FF6B35 to golden yellow #F7B32B)
6. **Professional headshot** (optional but recommended)

#### Design Style:
- Clean, modern layout matching warm portfolio aesthetic
- Professional sans-serif font (Inter)
- Sufficient contrast for text readability
- Branded with warm color palette
- Include website URL: isaacavazquez.com

### Tools to Create:
1. **Canva** - Free, easy templates for OG images
2. **Figma** - Professional design tool
3. **Photoshop/GISC** - Advanced editing
4. **Online OG Image Generator** - Quick creation

### Quick Creation Steps:

```bash
# Using Canva (Recommended for non-designers):
1. Go to canva.com
2. Search for "Open Graph Image" or "Facebook Post" (1200x630)
3. Use warm gradient background (#FF6B35 to #F7B32B)
4. Add text:
   - "Isaac Vazquez" (72px, bold)
   - "Technical Product Manager" (36px)
   - "UC Berkeley Haas MBA Candidate '27" (28px)
   - "Austin & Bay Area" (24px)
5. Optional: Add professional headshot
6. Download as PNG
7. Save to /public/og-image.png
```

### SEO Impact:
- **Social Sharing:** Image appears when sharing on LinkedIn, Twitter, Facebook
- **Click-through Rate:** Professional image increases CTR by ~30-40%
- **Brand Recognition:** Consistent branding across platforms
- **First Impression:** Controls how your portfolio appears in social feeds

### Testing:
After creating, test with:
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/

### Current Fallback:
The site currently references `/og-image.png` but the file doesn't exist. This means:
- ❌ No image shows when sharing on social media
- ❌ Looks unprofessional in link previews
- ❌ Lower engagement on shared links

### Priority:
**CRITICAL** - Should be created ASAP for professional portfolio presentation.
