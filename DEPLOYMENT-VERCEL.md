
## Option D: Vercel (Serverless)

This application is ready for Vercel deployment.

1. **Push to GitHub**: Ensure your code is in a GitHub repository.
2. **Import Project in Vercel**:
    - Select your repository.
    - **Framework Preset**: Vercel should detect `Vite`.
    - **Build Command**: Set this to `npm run vercel-build`.
    - **Output Directory**: Set this to `dist/public`.
3. **Environment Variables**: Add all your `.env` variables to Vercel Settings -> Environment Variables.
    - **Note for OAuth**: Add `GOOGLE_REDIRECT_URL` set to `https://your-domain.com/api/auth/google/callback` (e.g., `https://prometix.tech/api/auth/google/callback`).

### Important Notes
- **Database**: Ensure your database (PostgreSQL/Redis) is accessible from the internet.
- **WebSockets**: Real-time features using WebSockets will NOT work on Vercel Serverless.
- **Logs**: The application logs to `stdout`/`stderr` in Vercel (viewable in Vercel Dashboard > Logs) instead of writing to files, as the filesystem is read-only.
