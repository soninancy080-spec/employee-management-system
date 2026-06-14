# Employee Management System (EMS) - Full Stack Web Portal

Welcome to the **Employee Management System (EMS)**, a modern, full-stack web application designed for comprehensive workforce administration. Built with a highly responsive, modern glassmorphic interface and a robust Node.js backend, EMS facilitates seamless employee profiling, pro-rated payroll processing, audit logging, and mobile-inspired attendance tracking.

---

## 🛠️ Technology Stack
*   **Frontend**: React (Vite), Redux Toolkit (State Management), Vanilla CSS (Glassmorphism & premium dark/light themes), Lucide Icons
*   **Backend**: Node.js, Express.js, Prisma ORM
*   **Database**: PostgreSQL (Prisma Client)
*   **Containerization**: Docker, Docker Compose

---

## 🚀 Key Application Modules

### 1. Premium Profile Management
*   **Two-Column Layout**: Left side presents a wavy header banner, avatar, coping ID action, and basic details (contact, hire type, role, gender). Right side houses interactive tabs (`Personal Information`, `Job`, `Salary`, `Payslips`, `Documents`).
*   **Dynamic Sections**: Supports detailed information including education level, degree, home address, tax details, and hard/soft skills.
*   **Edit Modals**: Scoped edit modals let employees update sections instantly, persisting changes to the PostgreSQL database.

### 2. smHRt Payroll Dashboard
*   **Admin Console**: Interactive 3-column process grid supporting employee-wise search, spreadsheet drop zone, month/year selectors, and simulated calculations. Pushing **Run smHRt Payroll** consolidates attendance, calculates ESIC/PF/TDS deductions, writes entries to `audit_logs`, and notifications all employees.
*   **Salary Adjustment**: Privileged roles can override an employee's monthly gross salary on-the-fly, instantly updating monthly total widgets.
*   **Employee Statement**: Standard accounts see a pro-rated earnings card, dynamic PF/ESIC/TDS deduction breakdown, attendance summaries, and payable net take-home salary.

### 3. Attendance Console
*   **Visual SVG Donut Chart**: Renders a segmented circular SVG donut dynamically dividing presence/lateness/absence days into clean color coordinates (Teal: On Time, Orange: Late In, Blue: Early Exit, Red: Absent).
*   **Clock In/Out**: One-tap attendance log recording. If checking in after **09:30 AM**, a slide-up drawer requests a "Lateness Reason" before logging status as `LATE`.
*   **Supervisor Directory**: Admins can search for any employee, inspect their circular metrics, view late logs, and override attendance records for any selected date.

### 4. Password Recovery System
*   Forgot password recovery via cryptographically secure reset tokens. Local development includes an inline glassmorphic helper alert carrying the direct reset link, bypassing SMTP server dependencies.

---

## ☁️ Cloud PostgreSQL Database Connection
To transition the application from local PostgreSQL to a cloud-hosted database (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Aiven](https://aiven.io)):

1.  Provision a free PostgreSQL instance on Neon or Supabase.
2.  Copy the database connection string. It will look like:
    ```env
    DATABASE_URL="postgresql://username:password@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require"
    ```
3.  Replace the `DATABASE_URL` in `backend/.env` with your cloud connection string.
4.  Run Prisma migration to populate your cloud database schema:
    ```bash
    cd backend
    npx prisma db push
    ```

---

## 📦 Deployment Guide

### 1. Deploying the Backend on Render
Render is a cloud hosting platform that can build and run Node.js/Express applications seamlessly.

#### Setup Steps:
1.  Sign in to [Render](https://render.com) and click **New** -> **Web Service**.
2.  Connect your GitHub repository: `soninancy080-spec/employee-management-system`.
3.  Set the following configuration:
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npx prisma generate`
    *   **Start Command**: `node server.js`
4.  Open the **Environment** tab and add your environment variables:
    *   `PORT` = `5001`
    *   `DATABASE_URL` = *(Your cloud PostgreSQL URL)*
    *   `JWT_SECRET` = *(Any secure random string)*
    *   `NODE_ENV` = `production`
5.  Click **Deploy Web Service**. Render will build the Prisma Client, push schema structures, and launch the service.

---

### 2. Deploying the Frontend on Vercel
Vercel is optimized for frontend deployments and supports full-blown React applications.

#### Route Configuration:
To prevent `404` errors when refreshing routes on single-page apps (SPA), a `vercel.json` configuration file is required in the frontend root to route all requests back to `index.html`.

#### Setup Steps:
1.  Sign in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2.  Import your GitHub repository: `soninancy080-spec/employee-management-system`.
3.  Set the following configuration:
    *   **Root Directory**: `frontend`
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  Open the **Environment Variables** section and configure backend API connections:
    *   *(Note: The frontend code connects to the backend at `http://localhost:5001`. For production, update API endpoint URLs inside `frontend/src/store/authSlice.js` and pages to point to your live Render backend URL, e.g. `https://ems-backend.onrender.com`)*
5.  Click **Deploy**. Vercel will host your static React build and configure edge routing.

---

## 💻 Local Development Setup

### Backend Setup:
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the backend root containing your connection details:
    ```env
    PORT=5001
    DATABASE_URL=postgresql://postgres:admin1234@localhost:5432/auth_app
    JWT_SECRET=super_secret_jwt_token_key_123456
    NODE_ENV=development
    ```
4.  Run Prisma migrations & seed database options:
    ```bash
    npx prisma db push
    node scratch/seed_defaults.js
    ```
5.  Start the backend development server:
    ```bash
    npm run dev
    ```

### Frontend Setup:
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
4.  Open the application in your browser at `http://localhost:5173`.
