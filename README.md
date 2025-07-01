# 🗓️ Calendar AI Dashboard

A modern, AI-powered calendar dashboard that connects to your Google Calendar and provides intelligent insights and suggestions using Hugging Face models.

🔗 **Live Demo**: [https://ai-calendar-event-summarizer-mvp-sm.vercel.app](https://ai-calendar-event-summarizer-mvp-sm.vercel.app)

---

## 🚀 What This Project Does

This application creates an intelligent calendar dashboard that:

* 🔗 **Connects to Google Calendar** — Syncs your events automatically
* 🤖 **AI-Powered Insights** — Generates smart summaries & suggestions using Hugging Face models
* 🎂 **Smart Birthday Detection** — Provides special suggestions for birthday events
* 📱 **Beautiful UI** — Modern, responsive design with animations
* 🔐 **Secure Authentication** — Email/password & Google OAuth login
* ☁️ **Cloud Database** — All data securely stored in Supabase

---

## 🏗️ Project Architecture

### **Frontend (React + TypeScript)**

#### 🔧 Core Tech Stack:

* **React 18** with hooks
* **TypeScript** for type safety
* **Vite** for blazing-fast dev/build
* **Tailwind CSS** for styling
* **Lucide React** for icons

#### 🧹 Key Components:

* **Authentication**

  * `LoginForm.tsx`, `GoogleAuthCallback.tsx`, `AuthContext.tsx`
* **Dashboard**

  * `Dashboard.tsx`, `EventCard.tsx`
* **Services**

  * `googleCalendar.ts`, `huggingface.ts`, `supabase.ts`

---

### **Backend (Supabase)**

#### 📦 Tables:

```sql
-- Users table
users1 {
  id: uuid
  email: text
  name: text
  google_access_token: text
  refresh_token: text
  created_at: timestamp
}

-- Events table
events1 {
  id: uuid
  user_id: uuid
  event_id: text
  title: text
  description: text
  start_time: timestamp
  end_time: timestamp
  gpt_summary: text
  gpt_suggestions: text
  event_type: text
  created_at: timestamp
}
```

#### 🔐 Security:

* Row Level Security (RLS)
* OAuth + JWT Authentication
* Encrypted access tokens

---

### **AI Integration (Hugging Face)**

#### Models Used:

* `facebook/bart-large-cnn` for summarization
* `microsoft/DialoGPT-medium` for suggestions
* `google/flan-t5-base` for fallback logic

#### AI Features:

* 📄 Concise 2-3 sentence summaries
* ✅ Actionable prep tips
* 🎂 Smart birthday detection
* ↻ Fallback system for guaranteed output

---

## 🔧 Setup Instructions

### ✅ 1. Supabase Setup

1. [Create a Supabase Project](https://supabase.com)
2. Enable **Google OAuth** in Auth → Providers
3. Add your redirect URLs:

   ```
   http://localhost:5173/**
   https://ai-calendar-event-summarizer-mvp-sm.vercel.app/**
   ```
4. Add API credentials in Supabase → Settings → API

---

### ✅ 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Calendar API**
3. Go to **APIs & Services → Credentials**

   * Create OAuth client
   * Set:

     * **Authorized JavaScript Origins**:

       ```
       http://localhost:5173
       https://ai-calendar-event-summarizer-mvp-sm.vercel.app
       ```
     * **Authorized Redirect URIs**:

       ```
       http://localhost:5173/auth/google-callback
       https://ai-calendar-event-summarizer-mvp-sm.vercel.app/auth/google-callback
       ```

---

### ✅ 3. Hugging Face Setup

1. Sign up at [huggingface.co](https://huggingface.co)
2. Generate a token under **Settings → Access Tokens**
3. Copy it into your environment file

---

## 🔪 Local Development

```bash
git clone https://github.com/ambhorekomal/calendar-summarizer.git
cd calendar-summarizer
npm install
```

### Create `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Hugging Face
VITE_HUGGINGFACE_API_KEY=your-hf-key
```

```bash
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173)

---

## 🚀 Deployment Guide

### 🔸 Vercel (Frontend)

1. Connect repo at [vercel.com](https://vercel.com)
2. Set environment variables in **Project → Settings**
3. Add the Vercel domain to:

   * Supabase redirect URLs
   * Google OAuth redirect URLs

✅ Live: [https://ai-calendar-event-summarizer-mvp-sm.vercel.app](https://ai-calendar-event-summarizer-mvp-sm.vercel.app)

---

## ↻ How It Works

1. **Sign in** with Supabase Auth (email or Google)
2. **Connect Google Calendar**
3. Fetch & store events in Supabase
4. Generate summaries using Hugging Face API
5. Display events in UI with AI suggestions

---

## 📚 Tech Stack Summary

| Layer      | Tech                         |
| ---------- | ---------------------------- |
| Frontend   | React, Vite, Tailwind        |
| Backend    | Supabase                     |
| Auth       | Supabase Auth + Google OAuth |
| AI         | Hugging Face                 |
| Deployment | Vercel                       |

---

## 🤝 Contributing

```bash
git checkout -b feature/my-feature
git commit -m "Add feature"
git push origin feature/my-feature
```

Open a Pull Request 🚀

---

## 📔 License

This project is under the **MIT License**.

---

## 🎉 Why It's Special

This is not just a calendar — it's a **smart personal assistant**:

* 📌 AI summaries for every event
* 🎁 Birthday intelligence & gift suggestions
* 🔒 Fully secure & user-isolated
* 💅 Gorgeous UI & responsive experience
* ⚙️ Built on modern, scalable tools

---

💻 **Live Site**: [https://ai-calendar-event-summarizer-mvp-sm.vercel.app](https://ai-calendar-event-summarizer-mvp-sm.vercel.app)
📦 **Repo**: [https://github.com/ambhorekomal/calendar-summarizer](https://github.com/ambhorekomal/calendar-summarizer)


