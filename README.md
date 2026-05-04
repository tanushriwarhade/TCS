# ExamPro - Modern Online Examination System

A high-performance, secure, and professional online examination platform built with the modern stack.

## 🚀 Features

- **JWT-Based Authentication**: Secure login/signup via Firebase Auth.
- **Dynamic Exam Interface**:
  - Real-time countdown timer with auto-submit.
  - Multi-format questions (MCQ, Multi-select, Numeric).
  - Question Palette for easy navigation.
  - Mark for Review & Question Flagging.
- **Proctoring Features**:
  - Tab switch detection and warnings.
  - Full-screen mode recommendation.
  - Auto-save progress every 10 seconds.
- **Admin Panel**:
  - Create and manage exams.
  - Draft/Active status management.
- **Result System**:
  - Instant scoring and performance summary.
  - Secure relational rules for data privacy.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Vite Middleware.
- **Database**: Firebase Firestore.
- **Auth**: Firebase Authentication.

## 📦 Setup Instructions

1. **Firebase Setup**:
   - Ensure you've clicked **"Set up Firebase"** in the AI Studio UI.
   - Once provisioned, the `firestore.rules` will protect your data.

2. **Seeding Sample Data**:
   - Run the following command in the terminal to populate the database with a sample exam:
     ```bash
     npx tsx seed.ts
     ```

3. **Running the App**:
   - The development server starts automatically on port 3000.
   - Visit the dashboard to sign up as a Student or Admin.

## 🛡️ Security

- **Database Rules**: Firestore rules ensure students can only read/write their own submissions and cannot modify exam questions.
- **Session Integrity**: The server validates submission status to prevent re-taking completed exams.

## 📐 Project Structure

- `server.ts`: Express server entry point.
- `src/`: React source code.
  - `components/`: UI components (Layout, Auth guards).
  - `pages/`: Page-level components.
  - `services/`: Firebase initialization.
  - `hooks/`: Custom hooks for Auth and Logic.
- `firestore.rules`: Security configuration for the database.
- `seed.ts`: Script for generating initial test data.
