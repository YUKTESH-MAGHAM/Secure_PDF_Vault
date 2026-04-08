# Secure PDF Vault

A cloud-based, secure PDF sharing platform built as a BTech Project.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS + React Router
- **Backend**: Node.js + Express
- **Database & Storage**: Supabase (PostgreSQL + Storage)

---

## Setup Instructions

### 1. Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a Storage bucket named **`pdfs`** (set to Public)
3. Run the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_id text UNIQUE NOT NULL,
  secret_key text NOT NULL,
  file_url text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE downloads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  accessed_at timestamp with time zone DEFAULT now()
);
```

---

### 2. Backend Setup

```bash
cd backend
copy .env.example .env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY in .env
npm install
node server.js
```

The backend will run on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend
copy .env.example .env
# VITE_API_URL is already set to http://localhost:5000
npm install
npm run dev
```

The frontend will run on **http://localhost:5173**

---

## Features

| Feature | Description |
|--------|-------------|
| 📤 Upload PDF | Drag & drop with secret key and expiry selection |
| 🔑 Secure Access | PDF ID + secret key verification |
| ⏱️ Auto Expiry | 1h / 24h / 7d / never |
| 📊 Admin Dashboard | View/delete all files |
| 📈 Analytics | Total uploads, downloads, most accessed file |
| 📱 QR Code | Quick shareable link after upload |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/upload` | Upload PDF file |
| POST | `/access` | Verify and access a file |
| GET | `/files` | List all files (admin) |
| DELETE | `/file/:id` | Delete a file |
| GET | `/analytics` | Get analytics data |

---

## Project Structure

```
secure-pdf-vault/
├── backend/
│   ├── routes/
│   │   ├── upload.js
│   │   ├── access.js
│   │   ├── files.js
│   │   └── analytics.js
│   ├── server.js
│   ├── supabase.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── CopyButton.jsx
    │   │   └── Spinner.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── UploadPage.jsx
    │   │   ├── AccessPage.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── AnalyticsDashboard.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── package.json
```
