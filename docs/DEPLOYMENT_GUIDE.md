# PoolFolio — Deployment & Hosting Guide

This guide walks through deploying PoolFolio to free-tier cloud providers:
- **Database:** [Neon PostgreSQL](https://neon.tech) (Already provisioned in Singapore region)
- **Backend:** [Render](https://render.com) (Spring Boot 21 via Docker Web Service)
- **Frontend:** [Vercel](https://vercel.com) (Next.js 15)

---

## 1. Neon Database (Postgres)

Your database is provisioned in the Neon console under project `poolfolio-db` (AWS Singapore `ap-southeast-1`):

- **Host:** `ep-red-leaf-b33bohmp.c-4.ap-southeast-1.aws.neon.tech`
- **Database:** `poolfolio_db`
- **User:** `neondb_owner`
- **Password:** `npg_qTXrb5agcy4P`
- **JDBC Connection String:**
  ```
  jdbc:postgresql://ep-red-leaf-b33bohmp.c-4.ap-southeast-1.aws.neon.tech/poolfolio_db?sslmode=require
  ```

---

## 2. Backend Deployment on Render

Render runs the Spring Boot application using the production `backend/Dockerfile`.

### Steps:
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** > **Web Service**.
2. Connect your GitHub repository: `lokesh6692/PoolFolio`.
3. Configure the service settings:
   - **Name:** `poolfolio-backend` (or your preferred name)
   - **Region:** `Singapore (Southeast Asia)` *(matches Neon for minimal DB latency)*
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` *(Render will automatically detect `backend/Dockerfile`)*
   - **Instance Type:** `Free`
4. Expand **Advanced** and configure **Health Check Path**:
   - `/api/v1/health`
5. Add the following **Environment Variables**:
   | Key | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-red-leaf-b33bohmp.c-4.ap-southeast-1.aws.neon.tech/poolfolio_db?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
   | `SPRING_DATASOURCE_PASSWORD` | `npg_qTXrb5agcy4P` |
   | `APP_JWT_SECRET` | `poolfolio-secure-random-jwt-secret-key-at-least-256-bits-long-2026` |
6. Click **Create Web Service**.
7. Once the build finishes and status turns **Live**, copy your public backend URL:
   `https://<your-service-name>.onrender.com`

---

## 3. Frontend Deployment on Vercel

Vercel hosts the Next.js frontend with automatic global CDN distribution.

### Steps:
1. Go to [vercel.com/new](https://vercel.com/new) and click **Import** next to `lokesh6692/PoolFolio`.
2. Configure Project Settings:
   - **Project Name:** `poolfolio` (or `poolfolio-frontend`)
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click `Edit` and choose `frontend`
3. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-service-name>.onrender.com/api/v1` |
   | `BACKEND_URL` | `https://<your-service-name>.onrender.com` |
   *(Replace `<your-service-name>` with your actual Render service name from Step 2)*
4. Click **Deploy**.
5. Within ~60 seconds, your site will be live at `https://<your-project>.vercel.app`.

---

## 4. Verification

1. Open your live Vercel URL.
2. Sign up to create a new investment group (e.g. "Alpha Syndicate") and account.
3. Test recording a deposit contribution.
4. Test recording a BUY trade and viewing the dashboard metrics.
