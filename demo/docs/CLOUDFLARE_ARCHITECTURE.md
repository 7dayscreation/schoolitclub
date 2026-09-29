# School IT Club — Cloudflare Architecture Guide

This document outlines the technical design for connecting the School IT Club HTML platform to GitHub and the Cloudflare edge ecosystem (**Cloudflare Pages, D1, R2, and Workers**).

---

## 1. Cloudflare Ecosystem Overview

| Component | Role | Details |
| :--- | :--- | :--- |
| **Cloudflare Pages** | Static Web Hosting | Directly pulls from the `main` branch of your GitHub repository. Fast edge deployment with instant cache purging. |
| **Cloudflare Workers** | Edge Serverless API | Handles REST API endpoints for project submissions, quiz evaluation, user sessions, and admin moderation. |
| **Cloudflare D1** | Serverless SQL Database | SQLite database replicated at the edge storing relational records (students, schools, projects, categories, quiz questions, likes). |
| **Cloudflare R2** | Zero-Egress Object Storage | Stores project screenshots, demo preview assets, student avatar uploads, and downloadable code ZIPs. |
| **Cloudflare Turnstile** | Smart Bot Protection | Lightweight, privacy-first CAPTCHA replacement for student project submission and contact forms. |

---

## 2. Cloudflare D1 Database Schema (Draft)

```sql
-- 1. Schools Directory
CREATE TABLE schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    website TEXT,
    verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students & Creators
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_initial TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 6 AND 12),
    school_id INTEGER REFERENCES schools(id),
    bio TEXT,
    avatar_r2_url TEXT,
    role TEXT DEFAULT 'student', -- 'student', 'club_lead'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mentors (Teachers & Tech Freelancers)
CREATE TABLE mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('teacher', 'freelancer', 'industry_pro')),
    organization_or_school TEXT,
    bio TEXT,
    expertise_tags TEXT, -- JSON array: ["AI", "Web Dev", "Python", "UI/UX"]
    avatar_r2_url TEXT,
    github_profile TEXT,
    linkedin_profile TEXT,
    verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Mentor Contributions (Ideas, Design Mockups, Starter Code, Challenges)
CREATE TABLE mentor_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER REFERENCES mentors(id),
    title TEXT NOT NULL,
    contribution_type TEXT NOT NULL CHECK (contribution_type IN ('idea', 'design', 'starter_code', 'challenge', 'tutorial')),
    category TEXT NOT NULL, -- 'ai', 'web', 'games', 'python', 'design'
    content TEXT NOT NULL,
    resource_url TEXT, -- Figma link, GitHub repo link, or R2 file
    attachment_r2_url TEXT,
    status TEXT DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Student Mentor Follows
CREATE TABLE mentor_followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER REFERENCES mentors(id),
    student_id INTEGER REFERENCES students(id),
    followed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentor_id, student_id)
);

-- 6. Safe Contact & Guidance Inquiries
CREATE TABLE mentor_inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER REFERENCES mentors(id),
    student_name TEXT NOT NULL,
    student_grade INTEGER NOT NULL,
    school_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending_review', -- 'pending_review', 'delivered', 'replied'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Student Projects & Showcase
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    track TEXT NOT NULL, -- 'ai', 'web', 'games', 'python', 'scratch', 'design'
    grade_category TEXT NOT NULL, -- 'middle_school', 'high_school', 'senior'
    tags TEXT, -- JSON array of tags: ["Python", "Pygame", "AI"]
    thumbnail_r2_url TEXT,
    live_demo_url TEXT,
    github_repo_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'featured', 'rejected'
    moderated_by TEXT,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Quizzes & Weekly Challenges
CREATE TABLE quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    track TEXT NOT NULL,
    week_number INTEGER,
    year INTEGER,
    questions_json TEXT NOT NULL, -- JSON array of questions with options and answer keys
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Student Quiz Submissions / Leaderboard
CREATE TABLE quiz_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER REFERENCES quizzes(id),
    student_id INTEGER REFERENCES students(id),
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Cloudflare R2 Bucket Structure

- `r2.schoolitclub.com/`
  - `avatars/` — Compressed student and club profile icons.
  - `projects/thumbnails/` — Project preview images (WebP format, optimized).
  - `projects/galleries/` — Additional screenshots demonstrating the project.
  - `downloads/` — Verified project code ZIPs or assets.

---

## 4. Cloudflare Worker API Routes (For Phase 3)

- `GET /api/projects` — Fetch approved/featured projects (with filters for track, grade, search).
- `GET /api/projects/:id` — Fetch single project details.
- `POST /api/projects/submit` — Student project submission (requires Turnstile validation).
- `GET /api/quiz/current` — Fetch active weekly quiz questions.
- `POST /api/quiz/submit` — Submit quiz answers & return score.
- `POST /api/admin/projects/:id/approve` — Admin endpoint to approve/reject student submission.
- `POST /api/admin/projects/:id/feature` — Admin endpoint to spotlight on the homepage.
