# Player Images Setup Guide

## Overview
This feature replaces the simple circles on the tier chart with actual player headshot images, making the visualization much more engaging and easier to identify players at a glance.

## How It Works

### 1. **Image Scraping**
- Scrapes player headshots from ESPN team roster pages
- Downloads and stores images locally in `public/player-images/`
- Creates a mapping file to link player names to image files
- Handles name variations and team changes

### 2. **Chart Integration**
- Automatically loads player images for the tier chart
- Falls back to colored circles if images aren't available
- Maintains all existing hover effects and animations
- Adds colored borders around images to preserve tier color coding

## Setup Instructions

### **Step 1: Run the Image Scraper**
```bash
npm run scrape-player-images
```

This will:
- Scrape all 32 NFL team rosters from ESPN
- Download player headshot images
- Create the player mapping file
- Take 5-10 minutes to complete (includes rate limiting)

### **Step 2: Verify Setup**
After scraping completes, you should see:
- `public/player-images/` directory with hundreds of player images
- `src/data/player-images.json` mapping file
- Console output showing successful downloads

### **Step 3: Test the Feature**
1. Navigate to `/fantasy-football` 
2. Select any position (QB, RB, WR, etc.)
3. You should see player headshots instead of circles on the tier chart

## File Structure
```
public/
├── player-images/           # Downloaded player headshots
│   ├── ari-kyler-murray.jpg
│   ├── buf-josh-allen.jpg
│   └── ...

src/
├── data/
│   └── player-images.json   # Player name to image mapping
├── lib/
│   ├── playerImageScraper.ts    # Scraping logic
│   └── playerImageService.ts    # Chart integration
└── app/api/
    └── player-images-mapping/   # API for mapping data
```

## Features

### **Smart Fallbacks**
- Uses circles if player image isn't found
- Handles image loading errors gracefully
- Maintains performance with image preloading

### **Name Matching**
- Handles various name formats (Jr., Sr., III, etc.)
- Tries multiple team abbreviation formats
- Accommodates player trades and team changes

### **Visual Enhancements**
- Circular clipping for consistent appearance
- Colored borders to maintain tier identification
- Smooth hover animations for image scaling
- Maintains all original chart functionality

## Troubleshooting

### **Images Not Showing**
1. Check if `public/player-images/` directory exists and contains images
2. Verify `src/data/player-images.json` mapping file exists
3. Check browser console for 404 errors on image URLs
4. Try re-running the scraper: `npm run scrape-player-images`

### **Performance Issues**
1. The initial load might be slower due to image loading
2. Images are preloaded for better subsequent performance
3. Consider clearing browser cache if images appear stale

### **Missing Players**
1. Some players might not have ESPN photos available
2. Recent roster changes might not be reflected immediately
3. Practice squad or injured reserve players might be missing
4. Fallback circles will be used automatically

## Maintenance

### **Updating Images**
Run the scraper periodically to get:
- New player photos
- Updated rosters
- Trade and waiver wire changes

Recommended frequency: Weekly during NFL season

### **Storage Considerations**
- Player images are ~2-5KB each
- Total storage: ~500MB for all players
- Consider adding to `.gitignore` if repo size becomes an issue

## Advanced Customization

### **Image Quality**
Modify `playerImageScraper.ts` to:
- Change image size/quality
- Use different image sources
- Add image optimization

### **Styling**
Update `TierChartEnhanced.tsx` to:
- Change border colors/thickness
- Modify hover effects
- Adjust image sizing

This feature transforms the tier chart from abstract data points into a visually rich, player-focused experience!