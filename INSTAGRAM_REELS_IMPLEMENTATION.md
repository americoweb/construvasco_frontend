# Instagram Reels Implementation Guide

This guide explains how to display Instagram Reels from the 'amazing_brindes' account on the home page portfolio section.

## Overview

The implementation provides multiple methods to embed Instagram Reels:

1. **Instagram oEmbed API** (Recommended) - Dynamic, automatic updates
2. **SociableKit Widget** (Fallback) - Third-party widget service
3. **Manual Embedding** - For specific reels

## Implementation Methods

### Method 1: Instagram oEmbed API (Current Implementation)

**Pros:**
- Free and official Instagram API
- Automatic updates
- No third-party dependencies
- Full control over styling

**Cons:**
- Requires CORS proxy for client-side (or backend proxy)
- Rate limiting may apply

**Setup Steps:**

1. **Get Your Instagram Reel URLs:**
   - Go to your Instagram profile (@amazing_brindes)
   - Open each Reel you want to display
   - Copy the URL (format: `https://www.instagram.com/reel/ABC123xyz/`)

2. **Configure Reel URLs:**
   - Open `home.component.ts`
   - Find the `instagramReelUrls` array (around line 75)
   - Add your Reel URLs:
   ```typescript
   instagramReelUrls: string[] = [
       'https://www.instagram.com/reel/ABC123xyz/',
       'https://www.instagram.com/reel/DEF456abc/',
       // Add more URLs here
   ];
   ```

3. **CORS Consideration:**
   - Instagram's oEmbed API may have CORS restrictions
   - If you encounter CORS errors, you have two options:
     - **Option A:** Use a backend proxy (recommended)
     - **Option B:** Use Method 2 (SociableKit Widget)

### Method 2: SociableKit Widget (Fallback)

**Pros:**
- No CORS issues
- Automatic updates
- Easy setup
- Responsive design

**Cons:**
- Requires account with SociableKit
- May have usage limits on free plan
- Less customization control

**Setup Steps:**

1. **Sign up for SociableKit:**
   - Visit: https://sociablekit.com
   - Create a free account
   - Connect your Instagram account (@amazing_brindes)

2. **Create Instagram Reels Widget:**
   - Create a new widget
   - Select "Instagram Reels"
   - Configure settings (number of reels, layout, etc.)
   - Get your embed ID

3. **Update the Embed ID:**
   - In `home.component.html`, find the SociableKit widget div
   - Update `data-embed-id` with your widget ID:
   ```html
   <div class='sk-ww-instagram-reels' data-embed-id='YOUR_WIDGET_ID'></div>
   ```

### Method 3: Manual Embedding

**Pros:**
- Full control
- No API dependencies
- Works immediately

**Cons:**
- Manual updates required
- Not dynamic

**Setup Steps:**

1. **Get Embed Code for Each Reel:**
   - Open the Reel on Instagram
   - Click the three dots (⋯) menu
   - Select "Embed"
   - Copy the embed code

2. **Add to HTML:**
   - In `home.component.html`, replace the portfolio section with:
   ```html
   <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
     <div class="bg-white rounded-xl overflow-hidden shadow-lg">
       <!-- Paste embed code here -->
     </div>
   </div>
   ```

## Current Implementation Details

### Files Modified/Created:

1. **`instagram.service.ts`** (NEW)
   - Service to fetch Instagram Reels using oEmbed API
   - Handles multiple reels
   - Error handling and validation

2. **`home.component.ts`** (MODIFIED)
   - Added `InstagramService` integration
   - Added `loadInstagramReels()` method
   - Added loading states and error handling
   - Added fallback to SociableKit widget

3. **`home.component.html`** (MODIFIED)
   - Updated portfolio section to display Instagram Reels
   - Added loading states
   - Added error handling
   - Maintained fallback options

### How It Works:

1. **On Component Init:**
   - `loadInstagramReels()` is called
   - Checks if `instagramReelUrls` array has URLs
   - If yes: Fetches reels via oEmbed API
   - If no: Falls back to SociableKit widget

2. **Reel Fetching:**
   - For each URL, calls Instagram oEmbed API
   - Gets embed HTML for each reel
   - Stores in `instagramReels` array

3. **Display:**
   - Reels are displayed in a responsive grid (2 cols mobile, 4 cols desktop)
   - Each reel is embedded using Instagram's embed script
   - Script is loaded automatically if not present

4. **Error Handling:**
   - If API fails, falls back to SociableKit widget
   - Shows error message if both methods fail

## Configuration

### Setting Up Reel URLs

Edit `home.component.ts`:

```typescript
instagramReelUrls: string[] = [
    'https://www.instagram.com/reel/YOUR_REEL_ID_1/',
    'https://www.instagram.com/reel/YOUR_REEL_ID_2/',
    'https://www.instagram.com/reel/YOUR_REEL_ID_3/',
    // Add up to 8-12 reels for best display
];
```

### Limiting Number of Reels

In `loadInstagramReels()` method, change:
```typescript
this.instagramReels = reels.slice(0, 8); // Change 8 to desired number
```

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

**Solution 1: Backend Proxy (Recommended)**
- Create an endpoint in your Laravel backend
- Proxy requests to Instagram oEmbed API
- Update `instagram.service.ts` to use your backend endpoint

**Solution 2: Use SociableKit Widget**
- Follow Method 2 setup above
- This bypasses CORS issues entirely

### Reels Not Loading

1. **Check URLs:**
   - Ensure URLs are correct Instagram Reel URLs
   - Format: `https://www.instagram.com/reel/ABC123xyz/`

2. **Check Console:**
   - Open browser DevTools
   - Check for error messages
   - Verify network requests

3. **Check Instagram Script:**
   - Ensure `https://www.instagram.com/embed.js` is loading
   - Check for script errors

### Reels Not Displaying

1. **Check HTML Sanitization:**
   - Ensure `DomSanitizer` is properly imported
   - Check that `getSafeHtml()` is working

2. **Check CSS:**
   - Ensure Instagram embed iframes have proper styling
   - Check responsive classes are applied

## Alternative Solutions

### Option 1: EmbedSocial
- Visit: https://embedsocial.com/instagram-reels-widget/
- Similar to SociableKit
- Free plan available

### Option 2: Elfsight
- Visit: https://elfsight.com/reels-widget/
- Customizable widgets
- Free plan available

### Option 3: Instagram Graph API
- Requires Facebook Developer account
- More complex setup
- Better for advanced use cases
- Requires app review for production

## Best Practices

1. **Limit Number of Reels:**
   - Display 6-12 reels for optimal performance
   - Too many reels can slow down page load

2. **Update Regularly:**
   - Add new reels to the array periodically
   - Remove old reels to keep content fresh

3. **Monitor Performance:**
   - Check page load times
   - Monitor API rate limits
   - Optimize if needed

4. **Responsive Design:**
   - Current implementation is responsive
   - Test on mobile devices
   - Adjust grid columns if needed

## Next Steps

1. **Get Your Reel URLs:**
   - Visit @amazing_brindes Instagram profile
   - Copy URLs of reels you want to display

2. **Configure:**
   - Add URLs to `instagramReelUrls` array
   - Test the implementation

3. **If CORS Issues:**
   - Set up backend proxy OR
   - Use SociableKit widget (Method 2)

4. **Customize:**
   - Adjust number of reels displayed
   - Modify grid layout if needed
   - Add custom styling

## Support

For issues or questions:
- Check browser console for errors
- Verify Instagram URLs are correct
- Test with a single reel first
- Consider using SociableKit widget as fallback

