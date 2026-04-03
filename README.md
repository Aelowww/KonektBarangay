# KonektBarangay

KonektBarangay is a digital barangay services platform that helps residents request documents, schedule appointments, and track service updates online.

Live site: https://konektbarangay.vercel.app

## Overview

This project was built to make barangay transactions faster, clearer, and more convenient for residents. It replaces manual follow-ups with a web-based workflow for document requests and appointment management.

## Tech Stack

- Next.js
- React
- TypeScript
- Supabase
- PostgreSQL
- Vercel Analytics

## Features

- Resident registration and login
- Online document request flow
- Appointment scheduling
- Resident service tracking dashboard
- Admin dashboard for reviewing and updating requests
- Notifications and service status updates
- Privacy policy and terms pages

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

- `app/request-document/` handles document request flow
- `app/set-appointment/` handles appointment scheduling
- `app/resident/manage-services/` is the resident dashboard
- `app/admin/manage-services/` is the admin dashboard
- `lib/` contains Supabase client setup

## Deployment

This repository is connected to Vercel for automatic deployments from GitHub.
