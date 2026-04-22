# Instagram-like Social Media App with Advanced Admin Panel

## Current State

Your backend (`social_mini`) is a basic Express + MongoDB app with:
- **Auth**: Register/Login with JWT (cookie-based)
- **Posts**: Create post with image upload (multer, stored as Buffer)
- **Models**: User (username, password), Post (caption, image, user ref)
- **Middleware**: JWT auth middleware

This needs significant expansion for a full Instagram-like experience.

---

## Proposed Architecture

```
d:\Sudhir\NODE\social_mini\
├── server.js                    # Backend entry
├── src/                         # Backend source
│   ├── app.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── service/
│   └── db/
└── client/                      # NEW - React Vite Frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── layouts/
    │   ├── store/
    │   ├── api/
    │   ├── hooks/
    │   └── assets/
    └── vite.config.js
```

---

## Phase 1: Backend API Expansion

### 1.1 Enhanced Models

#### [MODIFY] [user.model.js](file:///d:/Sudhir/NODE/social_mini/src/models/user.model.js)
Expand the user schema to include:
- `email` (String, unique)
- `fullName` (String)
- `bio` (String, max 150)
- `avatar` (String — URL/base64)
- `followers` (Array of ObjectId refs)
- `following` (Array of ObjectId refs)
- `isPrivate` (Boolean, default false)
- `role` (String, enum: `user`, `admin`, default `user`)
- `isVerified` (Boolean)
- `isBanned` (Boolean, default false)
- `lastActive` (Date)
- `createdAt`, `updatedAt` (timestamps: true)

#### [MODIFY] [post.model.js](file:///d:/Sudhir/NODE/social_mini/src/models/post.model.js)
Expand the post schema to include:
- `likes` (Array of ObjectId refs to users)
- `comments` (Array of embedded subdocuments: `{ user, text, createdAt }`)
- `tags` (Array of Strings)
- `location` (String)
- `isHidden` (Boolean — for admin moderation)
- `createdAt`, `updatedAt` (timestamps: true)

#### [NEW] story.model.js
- `user` (ObjectId ref)
- `image` (String)
- `viewers` (Array of ObjectId refs)
- `expiresAt` (Date — 24 hours from creation)
- `createdAt`

#### [NEW] notification.model.js
- `recipient` (ObjectId ref)
- `sender` (ObjectId ref)
- `type` (enum: `like`, `comment`, `follow`, `mention`)
- `post` (ObjectId ref, optional)
- `message` (String)
- `isRead` (Boolean)
- `createdAt`

#### [NEW] report.model.js
- `reporter` (ObjectId ref)
- `reportedUser` (ObjectId ref, optional)
- `reportedPost` (ObjectId ref, optional)
- `reason` (String)
- `status` (enum: `pending`, `reviewed`, `resolved`)
- `adminNote` (String)
- `createdAt`

---

### 1.2 New API Routes & Controllers

#### [MODIFY] Auth Routes — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register (expanded fields) |
| POST | `/login` | Login |
| POST | `/logout` | Clear cookie |
| GET | `/me` | Get current user profile |

#### [NEW] User Routes — `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:id` | Get user profile |
| PUT | `/edit` | Update own profile |
| PUT | `/avatar` | Upload avatar |
| POST | `/:id/follow` | Follow/unfollow toggle |
| GET | `/:id/followers` | Get followers list |
| GET | `/:id/following` | Get following list |
| GET | `/search?q=` | Search users by username/name |
| GET | `/suggestions` | Suggested users to follow |

#### [MODIFY] Post Routes — `/api/posts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create post (existing, enhanced) |
| GET | `/feed` | Get feed (posts from followed users) |
| GET | `/explore` | Explore page (trending/all posts) |
| GET | `/:id` | Get single post |
| DELETE | `/:id` | Delete own post |
| POST | `/:id/like` | Like/unlike toggle |
| POST | `/:id/comment` | Add comment |
| DELETE | `/:id/comment/:commentId` | Delete comment |
| GET | `/user/:userId` | Get posts by user |

#### [NEW] Story Routes — `/api/stories`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create story |
| GET | `/feed` | Get stories from followed users |
| POST | `/:id/view` | Mark story as viewed |
| DELETE | `/:id` | Delete own story |

#### [NEW] Notification Routes — `/api/notifications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all notifications |
| PUT | `/read-all` | Mark all as read |
| GET | `/unread-count` | Get unread count |

#### [NEW] Admin Routes — `/api/admin`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Stats (total users, posts, etc.) |
| GET | `/users` | List all users (paginated) |
| PUT | `/users/:id/ban` | Ban/unban user |
| PUT | `/users/:id/role` | Change user role |
| DELETE | `/users/:id` | Delete user |
| GET | `/posts` | List all posts (paginated, filterable) |
| PUT | `/posts/:id/hide` | Hide/unhide post |
| DELETE | `/posts/:id` | Delete any post |
| GET | `/reports` | List reports |
| PUT | `/reports/:id` | Update report status |
| GET | `/analytics` | User growth, post activity charts |

#### [NEW] AI Routes — `/api/ai`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/caption` | AI-generated caption for image |
| POST | `/hashtags` | AI-suggested hashtags |

---

### 1.3 New Middlewares

#### [NEW] adminMiddleware.js
- Checks `res.user.role === 'admin'`

#### [MODIFY] [authmiddleware.js](file:///d:/Sudhir/NODE/social_mini/src/middlewares/authmiddleware.js)
- Also attach user to `req.user` (currently on `res.user` — should be `req.user`)
- Check for banned users

