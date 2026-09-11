# CloudBus — Cloud-Based Bus Pass & E-Ticketing System
**CodeAlpha Internship Project | Cloud Computing Track**

A full-stack, cloud-native Bus Pass and Ticket Booking System architected for zero-cost deployment on AWS (S3 Static Website Hosting + EC2 t2.micro Ubuntu) and local development.

---

## 🌟 Key Features

### 👤 Passenger / User Portal
- **JWT Authentication**: Secure register and login.
- **Route Explorer**: Filter and search through active bus routes with distance and pricing.
- **Real-Time Seat Booking**: Interactive 40-seat coach layout with live collision prevention.
- **Digital QR E-Pass**: Unique scannable QR generated and saved on server.
- **Printable PDF Ticket**: High-resolution branded boarding pass with terms, passenger details, and QR stamp using ReportLab.
- **My Passes**: Instant preview of all booked passes with 1-click PDF download.

### 🛡️ Administrator Portal
- **Dashboard & Analytics**: Total revenue, ticket sales, route count, passenger statistics.
- **Route Management**: Add, update, and delete bus transit routes.
- **Audit All Bookings**: Complete live log of all tickets booked across all passengers.
- **User Directory**: View registered passengers and staff.

---

## 🛠️ Tech Stack & Zero-Cost Cloud Architecture

| Layer | Technology | Hosting Platform (AWS Free Tier) |
|---|---|---|
| **Frontend** | React.js (Vite, Tailwind CSS, Lucide Icons, Axios) | AWS S3 Static Website Hosting |
| **Backend** | Python Flask (Threaded mode, CORS) | AWS EC2 `t2.micro` (Ubuntu) |
| **Database** | SQLite (WAL Mode for concurrency) | Local Disk on EC2 (Zero RDS Cost) |
| **Auth** | PyJWT + Werkzeug Password Hashing | Embedded in Flask |
| **QR Engine** | Python `qrcode` + PIL | Server-side `/static/tickets/qr/` |
| **PDF Engine** | ReportLab Platypus | Server-side `/static/tickets/pdf/` |

---

## 🚀 Running Locally

### 1. Start the Flask Backend (Port 5000)
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
> The database (`buspass.db`) is automatically initialized and seeded with default admin and demo routes.

### 2. Start the React Frontend (Port 5173)
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Default Seed Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@buspass.com` | `Admin@123` |
| **Demo Passenger** | `user@buspass.com` | `User@123` |

*(1-Click Demo Login buttons are also available on the login page for quick testing)*

---

## ☁️ Deploying to AWS Free Tier

- **EC2 Backend Setup**: Follow the step-by-step instructions in [`deployment/deploy-ec2.md`](./deployment/deploy-ec2.md) or run [`deployment/ec2_setup.sh`](./deployment/ec2_setup.sh).
- **S3 Frontend Hosting**: Follow [`deployment/deploy-s3.md`](./deployment/deploy-s3.md) to build and deploy the React static bundle to AWS S3.