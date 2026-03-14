# Enterprise Identity & Access Management (IAM) System

A robust, full-stack Identity and Access Management system built with **Spring Boot 3** and **React (Vite)**. This application provides secure authentication, role-based access control (RBAC), audit logging, and a modern user interface.

![Tech Stack](https://skillicons.dev/icons?i=java,spring,react,ts,tailwind,postgres,docker)

## 🚀 Features

### Core Security

- **JWT Authentication**: Secure, stateless authentication using JSON Web Tokens.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions with default roles (`USER`, `MODERATOR`, `ADMIN`).
- **Separate Admin Portal**: Dedicated login flow for Administrators for enhanced security (`/admin/login`).
- **Audit Logging**: Comprehensive tracking of critical system events (Logins, Role Changes, User Updates).

### Backend (Spring Boot)

- **Architecture**: RESTful API design with clean service layer architecture.
- **Database**: PostgreSQL integration with JPA/Hibernate.
- **Security**: Spring Security 6 with `BCrypt` password hashing.
- **Performance**: Redis caching support for UserDetails (optional/configurable).

### Frontend (React + Shadcn UI)

- **Framework**: Built with React 18, TypeScript, and Vite for blazing fast performance.
- **UI Library**: **Shadcn UI** & **Tailwind CSS** for a professional, accessible, and responsive design.
- **State Management**: Context API for global Authentication state.
- **Form Handling**: `React-Hook-Form` + `Zod` for robust schema validation.

---

## 🛠️ Tech Stack

### Backend

- **Java 17+**
- **Spring Boot 3.2.2**
- **Spring Security** (JWT)
- **Spring Data JPA**
- **PostgreSQL**
- **Lombok**

### Frontend

- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Shadcn UI**
- **Axios**
- **React Router DOM**

---

## ⚙️ Getting Started

### Prerequisites

- **Java 17** SDK installed.
- **Node.js 18+** and **npm** installed.
- **PostgreSQL** database running locally.

### 1. Database Setup

Ensure PostgreSQL is running and create a new database:

```sql
CREATE DATABASE iam_db;
```

_Note: The application will automatically create the necessary tables on the first run._

### 2. Backend Setup

1. Navigate to the project root:
   ```bash
   cd "Spring Boot Java/Projects/New Project"
   ```
2. Configure database credentials in `src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/iam_db
       username: your_postgres_user
       password: your_postgres_password
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend API will start at `http://localhost:8080`.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## 📖 Usage Guide

### User Registration & Login

1. Open `http://localhost:5173/register`.
2. Create a new account.
   - _Tip: For demo purposes, you can select your Role (User, Moderator, Admin) during registration._
3. Login at `http://localhost:5173/login`.

### Admin Access

**Strict Separation**: Administrators have a dedicated login portal.

1. Access the Admin Login at **`http://localhost:5173/admin/login`**.
2. Enter your Admin credentials.
3. Upon success, you will be redirected to the **Admin Dashboard**.

### Admin Dashboard Features

- **User Management**: View, Search, Enable/Disable users.
- **Role Management**: Create and Edit roles with specific permissions.
- **Audit Logs**: View a historical record of all system activities.

### User Self-Service

- **My Profile**: Users can update their basic info (Phone, Email) and change their passwords securely.

---

## 🔒 Security Best Practices Implemented

- **No Direct Admin Seeding**: Default Admin users are not hardcoded. Initial Admin access must be established via the secure registration flow or database provisioning.
- **Password Policies**: Enforced password length and complexity checks.
- **CORS Configuration**: Restricted access to the frontend origin only.
- **Secure Headers**: Stateless session management.

---

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

**© 2026 IAM System Project**