---

## Phase 2: React Vite Frontend

### 2.1 Project Setup

Create a Vite React app inside `d:\Sudhir\NODE\social_mini\client\` with:
- **React Router v7** for routing
- **Zustand** for state management
- **Axios** for API calls (with cookie credentials)
- **React Icons** for iconography
- **date-fns** for date formatting
- **Framer Motion** for animations

### 2.2 Design System

The UI will follow a **premium dark-mode Instagram aesthetic**:

| Token | Value |
|-------|-------|
| `--bg-primary` | `#000000` |
| `--bg-secondary` | `#121212` |
| `--bg-card` | `#1a1a2e` |
| `--bg-glass` | `rgba(255,255,255,0.05)` |
| `--accent` | `#e1306c` (Instagram pink) |
| `--accent-gradient` | `linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)` |
| `--text-primary` | `#fafafa` |
| `--text-secondary` | `#a8a8a8` |
| `--border` | `rgba(255,255,255,0.1)` |
| Font | Inter (Google Fonts) |

Key design elements:
- **Glassmorphism** cards with `backdrop-filter: blur()`
- **Instagram gradient** on logos, story rings, buttons
- **Smooth micro-animations** on hover, like, follow actions
- **Heart burst animation** on double-tap like
- **Skeleton loading** states
- **Responsive**: Mobile-first with desktop sidebar layout

### 2.3 Page Structure

#### Public Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password login with animated background |
| Register | `/register` | Multi-step signup form |

#### User Pages (Protected)
| Page | Route | Description |
|------|-------|-------------|
| Feed | `/` | Instagram-style feed with stories bar at top |
| Explore | `/explore` | Grid of trending posts with search |
| Profile | `/profile/:id` | User profile with post grid, followers/following counts |
| Edit Profile | `/profile/edit` | Edit bio, avatar, name |
| Post Detail | `/post/:id` | Full post view with comments |
| Create Post | `/create` | Upload image, add caption, AI caption/hashtag suggestions |
| Notifications | `/notifications` | Activity feed |
| Search | `/search` | Search users |

#### Admin Pages (Protected + Admin Role)
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Analytics overview with charts |
| User Management | `/admin/users` | Table of all users, ban/delete/role actions |
| Post Management | `/admin/posts` | Table of all posts, hide/delete actions |
| Reports | `/admin/reports` | Report queue with review/resolve actions |
| AI Settings | `/admin/ai` | AI service config & testing |

### 2.4 Key Components

```
components/
├── layout/
│   ├── Sidebar.jsx          # Desktop nav sidebar (Instagram-style)
│   ├── MobileNav.jsx        # Bottom tab bar for mobile
│   ├── AdminSidebar.jsx     # Admin panel sidebar
│   └── TopBar.jsx           # Mobile top bar
├── feed/
│   ├── PostCard.jsx         # Individual post in feed
│   ├── StoryBar.jsx         # Horizontal scrolling stories
│   ├── StoryCircle.jsx      # Single story avatar ring
│   └── CommentSection.jsx   # Comments list + input
├── profile/
│   ├── ProfileHeader.jsx    # Avatar, bio, stats, follow button
│   ├── PostGrid.jsx         # 3-column post grid
│   └── EditProfileModal.jsx # Edit profile form
├── post/
│   ├── CreatePostModal.jsx  # Post creation flow
│   ├── LikeButton.jsx       # Animated heart button
│   └── PostActions.jsx      # Like, comment, share icons
├── admin/
│   ├── StatCard.jsx         # Dashboard metric card
│   ├── UserTable.jsx        # Users data table
│   ├── PostTable.jsx        # Posts data table
│   ├── ReportCard.jsx       # Report review card
│   └── AnalyticsChart.jsx   # Chart component (Canvas-based)
├── ui/
│   ├── Button.jsx           # Styled button variants
│   ├── Input.jsx            # Styled input fields
│   ├── Modal.jsx            # Glassmorphism modal
│   ├── Skeleton.jsx         # Loading skeleton
│   ├── Avatar.jsx           # User avatar component
│   └── Toast.jsx            # Notification toasts
└── common/
    ├── ProtectedRoute.jsx   # Auth guard
    ├── AdminRoute.jsx       # Admin guard
    └── Loader.jsx           # Full page loader
```

---

## User Review Required

> [!IMPORTANT]
> This is a **very large project** (~50+ files). I'll build it incrementally — backend first, then frontend. The full implementation will take multiple steps.

> [!WARNING]
> Your current `.env` contains API keys. These are visible in the conversation. Consider rotating them after this session.

> [!IMPORTANT]
> The current auth middleware stores user on `res.user` instead of `req.user`. This will be fixed during implementation.

## Open Questions

1. **Image Storage**: Currently images are stored as Buffers in MongoDB. Do you want to keep this (simpler) or switch to **Cloudinary/local file storage** with URL references (more scalable)?

2. **Real-time features**: Do you want **Socket.io** for real-time notifications/chat, or is polling sufficient for now?

3. **Email field**: Should registration require an email address, or keep it username-only?

4. **Seed data**: Would you like me to create a seed script with sample users/posts for testing the admin panel?

---

## Verification Plan

### Automated Tests
- Start backend with `node server.js` and test all API endpoints
- Start frontend with `npm run dev` in `client/` and verify all pages render
- Test auth flow (register → login → create post → like → comment → follow)
- Test admin flow (login as admin → dashboard → manage users/posts)

### Manual Verification
- Browser walkthrough of all pages with screenshots
- Mobile responsive testing
- Admin panel CRUD operations
