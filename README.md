# TRPL AIoT Lab Queue System

A computer lab booking and queue management system built with Next.js 16, Supabase, and shadcn/ui.

## Features

- **Flexible Booking**: Book computers for any duration (hours, days, or weeks)
- **Live Queue**: Join a queue when all computers are occupied
- **Early Release**: Release unused booking time for others
- **Real-time Updates**: Get notified when computers become available
- **Email Authentication**: Magic link sign-in with @mail.ugm.ac.id restriction

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Links)
- **Real-time**: Supabase Realtime
- **UI**: shadcn/ui + Tailwind CSS v4
- **Package Manager**: Bun

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your Project URL and anon/public API key from Settings > API

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Set Up Database

Run the SQL migration in your Supabase SQL Editor:

1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL to create tables, enable RLS, and seed sample computers

### 4. Configure Authentication

In Supabase Dashboard > Authentication > URL Configuration:

1. Set Site URL to `http://localhost:3000`
2. Add `http://localhost:3000/auth/callback` to Redirect URLs

### 5. Install Dependencies and Run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── page.tsx           # Landing page
├── auth/              # Authentication pages
│   ├── signin/        # Sign-in with email
│   ├── callback/      # Auth callback handler
│   └── error/         # Auth error page
├── dashboard/         # Protected dashboard
│   ├── page.tsx       # Main dashboard
│   ├── book/          # Book a computer
│   ├── queue/         # Queue status
│   └── my-session/    # Active reservations
└── api/               # API routes
    ├── computers/     # Computer status
    ├── reservations/  # Booking management
    ├── queue/         # Queue management
    └── notifications/ # User notifications

lib/supabase/
├── client.ts          # Browser Supabase client
├── server.ts          # Server Supabase client
└── middleware.ts      # Auth middleware

components/
├── booking-form.tsx   # Reservation form
├── computer-grid.tsx  # Computer status grid
├── queue-status.tsx   # Queue position display
└── active-session.tsx # Current booking display
```

## Deployment

Deploy on Vercel:

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Update Supabase redirect URLs to your production domain

## License

MIT
