# Instagram Reels - Quick Start Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Instagram Reel URLs

1. Go to Instagram and open your profile: **@amazing_brindes**
2. Open each Reel you want to display
3. Copy the URL from the address bar
   - Format: `https://www.instagram.com/reel/ABC123xyz/`

### Step 2: Add URLs to Component

1. Open: `src/app/modules/landing/home/home.component.ts`
2. Find line ~75 where `instagramReelUrls` is defined
3. Add your Reel URLs:

```typescript
instagramReelUrls: string[] = [
    'https://www.instagram.com/reel/YOUR_FIRST_REEL_ID/',
    'https://www.instagram.com/reel/YOUR_SECOND_REEL_ID/',
    'https://www.instagram.com/reel/YOUR_THIRD_REEL_ID/',
    // Add 6-8 reels for best display
];
```

### Step 3: Test

1. Save the file
2. Run your Angular app
3. Navigate to the home page
4. Scroll to the "Trabalhos Recentes" (Portfolio) section
5. You should see your Instagram Reels displayed!

## If You See CORS Errors

Instagram's oEmbed API may block direct browser requests. If you see CORS errors:

### Option A: Use SociableKit Widget (Easiest)

1. Sign up at: https://sociablekit.com (free)
2. Connect your Instagram account
3. Create an Instagram Reels widget
4. Copy your widget ID
5. In `home.component.html`, find the SociableKit div and update:
   ```html
   <div class='sk-ww-instagram-reels' data-embed-id='YOUR_WIDGET_ID'></div>
   ```

### Option B: Create Backend Proxy (Advanced)

Create a Laravel endpoint that proxies requests to Instagram's API.

## Current Status

✅ Instagram Service created (`instagram.service.ts`)
✅ Home Component updated to load reels
✅ Portfolio section HTML updated
✅ Fallback widget support included
✅ Error handling implemented
✅ Loading states added

## What's Next?

1. Add your Reel URLs (see Step 2 above)
2. Test the implementation
3. If CORS issues occur, use SociableKit widget (Option A)

## Need Help?

See `INSTAGRAM_REELS_IMPLEMENTATION.md` for detailed documentation.

