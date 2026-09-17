# Project Plan — UniTrade

## Project Name
**UniTrade** — A University-Exclusive Student Marketplace

## Project Description
UniTrade is a web application that lets university students buy, sell, and
trade items exclusively with other students at their own university. It
solves the problem of students having no safe, trusted, campus-specific
place to sell things they no longer need (textbooks, electronics,
furniture, clothing, etc.) or find cheap second-hand items from people they
can actually trust — fellow students.

- **Problem it solves:** Off-campus marketplaces (Facebook Marketplace,
  OLX, etc.) mix students with strangers from anywhere, which feels unsafe
  and untrustworthy for on-campus exchanges. UniTrade restricts the
  marketplace to verified students of the same university.
- **Target users:** University students who want to buy or sell
  second-hand items on campus, and university staff/admins who moderate
  the platform.
- **Main purpose:** Provide a simple, trusted, university-scoped platform
  for posting listings, browsing items by category, and arranging
  exchanges between students.

This project was originally designed as a UI/UX case study (HCI
coursework, Figma prototype) and is now being implemented as a real
full-stack web application for the Web Development course.

## User Roles & Permissions

| Role    | Permissions                                                                 |
|---------|-------------------------------------------------------------------------------|
| Admin   | Manage all users, manage/remove any listing, manage categories, view reports |
| Student | Register/login, create/edit/delete their own listings, browse & search all listings, upload listing images, view listing details, manage their own profile |

## Main Features

### Authentication
- Register (university students only)
- Login
- Logout
- (Planned) Password reset

### Authorization
- Role-based access control (Admin vs Student)
- Only the owner of a listing (or an Admin) can edit/delete it
- Protected routes for creating/managing listings (must be logged in)
- Admin-only routes for managing users and moderating listings

### CRUD Features

**Listings** (the core resource — implemented first, see Task 2/3)
- Create: post a new listing with title, description, price, category,
  condition, and an image
- Read: view all listings (with filtering/search by category), view a
  single listing's details
- Update: edit a listing's details or replace its image
- Delete: remove a listing (owner or admin)

**Users** (planned next module)
- Create: register a new student account
- Read: view own profile / admin view of all users
- Update: edit profile info, upload profile picture
- Delete: admin can deactivate/remove a user

**Categories** (planned, could be a simple enum or its own collection)
- Predefined categories: Books, Electronics, Furniture, Clothing, Other

### Image/File Upload Features

| Upload             | Allowed types    | Max size | Uploaded by       |
|---------------------|------------------|----------|--------------------|
| Listing image        | JPG, PNG, WEBP   | 5 MB     | Listing owner (student) |
| User profile picture | JPG, PNG         | 2 MB     | The user themselves |

## UI Design
Existing Figma wireframes and design system (11 screens, design tokens,
components) from the HCI coursework are being reused as the visual
reference for this build. *(Figma link: add your project's share link
here.)*

Key pages planned:
- Login / Register
- Home / Browse Listings (grid with search + category filter)
- Listing Details page
- Add/Edit Listing form
- My Listings (student dashboard)
- Profile page
- Admin dashboard (manage users & listings)

## Build Order (mirrors the course's staged tasks)
1. ✅ Planning (this document)
2. ✅ First module: `Listing` entity — Mongoose model + full CRUD REST API
3. ✅ Enhance `Listing` module with Multer image upload
4. 🔜 `User` module with authentication (register/login, JWT) and
   authorization (role-based, ownership checks)
5. 🔜 Frontend built against this API, following the existing Figma design
