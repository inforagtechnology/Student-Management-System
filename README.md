# Student Management System

React (Vite) frontend + Supabase (Postgres, Auth, Row Level Security) backend.

## Roles

| Role    | Can do |
|---------|--------|
| admin   | View, edit, delete any student record. Create HR and student accounts. |
| hr      | View every student record (read-only). Cannot edit or delete. |
| student | View and edit only their own details. |

Permissions are enforced in the database (Row Level Security), not just hidden
in the UI — so they hold even if someone calls the API directly.

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then open
**Project Settings → API** and copy the **Project URL** and **anon public** key.

## 2. Set up the database

Open **SQL Editor** in the Supabase dashboard, paste the contents of
`supabase/schema.sql`, and run it. This creates the `profiles` and `students`
tables, the trigger that provisions a row on signup, and all the Row Level
Security policies described in the table above.

## 3. Turn on email verification

Go to **Authentication → Providers → Email** and make sure **Confirm email**
is switched **on**. This is what makes Supabase send the verification link
and block login until the student clicks it.

(Optional) Under **Authentication → Email Templates** you can customize the
"Confirm signup" email's subject and body.

## 4. Create your first admin

There's no admin yet, so bootstrap one manually:

1. Run the app (`npm run dev`) and sign up normally through the Signup page.
2. Confirm that email via the link Supabase sends.
3. In the Supabase dashboard, go to **Table Editor → profiles**, find that
   row, and change its `role` from `student` to `admin`.

From then on, that admin account can create every other HR/student account
from inside the app.

## 5. Deploy the edge function

Admin-created accounts are provisioned by a small server-side function
(`supabase/functions/create-user`) — this has to run server-side because it
uses your project's service role key, which must never be shipped to the
browser.

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-user
```

The function needs the service role key as a secret (find it in
**Project Settings → API**, "service_role" — keep it private):

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 6. Run the frontend

```bash
cp .env.example .env
# edit .env with your Project URL and anon key from step 1
npm install
npm run dev
```

Open the printed local URL. Sign up as a student to see the verification
flow, or log in as your admin account to manage students and create HR
accounts.

## Project structure

```
supabase/
  schema.sql                 database tables + RLS policies
  functions/create-user/     edge function: admin-only account creation
src/
  lib/supabaseClient.js      Supabase client
  context/AuthContext.jsx    session + role state, useAuth() hook
  components/
    ProtectedRoute.jsx       route guard by login + role
    Navbar.jsx
  pages/
    Login.jsx, Signup.jsx, CheckEmail.jsx, Unauthorized.jsx
    admin/AdminDashboard.jsx  admin: edit/delete any student
    admin/CreateUser.jsx      admin: create HR/student accounts
    hr/HRDashboard.jsx        hr: read-only view of all students
    student/StudentProfile.jsx  student: view/edit own record
```
