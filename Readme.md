# 🎓 CourseMaster LMS — Backend

A RESTful backend API for a full-stack **Learning Management System (LMS)** built with **Node.js, TypeScript, Express, Prisma, and PostgreSQL**.

The backend powers three role-based experiences:

- 🎓 Student
- 👨‍🏫 Instructor
- 🛡️ Admin

It handles authentication, authorization, course management, lessons, enrollment, learning progress, dashboards, instructor approval, profile management, and administrative operations.

> **Frontend:** [LMS-PROJECT-FRONTEND](https://github.com/Vishwam27/LMS-PROJECT-FRONTEND)

---

# 🚀 Features

## 🔐 Authentication & Authorization

- JWT-based authentication
- Configurable JWT expiration
- Email/password authentication
- Google OAuth authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- Instructor approval workflow
- Account status management
- Profile management
- Password change
- Account deletion
- Server-side validation
- Authentication rate limiting

### User Roles

```text
STUDENT
INSTRUCTOR
ADMIN
```

### Instructor Account Status

```text
PENDING
   ↓
APPROVED
   │
   └──→ REJECTED
```

Instructor accounts require administrator approval before instructor functionality is available.

---

# 🎓 Student Features

Authenticated students can:

- Browse the course catalog
- View course details
- Enroll in courses
- View enrolled courses
- Access course lessons
- Track lesson progress
- Mark lessons as completed
- View course progress
- View dashboard information
- Update their profile
- Change their password
- Delete their account

---

# 👨‍🏫 Instructor Features

Approved instructors can:

- View instructor dashboard statistics
- Create courses
- View their courses
- View individual courses
- Update courses
- Delete their courses
- Publish or unpublish courses
- Add lessons
- View lessons
- Delete lessons
- Manage their own course content

Course ownership is enforced by the backend.

---

# 🛡️ Admin Features

Administrators can:

- View platform dashboard statistics
- View all users
- Delete users
- View all courses
- View individual courses
- Delete courses
- Delete lessons
- View pending instructor applications
- Approve instructors
- Reject instructors

All admin functionality is protected by authentication and role authorization.

---

# 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Prisma Driver | `@prisma/adapter-pg` |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Google Authentication | Google OAuth / `google-auth-library` |
| Validation | Zod / Server-side validation |
| Media | Cloudinary |
| Rate Limiting | `express-rate-limit` |
| Environment Config | dotenv |
| CORS | cors |
| Development | tsx |

---

# 🏗️ Architecture

CourseMaster uses a separated frontend/backend architecture.

```text
┌─────────────────────────────────────┐
│         Next.js Frontend            │
│                                     │
│    Student │ Instructor │ Admin     │
└──────────────────┬──────────────────┘
                   │
                   │ REST API
                   ▼
┌─────────────────────────────────────┐
│          Express Backend             │
│                                     │
│ Authentication                      │
│ Authorization                       │
│ Courses                             │
│ Categories                          │
│ Enrollment                          │
│ Lessons                             │
│ Progress                            │
│ Dashboard                           │
│ Instructor                          │
│ Admin                               │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         PostgreSQL + Prisma         │
└─────────────────────────────────────┘

                   │
                   ▼

          ┌─────────────────┐
          │   Cloudinary    │
          │   Media Assets  │
          └─────────────────┘
```

---

# 📁 Project Structure

```text
LMS-PROJECT-BACKEND/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   │
│   ├── config/
│   │   └── db.ts
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── courseController.ts
│   │   ├── enrollmentController.ts
│   │   ├── dashboardController.ts
│   │   ├── instructorController.ts
│   │   ├── adminController.ts
│   │   └── categoryController.ts
│   │
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   └── rateLimit.ts
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── courseRoutes.ts
│   │   ├── enrollmentRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── instructorRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── categoryRoutes.ts
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   └── server.ts
│
├── prisma.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# 🗄️ Database

The application uses **PostgreSQL** with **Prisma ORM**.

## Main Models

```text
User
 │
 ├── Course
 ├── Enrollment
 ├── LessonProgress
 └── UserDailyActivity

Category
 │
 └── Course

Course
 │
 ├── Lesson
 └── Enrollment

Lesson
 │
 └── LessonProgress
```

## User

Stores:

- Name
- Email
- Password
- Google ID
- Role
- Account status
- Avatar URL
- Bio
- Timestamps

## Category

Stores:

- Category name
- Description
- Timestamps

## Course

Stores:

- Title
- Description
- Image URL
- Price
- Level
- Duration
- Instructor
- Category
- Published status
- Timestamps

## Lesson

Stores:

- Course ID
- Title
- Description
- Video URL
- Duration
- Lesson order
- Published status
- Timestamps

## Enrollment

Connects a student to a course and stores:

- Enrollment status
- Enrollment date
- Completion date
- Last accessed time

A student can have only one enrollment for a specific course.

## LessonProgress

Tracks:

- User
- Lesson
- Completion status
- Progress in seconds
- Completion time
- Last accessed time
- Timestamps

## UserDailyActivity

Stores a user's daily activity records.

---

# 🔄 Core Data Flow

## Authentication

```text
Client
  │
  │ POST /api/auth/login
  ▼
Express Route
  │
  ▼
Auth Controller
  │
  ├── Validate request
  ├── Find user
  ├── Verify password
  └── Generate JWT
  │
  ▼
JWT Response
```

## Course Enrollment

```text
Student
   │
   │ POST /api/enrollment/:courseId
   ▼
Enrollment Controller
   │
   ├── Verify JWT
   ├── Verify course
   ├── Check existing enrollment
   └── Create enrollment
   │
   ▼
PostgreSQL
```

## Lesson Progress

```text
Student completes lesson
          │
          ▼
PUT /api/enrollment/lessons/:lessonId/progress
          │
          ▼
Verify authenticated user
          │
          ▼
Update LessonProgress
          │
          ▼
Course progress returned
```

---

# 🔑 Authentication Flow

## Email / Password

```text
Register
   ↓
Validate Input
   ↓
Hash Password
   ↓
Create User
   ↓
Login
   ↓
Verify Credentials
   ↓
Generate JWT
   ↓
Authenticated API Requests
```

## Google OAuth

```text
Google Sign-In
      ↓
Google Credential
      ↓
Backend Verification
      ↓
Find / Create User
      ↓
Generate CourseMaster JWT
      ↓
Authenticated API Requests
```

Google-authenticated users are created with the Student role.

---

# 🎫 JWT Authentication

Protected endpoints expect a JWT in the request header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example:

```http
GET /api/enrollment/my-courses
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

The authentication middleware:

1. Reads the `Authorization` header
2. Extracts the Bearer token
3. Verifies the JWT
4. Identifies the authenticated user
5. Adds the authenticated user to the request

Role-based middleware then restricts protected instructor and admin operations.

---

# ⏳ JWT Expiration

JWT expiration is configurable through:

```env
JWT_EXPIRE_IN="5h"
```

The value follows the supported JWT expiration format used by the application.

---

# 🛡️ Rate Limiting

The backend uses `express-rate-limit` on authentication endpoints.

The current authentication rate-limit configuration uses:

```env
LOGIN_WINDOWS_TIME=your-window-value
RATE_LIMIT=10
```

These settings control:

- `LOGIN_WINDOWS_TIME` — rate-limit time window
- `RATE_LIMIT` — maximum requests allowed within the configured window

The authentication endpoints protected by the limiter include:

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/google
```

> `REGISTER_WINDOWS_TIME` is not documented as an active backend setting because the current rate-limit middleware does not read it.

---

# 📡 API Documentation

Base URL:

```text
http://localhost:5000
```

---

## ❤️ Health Check

```http
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "LMS backend is running"
}
```

---

## 🔐 Authentication

Base route:

```text
/api/auth
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a user |
| POST | `/login` | Public | Login with email/password |
| POST | `/google` | Public | Authenticate with Google |
| GET | `/me` | Authenticated | Get current user |
| PUT | `/profile` | Authenticated | Update profile |
| DELETE | `/account` | Authenticated | Delete current account |
| PUT | `/change-password` | Authenticated | Change password |

