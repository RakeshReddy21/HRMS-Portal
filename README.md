# WorkForce — Frontend

Angular frontend for the WorkForce HRMS Portal.

## Tech Stack

- Angular 21
- Tailwind CSS 4
- TypeScript 5.9
- STOMP.js (WebSocket)
- Vitest

## Pages

- **Login** — Authentication with 2FA support
- **Admin** — Dashboard, Employees, Departments, Designations, Leaves, Attendance, Performance Reviews, Announcements, Activity Logs, IP Access, Office Locations
- **Manager** — Dashboard, Team, Team Attendance, Team Leaves, Team Performance
- **Employee** — Dashboard, Attendance, Leaves, Performance, Announcements, Directory
- **Chat** — Real-time messaging
- **Settings** — Profile & password management

## Project Structure

```
src/app/
├── components/     # Shared components (toast, loading, empty-state)
├── guards/         # Auth & role guards
├── interceptors/   # HTTP auth interceptor
├── layout/         # Sidebar, Header
├── models/         # TypeScript interfaces
├── pages/
│   ├── admin/      # Admin pages
│   ├── manager/    # Manager pages
│   ├── employee/   # Employee pages
│   ├── login/      # Login page
│   ├── chat/       # Chat page
│   └── settings/   # Settings page
└── services/       # API service layer
```

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
npm start
```

Runs on `http://localhost:4200`

Backend API expected at `http://localhost:8080/api`

## Running Tests

```bash
npm test
```

## Build

```bash
npm run build
```

Output in `dist/` directory.
