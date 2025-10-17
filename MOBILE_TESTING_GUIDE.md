# Mobile PWA Testing Guide

## 🧪 Quick Testing Checklist

Use this guide to test your PWA on mobile devices before deployment.

## 📱 Testing on Your Phone

### Option 1: Deploy to Vercel (Recommended)
```bash
git add .
git commit -m "feat: Add PWA support with offline capabilities"
git push
```
Vercel will automatically deploy. Then open the URL on your phone!

### Option 2: Local Network Testing
1. Find your computer's local IP:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows
   ipconfig | findstr IPv4
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open on your phone: `http://YOUR_LOCAL_IP:3000`
   (e.g., `http://192.168.1.100:3000`)

**Note**: Dev mode disables service worker. For full PWA testing:
```bash
npm run build
npm start
```
Then access `http://YOUR_LOCAL_IP:3000`

## ✅ Mobile Testing Checklist

### General Functionality
- [ ] App loads on mobile browser
- [ ] All pages are responsive
- [ ] Images scale correctly
- [ ] Text is readable (not too small)
- [ ] Buttons are tappable (min 44x44px)
- [ ] Navigation works smoothly

### 3D Viewer (Critical!)
- [ ] 3D model loads correctly
- [ ] Single finger swipe rotates model
- [ ] Pinch gesture zooms in/out
- [ ] Two-finger pan moves model
- [ ] Controls are smooth and responsive
- [ ] No lag or stuttering
- [ ] Model scales appropriately for screen

### PWA Installation (Android)
- [ ] Install prompt appears after 3 seconds
- [ ] "Install Now" button works
- [ ] App installs to home screen
- [ ] App icon appears correctly
- [ ] Splash screen shows when launching
- [ ] App opens in full-screen mode
- [ ] Status bar color matches theme

### PWA Installation (iOS)
- [ ] Manual install instructions show
- [ ] Share button → Add to Home Screen works
- [ ] App icon appears on home screen
- [ ] App opens in full-screen mode
- [ ] Status bar looks correct

### Offline Functionality
- [ ] Install and use app while online
- [ ] Turn on airplane mode
- [ ] Open app from home screen
- [ ] App loads (from cache)
- [ ] Previously viewed models still work
- [ ] UI is fully functional
- [ ] Appropriate offline message for new content

### Performance
- [ ] First load is fast (< 3 seconds)
- [ ] Subsequent loads are instant
- [ ] 3D models load without blocking UI
- [ ] Smooth scrolling
- [ ] No jank or frame drops
- [ ] Battery usage is reasonable

### Camera/Upload (if testing diagnosis)
- [ ] Camera permission prompts correctly
- [ ] Can take photo with camera
- [ ] Can select from gallery
- [ ] Image preview works
- [ ] Upload completes successfully

## 🔍 Advanced Testing

### Chrome DevTools Mobile Emulation
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device (iPhone 14, Pixel 7, etc.)
4. Test different screen sizes
5. Check touch simulation

### Network Throttling
1. DevTools → Network tab
2. Set throttling to "Fast 3G" or "Slow 3G"
3. Test loading performance
4. Verify caching works

### Lighthouse PWA Audit
1. DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Generate report"
4. Check for:
   - ✅ Installable (90+)
   - ✅ PWA Optimized
   - ✅ Fast load times
   - ✅ Reliable
   - ✅ Engaging

### Service Worker Testing
1. DevTools → Application tab
2. Go to "Service Workers"
3. Check:
   - [ ] Service worker is registered
   - [ ] Status is "activated and running"
   - [ ] Scope is correct
4. Test "Update on reload"
5. Test "Skip waiting"
6. Check "Cache Storage" for cached files

## 📊 Real Device Testing Matrix

| Device | OS Version | Browser | Status |
|--------|-----------|---------|--------|
| iPhone 14 Pro | iOS 17 | Safari | ⬜ |
| iPhone 12 | iOS 16 | Safari | ⬜ |
| Samsung Galaxy S23 | Android 14 | Chrome | ⬜ |
| Google Pixel 7 | Android 13 | Chrome | ⬜ |
| iPad Pro | iPadOS 17 | Safari | ⬜ |
| Samsung Tab S9 | Android 13 | Chrome | ⬜ |

## 🐛 Common Mobile Issues & Fixes

### Issue: 3D viewer not responding to touch
**Solution**: Check OrbitControls touch settings in ThreeDViewer.tsx
```typescript
touches={{
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
}}
```

### Issue: Install prompt doesn't appear on Android
**Solutions**:
- Wait 3+ seconds after page load
- Check manifest.json is valid
- Ensure HTTPS (required)
- Clear browser cache
- Check if already installed

### Issue: iOS says "This webpage is not available"
**Solutions**:
- Ensure using Safari (not Chrome on iOS)
- Check HTTPS is enabled
- Verify manifest.json is accessible
- Check console for errors

### Issue: Models not loading on mobile
**Solutions**:
- Check model file sizes (< 50MB)
- Test with network throttling
- Verify CORS headers
- Check browser console for errors
- Ensure model paths are correct

### Issue: App looks zoomed in/out
**Solution**: Check viewport meta tag in _document.tsx:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Issue: Status bar wrong color
**Solution**: Check theme-color meta tags and manifest.json
```html
<meta name="theme-color" content="#3b82f6" />
```

### Issue: Offline mode not working
**Solutions**:
- Must be built (`npm run build`)
- Visit pages while online first (to cache)
- Check service worker registration
- Clear cache and try again

## 📱 Testing Tools

### Online Tools
- [Lighthouse](https://web.dev/measure/) - Web performance & PWA audit
- [PWA Builder](https://www.pwabuilder.com/) - PWA validation
- [Manifest Validator](https://manifest-validator.appspot.com/) - Manifest checker

### Browser Extensions
- [Lighthouse](https://chrome.google.com/webstore/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk) - Chrome extension
- [PWA Inspector](https://chrome.google.com/webstore/detail/pwa-inspector/hfhhnacclhffhdffklopdkcgdhifgngh) - Debug PWA

### Mobile Debugging
- **Chrome Remote Debugging** (Android):
  1. Enable USB debugging on phone
  2. Connect via USB
  3. Open chrome://inspect in desktop Chrome
  4. Select your device

- **Safari Web Inspector** (iOS):
  1. Enable Web Inspector: Settings → Safari → Advanced
  2. Connect iPhone via USB
  3. Safari → Develop → [Your iPhone]

## 🎯 Success Criteria

Your PWA is ready for production when:

1. ✅ Lighthouse PWA score > 90
2. ✅ Works on at least 2 iOS devices
3. ✅ Works on at least 2 Android devices
4. ✅ Install flow tested on both platforms
5. ✅ Offline functionality verified
6. ✅ 3D viewer works smoothly on all devices
7. ✅ No console errors on mobile
8. ✅ Fast loading (< 3 seconds on 3G)
9. ✅ All touch gestures work correctly
10. ✅ App icon and splash screen look good

## 📸 Screenshot Your Tests!

Take screenshots of:
- Install prompt on Android
- Installed app on home screen (iOS & Android)
- App running in full-screen mode
- 3D model on mobile
- Offline mode working
- Lighthouse report

## 🚀 Ready to Ship!

Once all tests pass, you're ready to deploy! Your users will have an amazing mobile app experience.

---

Happy Testing! 🎉
