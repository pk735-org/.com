# PK735 Gaming Platform Clone

A high-fidelity mobile-first clone of the PK735 gaming lobby with integrated local payments (EasyPaisa / JazzCash), interactive game simulators (Aviator), a secret Admin Panel to manage balances/active accounts, and free hosting.

---

## 🛠️ Step-by-Step Setup Guide

Follow these simple steps to configure, run, and launch your application:

### Step 1: Create a Free Supabase Database
1. Go to [Supabase](https://supabase.com/) and create a free account.
2. Create a new project (choose a name, password, and select a database location near you).
3. Wait about 1-2 minutes for the database to provision.

### Step 2: Set Up Database Tables & Triggers
1. Once your project is ready, click on **SQL Editor** on the left menu (represented by a `>` icon).
2. Click **New Query**.
3. Open the file [supabase_schema.sql](./supabase_schema.sql) in this directory, copy its entire contents, and paste it into the Supabase SQL editor.
4. Click **Run** at the bottom right. You should see a success message: `"Success. No rows returned"`.

### Step 3: Disable Email Confirmation (Crucial!)
Since our system formats Pakistani phone numbers to bypass costly SMS OTP APIs, you must disable email confirmations:
1. In your Supabase Dashboard, go to **Authentication** (User icon) > **Providers** > **Email**.
2. Turn **OFF** the `"Confirm email"` switch.
3. Scroll down and click **Save**.

### Step 4: Configure Environment Keys
1. In your Supabase Dashboard, go to **Project Settings** (Gear icon) > **API**.
2. Copy the **Project URL** and the **anon/public** key.
3. Open the [.env](./.env) file in your project directory and paste them:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

---

## 🚀 Running the Project Locally

Make sure you have Node.js installed. In your terminal, run:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Run the development server
npm run dev
```
Open the provided URL (e.g., `http://localhost:5173`) in your browser. Right-click and choose **Inspect** and select **Mobile View** for the best layout fidelity!

---

## 🔒 Secret Admin Portal & Payout Approvals

- To access the **Admin Panel**, register your first account (the very first registered user is automatically marked as an Administrator).
- When logged in as an Admin, click on **Profile** in the bottom menu, then click **Open Admin Controller** (or navigate to `/admin`).
- In the Admin Panel, you can:
  - Approve pending deposits (enter the TID and check your EasyPaisa/JazzCash app). Approving instantly adds the cash to the user's lobby balance.
  - Approve payouts (view recipient numbers/titles and transfer from your wallet).
  - Reject payouts (automatically refunds the Rs amount back to the user's balance via DB trigger).
  - Edit active deposit account numbers and account titles so all players see your updated wallets instantly!

---

## 📦 How to Upload & Publish to GitHub

1. Create a new repository on your GitHub account (keep it public or private).
2. Run the following commands in your local project terminal:
   ```bash
   git init
   git add .
   git commit -m "Initialize PK735 clone with custom payments"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
3. To host the frontend for free, you can deploy it to **Vercel** or **GitHub Pages** by linking your repository. It will connect to your Supabase serverlessly!
