# Research Progress Management System

A comprehensive web application for managing academic research projects, built with modern technologies.

## Features

### Project Management
- **Project Creation & Configuration**: Create research projects with detailed descriptions, objectives, and timelines
- **Team Assignment**: Assign students and lecturers to specific projects with role-based permissions
- **Status Tracking**: Monitor project progress through various stages (Planning, In Progress, Review, Completed)
- **Project Archiving**: Archive completed projects while maintaining access to historical data
- **Project Analytics**: Visual progress tracking with charts and completion statistics

### Task Management
- Create, assign, and track tasks
- Kanban board and list views
- Task priorities and due dates
- Rich text submission for students
- Comments and file attachments

### Document Management
- Upload and organize documents
- Document categorization and access control
- Public library for shared resources
- Document statistics and analytics

### Real-time Features
- WebSocket notifications
- Live activity tracking
- Connection status indicator

### Analytics
- Project progress visualization
- Task completion statistics
- Document upload trends
- User activity reports

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- React Query for state management
- Socket.io for real-time features

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Socket.io for WebSocket

### Infrastructure
- Cloudinary for file storage
- Railway/Render for backend hosting
- Vercel for frontend hosting
- Supabase for database hosting

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd research-progress-system
```

2. Setup Backend:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and Cloudinary credentials
# See ENVIRONMENT_VARIABLES.md for detailed documentation
npx prisma db push
npx prisma db seed
npm run dev
```

3. Setup Frontend:
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
# See ENVIRONMENT_VARIABLES.md for detailed documentation
npm run dev
```

### Environment Variables

None - Still Working On It

### User Roles

**Administrator:**
- Full system access
- Manage all projects, tasks, and documents
- User management
- System-wide analytics

**Lecturer:**
- Manage assigned projects
- Create and assign tasks
- Review student submissions
- Project-specific analytics

**Student:**
- View assigned projects and tasks
- Submit task work with rich text descriptions
- Upload project documents
- Comment on tasks

## API Documentation

### Authentication Endpoints
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
GET    /api/auth/profile      # Get user profile
PUT    /api/auth/profile      # Update user profile
```

### Project Management
```
GET    /api/projects          # List all projects (filtered by role)
POST   /api/projects          # Create new project
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
PATCH  /api/projects/:id/archive  # Archive/unarchive project
```

### Task Management
```
GET    /api/tasks             # List tasks (with advanced filtering)
POST   /api/tasks             # Create new task
GET    /api/tasks/:id         # Get task details
PUT    /api/tasks/:id         # Update task
DELETE /api/tasks/:id         # Delete task
POST   /api/tasks/:id/submit  # Submit task (student only)
```

### Document Management
```
GET    /api/documents
POST   /api/documents/upload
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/stats
```

### Communication
```
GET    /api/comments?taskId=xxx  # Get task comments
POST   /api/comments            # Create comment
PUT    /api/comments/:id        # Update comment
DELETE /api/comments/:id        # Delete comment
```

### Search & Analytics
```
GET    /api/search?q=keyword   # Global search
GET    /api/analytics/overview # System overview analytics
GET    /api/analytics/projects/:id  # Project-specific analytics
```

## User Roles & Permissions

## Database Schema

The system uses PostgreSQL with 12 main tables:

- **users** - User accounts and profiles
- **projects** - Research projects
- **project_students** - Project membership
- **tasks** - Project tasks
- **task_attachments** - Task file attachments
- **comments** - Task comments
- **documents** - Project documents
- **document_chunks** - AI document chunks (future use)
- **notifications** - System notifications
- **activities** - User activity logs
- **ai_queries** - AI query history (future use)
- **filter_presets** - Saved filter configurations

## Development

### Project Structure
```
research-progress-system/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── controllers/        # Business logic controllers
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Authentication, validation, upload
│   │   ├── services/          # WebSocket and external services
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── prisma/                # Database schema and migrations
│   └── package.json           # Backend dependencies
├── frontend/                   # React application
│   ├── src/
│   │   ├── pages/             # Route components
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Basic UI components
│   │   │   ├── features/      # Feature-specific components
│   │   │   └── layout/        # Layout components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and API client
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper functions
│   └── package.json           # Frontend dependencies
└── docs/                      # Documentation files
```

## License

MIT License