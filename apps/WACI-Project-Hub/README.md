# WACI Project Hub

Field project management hub for **Wildlife Africa Conservation Initiative (WACI)**.
Manages projects, volunteer assignments, grant offers, monthly reports, and payments.

## Platform integration
- Shared Felix backend (`backend/`)
- Shared Neon/Postgres database
- Shared admin dashboard (`/waci-project-hub`)
- Shared auth/JWT system
- Shared Resend email setup

## Domain
- `waci-hub.felixplatforms.com`

## App type
- Web only (Next.js + Tailwind)

## Key identifiers
- `app_name: WACI-Project-Hub`
- `slug: waci-project-hub`
- First pilot: `airport-wildlife-watch-katsina`

## Folder structure
```
apps/WACI-Project-Hub/
  web/
    app/
      page.tsx                          # Landing — active projects
      projects/page.tsx                 # All projects
      projects/[slug]/page.tsx          # Project detail
      volunteer/dashboard/page.tsx      # Volunteer portal home
      volunteer/grant/[offerId]/page.tsx # Grant acceptance + digital signature
      volunteer/reports/page.tsx        # My reports list
      volunteer/reports/new/page.tsx    # Submit monthly report
    lib/api.ts                          # API service (shared backend)
  README.md
```

## Backend routes (shared backend)
| Prefix | Routes file | Controller |
|---|---|---|
| `/api/waci-hub/projects` | `routes/waciProjects.js` | `controllers/waciProjectController.js` |
| `/api/waci-hub/grants` | `routes/waciGrants.js` | `controllers/waciGrantController.js` |
| `/api/waci-hub/reports` | `routes/waciReports.js` | `controllers/waciReportController.js` |

## Database tables
All in shared Neon/Postgres DB. Schema: `database/waci_project_hub.sql`

| Table | Purpose |
|---|---|
| `waci_projects` | Projects |
| `waci_project_assignments` | Volunteer assignments per project |
| `waci_grant_offers` | Grant offers issued to volunteers |
| `waci_grant_acceptances` | Digital signature acceptance records |
| `waci_monthly_reports` | Monthly field reports |
| `waci_report_attachments` | File attachments on reports |
| `waci_payments` | Payment tracking per grant/report cycle |

## Admin dashboard
- Route: `admin.felixplatforms.com/waci-project-hub`
- Page: `admin-dashboard/frontend/src/pages/WACIProjectHub.jsx`
- Sections: Projects · Volunteer Assignments · Grant Offers · Report Review · Payment Status

## Workflow
1. Admin creates project
2. Admin assigns volunteer (`waci_project_assignments`)
3. Admin issues grant offer (`waci_grant_offers`)
4. Volunteer reviews and signs grant acceptance page
5. Volunteer submits monthly report by deadline
6. Admin reviews report (approve / request revision / reject)
7. Admin creates payment after approval
8. Next month funding unlocked after approval
9. Final report closes project

## Grant acceptance page includes
- Project title, purpose, objectives, methodology, deliverables
- Expectations, funding structure, reporting deadlines
- Final reporting requirement
- Acceptance checkbox
- Typed full name + optional drawn signature (canvas)
- Acceptance timestamp recorded server-side
- Downloadable copy (pdf_url — populated post-acceptance)

## Dev
```bash
cd apps/WACI-Project-Hub/web
cp .env.example .env.local
npm install
npm run dev
```