---

## 📚 Courses

Base route:

```text
/api/courses
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Get course catalog |
| GET | `/:id` | Public | Get course details |
| GET | `/:id/lessons` | Authenticated | Get course lessons |

---

## 🏷️ Categories

Base route:

```text
/api/categories
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Get all categories |

---

## 📝 Enrollment & Progress

Base route:

```text
/api/enrollment
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/my-courses` | Authenticated | Get enrolled courses |
| POST | `/:courseId` | Authenticated | Enroll in a course |
| PUT | `/lessons/:lessonId/progress` | Authenticated | Update lesson progress |
| GET | `/courses/:courseId/progress` | Authenticated | Get course progress |

---

## 📊 Dashboard

Base route:

```text
/api/dashboard
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get dashboard information |

---

## 👨‍🏫 Instructor

Base route:

```text
/api/instructor
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Instructor statistics |
| GET | `/courses` | Get instructor courses |
| POST | `/courses` | Create course |
| GET | `/courses/:courseId` | Get instructor course |
| PUT | `/courses/:courseId` | Update course |
| DELETE | `/courses/:courseId` | Delete course |
| PATCH | `/courses/:courseId/publish` | Publish/unpublish course |
| POST | `/courses/:courseId/lessons` | Add lesson |
| GET | `/lessons/:lessonId` | Get lesson |
| DELETE | `/lessons/:lessonId` | Delete lesson |

Instructor routes require authentication and approved instructor access.

---

## 🛡️ Admin

Base route:

