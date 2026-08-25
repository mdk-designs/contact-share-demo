# 🃏 Contact Share Demo

A mobile-first **Digital Business Card SPA** built with **Next.js 16 App Router**, featuring a premium luxury design and a **2-way contact exchange flow** with native OS contact import.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mdk-designs/contact-share-demo)

---

## ✨ Key Features

- **Native OS Contact Import** — No file download. A backend `/api/contact.vcf` route serves a `text/vcard` response loaded silently via a hidden `<iframe>`. iOS Safari shows the native "Add to Contacts" overlay; Android launches the system Contacts intent — **the page stays alive throughout**.
- **2-Way Exchange Flow** — Visitor fills a form → their details saved to **Supabase** → card owner's vCard triggers on their device.
- **Success Screen** — Animated check ring with personalised greeting + action buttons: WhatsApp, LinkedIn, Portfolio.
- **Luxury Design** — Deep navy/indigo palette, spinning gold avatar ring, Cormorant Garamond script accent, glassmorphic cards, shimmer CTA.
- **Mobile-first** — 430px max-width, `env(safe-area-inset-bottom)` safe areas, responsive desktop frame.

---

## 🗂 Project Structure

```
├── app/
│   ├── layout.tsx               # Inter + Cormorant fonts, metadata
│   ├── globals.css              # Full design system
│   ├── page.tsx                 # Root page — modal/toast state
│   └── api/contact.vcf/
│       └── route.ts             # ⭐ vCard endpoint (text/vcard headers)
├── components/
│   ├── CardHero.tsx             # Hero: avatar ring, name, badge, socials
│   ├── ContactDetails.tsx       # Phone/email/website/location rows
│   ├── QRCodeSection.tsx        # QR code scan widget
│   ├── CompanyBadge.tsx         # Company footer
│   ├── ExchangeModal.tsx        # Form → Supabase → iframe trigger
│   ├── SuccessScreen.tsx        # Animated check + action buttons
│   └── Toast.tsx                # Slide-in notification
├── lib/
│   ├── config.ts                # ⭐ Edit this to personalise the card
│   └── supabase.ts              # Lazy Supabase client + insertLead()
├── supabase/
│   └── schema.sql               # leads table + RLS policies
└── .env.example                 # Environment variable template
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/mdk-designs/contact-share-demo.git
cd contact-share-demo
npm install
```

### 2. Personalise the card

Edit [`lib/config.ts`](lib/config.ts) — all personal data in one place:

```ts
export const CARD_CONFIG = {
  firstName: 'Deepak',
  lastName: 'Kumar',
  title: 'UI/UX Engineer & Product Designer',
  phone: '+919876543210',
  email: 'deepak@designforge.studio',
  website: 'https://deepak.design',
  qrUrl: 'https://your-live-url.vercel.app',  // ← update after deploy
  // ...etc
}
```

### 3. Configure Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor
3. Copy credentials:

```bash
cp .env.example .env.local
# Fill in:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** The app works without Supabase — it gracefully skips the DB insert and still triggers the native contact import.

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## 🗄 Supabase Schema

```sql
create table public.leads (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  phone        text        not null,
  email        text,
  organization text,
  created_at   timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Visitors can INSERT only (cannot read, update, delete)
create policy "anon_can_insert_leads"
  on public.leads for insert to anon with check (true);

-- Card owner can read all leads
create policy "auth_can_read_leads"
  on public.leads for select to authenticated using (true);
```

---

## 🌐 Deploy to Vercel

```bash
npm run build   # verify locally first
```

Then connect this GitHub repo in [Vercel Dashboard](https://vercel.com/new) and set environment variables:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **QR Code:** qrcode.react
- **Database:** Supabase (PostgreSQL + RLS)
- **Fonts:** Inter + Cormorant Garamond (via `next/font`)
- **Deployment:** Vercel

---

## 📄 License

MIT — free to use and adapt for personal or commercial projects.
