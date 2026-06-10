# AI PromptMatrix

AI PromptMatrix is a Next.js app for publishing, organizing, and managing AI prompt collections.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` and add the required public Supabase values:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Useful Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Cloudflare Worker Deploy

Set the Cloudflare token and production public environment values, then run:

```bash
npm run deploy:worker
```