```text
/api/admin
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Platform statistics |
| GET | `/users` | Get all users |
| DELETE | `/users/:userId` | Delete user |
| GET | `/courses` | Get all courses |
| GET | `/courses/:courseId` | Get course |
| DELETE | `/courses/:courseId` | Delete course |
| DELETE | `/lessons/:lessonId` | Delete lesson |
| GET | `/instructors/pending` | Get pending instructors |
| PATCH | `/instructors/:userId/approve` | Approve instructor |
| PATCH | `/instructors/:userId/reject` | Reject instructor |

Admin routes require authentication and the `ADMIN` role.

---

# 🔒 Protected Routes

Protected endpoints expect:

```http
Authorization: Bearer <JWT_TOKEN>
```

Unauthorized requests return an authentication error, while authenticated users without the required role are rejected by role authorization.

---

# ✅ Validation

The backend performs server-side validation before processing database operations.

Validation covers areas such as:

- Required fields
- Email validation
- Password requirements
- Role and account-status checks
- Authentication credentials
- Google authentication data
- Course and lesson input
---

# 🔒 Security

The backend includes:

- JWT authentication
- Role-based authorization
- bcrypt password hashing
- Google credential verification
- Authentication rate limiting
- Protected API routes
- Server-side validation
- Environment-based secrets
- Sensitive credential protection

Never commit:

```text
.env
DATABASE_URL
JWT_SECRET
Google OAuth credentials
Cloudinary secrets
```

---

# ☁️ Cloudinary

Cloudinary is used for application media.

Course and lesson records can contain media references such as:

```text
imageUrl
videoUrl
```

The media files are hosted through Cloudinary instead of being stored directly in PostgreSQL.

---

# ⚙️ Getting Started

## Prerequisites

Install:

- Node.js 20+
- npm
- PostgreSQL
- Git

You also need:

- PostgreSQL connection string
- JWT secret
- Google OAuth Client ID, if Google login is enabled
- Cloudinary configuration, if media features are used

---

## 1. Clone the Repository

```bash
git clone https://github.com/Vishwam27/LMS-PROJECT-BACKEND.git
```

```bash
cd LMS-PROJECT-BACKEND
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="your-postgresql-connection-string"

JWT_SECRET="your-long-random-secret"
JWT_EXPIRE_IN="5h"

GOOGLE_CLIENT_ID="your-google-client-id"

PORT=5000

LOGIN_WINDOWS_TIME=your-window-value
RATE_LIMIT=10
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `JWT_EXPIRE_IN` | JWT expiration duration |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `PORT` | Backend server port |
| `LOGIN_WINDOWS_TIME` | Rate-limit time window |
| `RATE_LIMIT` | Maximum requests allowed within the configured window |

> Keep the real values in your local `.env` file. Do not commit credentials or secrets.

---

## 4. Generate Prisma Client

```bash
npm run db:generate
```

---

## 5. Setup the Database

For schema push:

```bash
npm run db:push
```

For migrations:

```bash
npm run db:migrate
```

Open Prisma Studio:

```bash
npm run db:studio
```

---

## 6. Run the Backend

```bash
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

Or on the port configured in `.env`.

---

# 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the TypeScript backend |
| `npm start` | Start the backend server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Run the configured Prisma seed command |
| `npm run seed` | Run the seed command |

---

# 🧪 API Testing

The API can be tested using:

- Postman
- Insomnia
- Thunder Client
- REST Client
- CourseMaster frontend

Health-check example:

```http
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "LMS backend is running"
}
```

---

# 🔄 Frontend Integration

This backend is designed to work with the CourseMaster Next.js frontend.

```text
┌──────────────────────────┐
│     Next.js Frontend     │
│                          │
│ Login                    │
│ Register                 │
│ Explore Courses          │
│ Course Details           │
│ Enrollment               │
│ My Courses               │
│ Learning                 │
│ Dashboards               │
└────────────┬─────────────┘
             │
             │ REST API
             ▼
┌──────────────────────────┐
│     Express Backend      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ PostgreSQL + Prisma      │
└──────────────────────────┘
```

### Frontend Repository

https://github.com/Vishwam27/LMS-PROJECT-FRONTEND

---

# 🎯 Project Goals

This backend was built as a practical full-stack portfolio project to demonstrate experience with:

- REST API development
- TypeScript backend development
- Express architecture
- PostgreSQL database design
- Prisma ORM
- JWT authentication
- Google OAuth
- Role-based authorization
- Password security
- Rate limiting
- Server-side validation
- CRUD operations
- Course management
- Lesson management
- Enrollment systems
- Learning-progress tracking
- Instructor approval workflows
- Admin management
- Cloud media integration
- Frontend/backend separation

---

# 👨‍💻 Author

## Vishwam Patel

**Computer Engineering Graduate | Full-Stack Developer**

### Main Technologies

```text
TypeScript
Node.js
Express
PostgreSQL
Prisma
JWT
Google OAuth
bcrypt
Zod
Cloudinary
```

---

# 🔗 Project Links

### Frontend

https://github.com/Vishwam27/LMS-PROJECT-FRONTEND

### Backend

https://github.com/Vishwam27/LMS-PROJECT-BACKEND
