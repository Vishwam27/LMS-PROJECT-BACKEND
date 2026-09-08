# CourseMaster LMS — Backend

A REST API for a full Learning Management System, built with **Express**, **Prisma**, and **PostgreSQL**. It powers three user roles — Student, Instructor, and Admin — with JWT authentication, an instructor-approval workflow, course and lesson management, and enrollment/progress tracking.


![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 (via `@prisma/adapter-pg` driver adapter) |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcrypt` password hashing |
| Validation | Manual request validation |
| Media | Cloudinary (course/lesson images & videos, referenced by URL) |
| Dev tooling | `tsx` (dev server & hot reload) |

## Features

**Authentication & Authorization**
- JWT-based auth with role-based access control (`STUDENT`, `INSTRUCTOR`, `ADMIN`)
- Passwords hashed with bcrypt; never returned in any API response
- Server-side password strength rules and email format validation
- Instructor accounts require admin approval (`PENDING` → `APPROVED` / `REJECTED`) before they can log in or manage courses

**Students**
- Browse the public course catalog
- Enroll in courses
- Track per-lesson progress and completion
- View a personal dashboard of enrolled courses

**Instructors**
- Create, update, publish/unpublish, and delete their own courses
- Add and manage lessons within their own courses
- View a dashboard of course, lesson, and enrollment stats

**Admins**
- Approve or reject pending instructor applications
- View platform-wide stats (users, courses, enrollments)
- Manage or remove any course or lesson on the platform

## Data Model

```mermaid
erDiagram
    USER ||--o{ COURSE : "teaches (instructor)"
    USER ||--o{ ENROLLMENT : "enrolls in"
    USER ||--o{ LESSON_PROGRESS : "tracks"
    USER ||--o{ USER_DAILY_ACTIVITY : "logs"
    CATEGORY ||--o{ COURSE : "categorizes"
    COURSE ||--o{ LESSON : "contains"
    COURSE ||--o{ ENROLLMENT : "receives"
    LESSON ||--o{ LESSON_PROGRESS : "tracked by"
```

- **User** — students, instructors, and admins. Instructors carry an approval `status`.
- **Category** — course categories.
- **Course** — owned by an instructor, belongs to a category, contains lessons.
- **Lesson** — ordered video content within a course.
- **Enrollment** — links a student to a course (one per student/course pair).
- **LessonProgress** — per-user, per-lesson completion tracking.
- **UserDailyActivity** — daily activity log per user.

## Project Structure

```
LMS-PROJECT-BACKEND/
├── prisma/
│   └── schema.prisma          # Models, enums, relations
├── prisma.config.ts           # Prisma CLI config
├── src/
│   ├── config/
│   │   └── db.ts              # Prisma client instance
│   ├── controllers/           # Request handlers / business logic
│   ├── middleware/
│   │   ├── authMiddleware.ts  # JWT verification
│   │   └── roleMiddleware.ts  # Role-based access control
│   ├── routes/                # Express route definitions
│   └── server.ts              # App entry point
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local or hosted)

### Installation

```bash
git clone https://github.com/Vishwam27/LMS-PROJECT-BACKEND.git
cd LMS-PROJECT-BACKEND
npm install
```

### Environment Variables

Create a `.env` file in the project root:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/lms` |
| `JWT_SECRET` | Secret used to sign and verify JWTs | a long, random string |
| `PORT` | Port the API server listens on | `5000` |

### Database Setup

```bash
npm run db:generate   # generate the Prisma client
npm run db:push       # push the schema to your database
```

> At least one `Category` row must exist before courses can be created — there's currently no seed script, so add categories directly via `npm run db:studio` until one is added.

### Running the API

```bash
npm run dev     # start the dev server with hot reload (tsx watch)
npm run build   # type-check and compile to dist/
npm start       # run the server
```

The API is available at `http://localhost:<PORT>`, with a health check at `GET /api/health`.

## API Overview

All protected routes expect `Authorization: Bearer <token>`.

**Auth** — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a student or instructor account |
| POST | `/login` | Public | Authenticate and receive a JWT |
| GET | `/me` | Authenticated | Get the current user's profile |
| PUT | `/profile` | Authenticated | Update name, bio, or avatar |

**Courses** — `/api/courses`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List all courses |
| GET | `/:id` | Public | Get a single course |
| GET | `/:id/lessons` | Authenticated | List a course's lessons |

**Categories** — `/api/categories`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List all categories |

**Enrollment** — `/api/enrollment`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/my-courses` | Authenticated | List the current user's enrolled courses |
| POST | `/:courseId` | Authenticated | Enroll in a course |
| PUT | `/lessons/:lessonId/progress` | Authenticated | Update progress on a lesson |
| GET | `/courses/:courseId/progress` | Authenticated | Get progress for a course |

**Dashboard** — `/api/dashboard`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get the current user's dashboard data |

**Instructor** — `/api/instructor` (approved instructors only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Instructor stats overview |
| GET | `/courses` | List the instructor's own courses |
| POST | `/courses` | Create a course |
| GET | `/courses/:courseId` | Get one of the instructor's courses |
| PUT | `/courses/:courseId` | Update a course |
| DELETE | `/courses/:courseId` | Delete a course |
| PATCH | `/courses/:courseId/publish` | Toggle publish status |
| POST | `/courses/:courseId/lessons` | Add a lesson to a course |
| GET | `/lessons/:lessonId` | Get a lesson |
| DELETE | `/lessons/:lessonId` | Delete a lesson |

**Admin** — `/api/admin` (admin role only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Platform-wide stats |
| GET | `/users` | List all users |
| GET | `/courses` | List all courses |
| GET | `/courses/:courseId` | Get any course |
| DELETE | `/courses/:courseId` | Remove any course |
| DELETE | `/lessons/:lessonId` | Remove any lesson |
| GET | `/instructors/pending` | List pending instructor applications |
| PATCH | `/instructors/:userId/approve` | Approve an instructor |
| PATCH | `/instructors/:userId/reject` | Reject an instructor |

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and compile TypeScript, then generate the Prisma client |
| `npm start` | Run the server |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Run Prisma migrations in dev mode |
| `npm run db:push` | Push the schema to the database without a migration |
| `npm run db:studio` | Open Prisma Studio |

