# Vercel Deployment Fix for 3D Models

## Problem
The 3D FBX models were loading correctly in local development but failing to load when deployed to Vercel.

## Root Causes
1. **Webpack Configuration**: Three.js loaders (FBXLoader, GLTFLoader) from `three/examples/jsm` need proper webpack configuration
2. **Static Asset Headers**: Vercel needs explicit headers to serve FBX files correctly
3. **CORS Issues**: Cross-origin resource sharing needed to be configured
4. **Cache Control**: Static 3D models weren't being cached properly

## Solutions Implemented

### 1. Updated `next.config.ts`
Added webpack configuration to handle FBX/GLB/GLTF files and configured headers for the `/models` directory:

```typescript
webpack: (config) => {
  // Handle FBX and other 3D model files
  config.module.rules.push({
    test: /\.(fbx|glb|gltf)$/,
    type: 'asset/resource',
  });

  // Allow importing from three/examples
  config.resolve.alias = {
    ...config.resolve.alias,
    'three/examples/jsm': 'three/examples/jsm',
  };

  return config;
},

async headers() {
  return [
    {
      source: '/models/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    },
  ];
}
```

### 2. Created `vercel.json`
Added Vercel-specific configuration for proper model serving:

```json
{
  "headers": [
    {
      "source": "/models/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Content-Type",
          "value": "application/octet-stream"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/models/:path*",
      "destination": "/models/:path*"
    }
  ]
}
```

### 3. Improved Error Handling in `ThreeDViewer.tsx`
Enhanced error messages to help debug issues in production:

- Added detailed error logging with full URL paths
- Display error details in the UI when models fail to load
- Better console logging for debugging on Vercel

## Testing

### Local Testing
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel deploy
```

## Checklist Before Deployment

- ✅ All FBX models are in `public/models/` directory
- ✅ Model files follow the naming convention: `public/models/{organ}{score}/{organ}{score}.fbx`
- ✅ `next.config.ts` has webpack and headers configuration
- ✅ `vercel.json` exists with proper headers
- ✅ No `.vercelignore` file is blocking the models folder
- ✅ Models are committed to git (check `.gitignore`)

## Common Issues & Solutions

### Issue: 404 errors for model files
**Solution**: Ensure models are in the correct path and committed to git. Check browser console for the exact URL being requested.

### Issue: CORS errors
**Solution**: The `vercel.json` and `next.config.ts` headers should fix this. Verify headers are being sent using browser DevTools Network tab.

### Issue: Models load slowly
**Solution**: Consider compressing FBX files or converting to GLB format which is more efficient for web delivery.

### Issue: Build succeeds but models still don't load
**Solution**: 
1. Check Vercel deployment logs
2. Verify file sizes (Vercel has a 50MB limit per file in the free tier)
3. Test the direct URL: `https://your-domain.vercel.app/models/brain1/brain1.fbx`

## File Size Considerations

Vercel Free Tier Limits:
- Maximum file size: 50MB per file
- Function payload size: 4.5MB

If your FBX files are too large:
1. Compress them using tools like Blender or Maya
2. Convert to GLB format (typically 50-80% smaller)
3. Use texture compression
4. Consider using a CDN for large models

## Additional Optimization Tips

1. **Enable Compression**: The vercel.json config enables caching
2. **Use GLB format**: More efficient than FBX for web
3. **Lazy Loading**: Models are already lazy-loaded with Suspense
4. **Progressive Loading**: Consider implementing LOD (Level of Detail) for complex models

## Resources

- [Next.js Static File Serving](https://nextjs.org/docs/basic-features/static-file-serving)
- [Vercel Deployment Documentation](https://vercel.com/docs/concepts/deployments/overview)
- [Three.js Loading 3D Models](https://threejs.org/docs/#manual/en/introduction/Loading-3D-models)
