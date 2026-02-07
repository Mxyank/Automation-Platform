
## Option D: Vercel (Serverless)

This application is configured for Vercel deployment using Serverless Functions.

1. **Install Vercel CLI** (optional, for local testing)
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

### Important Configuration
- **Environment Variables**: Add all your `.env` variables to the Vercel project settings.
- **Database**: Ensure your PostgreSQL database (e.g., Neon, Supabase) and Redis (e.g., Upstash) are accessible from the public internet or Vercel's IP range.
- **WebSockets**: Note that Vercel Serverless Functions do **not** support WebSockets. Real-time features relying on `ws` will not work.
- **Output Directory**: Vercel should automatically detect Vite, but if asked, the output directory is `dist/public`.
