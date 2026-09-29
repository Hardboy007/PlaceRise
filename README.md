# PlaceRise 🎓

A full-stack college placement management platform built for **Dev Bhoomi Uttarakhand University (DBUU)** — replacing the traditional WhatsApp + Google Forms + Excel workflow with a single, unified system.

---

## Team

| Name | Role |
|---|---|
| Hardik |	Product Lead · Founding Engineer — Design, Frontend, Backend |
| Ayyan | Frontend, Backend · Infrastructure |
| Himanshu | Frontend · User Experience |
| Harsh | QA Engineer · Documentation |

---

## What is PlaceRise?

PlaceRise is a role-based placement portal where:
- **Students** can onboard, browse companies, apply to drives, track applications, scan attendance, and manage their profile
- **Coordinators** can manage students, companies, job postings, applications, announcements, NOC requests, HR feedback, attendance sessions, and view analytics
- **HR / Recruiters** can log in via a separate HR login and submit feedback

---

## Features

### 👨‍🎓 Student Module
- Role-based login with ERP ID
- Multi-step onboarding — personal, academic, skills & resume
- Browse active company listings with eligibility filters
- View detailed JDs — tech stack, selection process, perks
- Apply to drives with a 3-application slot limit
- Track application status — Applied, Shortlisted, Selected, Rejected
- QR-based attendance scanning
- Document request system
- Profile management & notification preferences

### 🧑‍💼 Coordinator Module
- Secure coordinator login with password reset
- Analytics dashboard — real-time placement stats
- Full student database — searchable and filterable
- Company management — add companies, post & edit JDs
- Application management — view eligible students, update statuses
- Attendance session management
- Placement calendar — visual deadline tracker
- Announcement board
- NOC request & HR Feedback management
- Recruiter CRM

### 🏢 HR / Company Side
- Separate HR login
- HR feedback form submission

---

## Tech Stack

### Frontend
| Tech | Details |
|---|---|
| React 18 + Vite | Core framework |
| Tailwind CSS v4 | Styling |
| React Router v6 | Navigation |
| Lucide React | Icons |

### Backend
| Tech | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| Cloudinary | Resume / file uploads |
| Nodemailer | Email notifications |
| WhatsApp API | WhatsApp notifications |
| Node-cron | Scheduled jobs |

---

## Project Structure

```
PlaceRise/
├── backend/
│   ├── config/          # DB, Cloudinary, Email setup
│   ├── controllers/     # Route logic (12 controllers)
│   ├── models/          # Mongoose schemas (13 models)
│   ├── routes/          # API endpoints (12 route files)
│   ├── middleware/       # Auth, security, upload
│   ├── jobs/            # Cron jobs
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
│
└── PR/                  # Frontend (React + Vite)
    └── src/
        ├── components/
        ├── layouts/     # StudentLayout, CoordinatorLayout
        ├── pages/
        │   ├── common/       # 8 pages
        │   ├── coordinator/  # 14 pages
        │   └── student/      # 11 pages
        ├── routes/
        └── utils/
```

---

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### Frontend
```bash
cd PR
npm install
npm run dev
```

---

## Current Status

| Module | Status |
|---|---|
| Frontend — Student Module | ✅ Complete |
| Frontend — Coordinator Module | ✅ Complete |
| Backend — All APIs | ✅ Complete |
| Backend Integration | ✅ Complete |
| Deployment (Render + Vercel) | ✅ Live |
| College Server Deployment | 🔄 In Progress |

---

## College

**Dev Bhoomi Uttarakhand University (DBUU)**
Training & Placement Cell
Placement Season 2025–26

---

> *"We didn't wait for the placement system to get better — we built a better one."*
>
> This platform was built by students, for students. Every feature, every screen, every API exists because we believed that the process of finding your first opportunity deserved more than a WhatsApp forward and a Google Form.
>
> To every student who logs in here looking for their first break — we got you. 🚀
