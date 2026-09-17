# UniTrade — Backend API

A university-exclusive student marketplace. This repo contains the first
backend module of the full project: the **Listing** entity, with complete
CRUD operations and image upload support.

See [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) for the full project
research/planning document (roles, features, UI plan, etc.).

## Why `Listing`?
Listings (items posted for sale/trade) are the core resource of UniTrade —
almost every other feature (browsing, search, categories, offers) revolves
around them, so it's the natural first module to build.

## Tech Stack
- Node.js
- Express
- MongoDB + Mongoose
- Multer (image uploads)
- dotenv, nodemon

## Project Structure
```
unitrade/
├── index.js
├── config/
│   └── db.js
├── models/
│   └── Listing.js
├── controllers/
│   └── listingController.js
├── routes/
│   └── listingRoutes.js
├── middleware/
│   └── multer-middleware.js
├── utils/
│   └── delete-uploaded-file.js
├── uploads/
│   └── listings/
└── docs/
    └── PROJECT_PLAN.md
```

## Setup & Run Locally

1. Clone the repo and install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your own MongoDB connection
   string:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   ```
3. Start the server (auto-restarts on changes via nodemon):
   ```
   npm start
   ```
4. The API will be running at `http://localhost:5000/api/v1/listings`.

## Listing Model Fields
| Field         | Type    | Notes                                                              |
|---------------|---------|---------------------------------------------------------------------|
| `title`       | String  | required, max 80 chars                                             |
| `description` | String  | required, max 1000 chars                                           |
| `price`       | Number  | required, must be >= 0                                             |
| `category`    | String  | required, one of: books, electronics, furniture, clothing, other   |
| `condition`   | String  | required, one of: new, like-new, used, fair                        |
| `sellerName`  | String  | required                                                            |
| `imageUrl`    | String  | filename of the uploaded image, set automatically                  |
| `status`      | String  | one of: available, reserved, sold — defaults to `available`        |
| `createdAt` / `updatedAt` | Date | added automatically by Mongoose timestamps            |

## API Routes

| Method | Route                     | Description                          | Body / Notes |
|--------|----------------------------|---------------------------------------|---------------|
| GET    | `/api/v1/listings`         | Get all listings                     | Optional query filters: `?category=books`, `?status=available` |
| GET    | `/api/v1/listings/:id`     | Get a single listing by ID           | — |
| POST   | `/api/v1/listings`         | Create a new listing                 | `multipart/form-data` — text fields + `imageUrl` file |
| PATCH  | `/api/v1/listings/:id`     | Update a listing (optionally its image) | `multipart/form-data` |
| DELETE | `/api/v1/listings/:id`     | Delete a listing                     | Also deletes its uploaded image from disk |

Uploaded images are served statically at:
```
http://localhost:5000/api/v1/uploads/listings/<filename>
```

## Example Usage (Postman)

**Create a listing** — `POST /api/v1/listings`, Body → `form-data`:

| Key         | Type | Value                          |
|-------------|------|---------------------------------|
| title       | Text | Calculus Textbook 3rd Edition   |
| description | Text | Barely used, no highlights      |
| price       | Text | 250                              |
| category    | Text | books                            |
| condition   | Text | like-new                         |
| sellerName  | Text | Abdelrahman                      |
| imageUrl    | File | (select an image)                |

Response (`201 Created`):
```json
{
  "status": "success",
  "message": "Listing created successfully",
  "data": {
    "listing": {
      "_id": "...",
      "title": "Calculus Textbook 3rd Edition",
      "price": 250,
      "category": "books",
      "condition": "like-new",
      "sellerName": "Abdelrahman",
      "imageUrl": "listing-1755000000000.jpg",
      "status": "available",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Get all listings, filtered** — `GET /api/v1/listings?category=books`

**Get one listing** — `GET /api/v1/listings/<id>`

**Update a listing (e.g. mark as sold)** — `PATCH /api/v1/listings/<id>`,
Body → `form-data`, key `status` = `sold`

**Delete a listing** — `DELETE /api/v1/listings/<id>`

## Features Implemented So Far
- ✅ Mongoose schema with validation (required fields, enums, min/max)
- ✅ Full CRUD via Express (MVC pattern: routes → controller → model)
- ✅ `async/await` with `try/catch` error handling on every route
- ✅ Multer image upload (5 MB limit, images only, validated with a file filter)
- ✅ Old images are deleted when a listing is updated with a new image or removed
- ✅ Orphaned uploads are cleaned up automatically if a create/update request fails validation
- ✅ Static file serving for uploaded images
- ✅ Query filtering (`category`, `status`)

## Next Steps (per project plan)
- `User` module with authentication (register/login, JWT)
- Authorization: only a listing's owner (or an Admin) can update/delete it
- Frontend built against this API following the existing Figma design
