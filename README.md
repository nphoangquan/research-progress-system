# Research Progress Management System - 

A comprehensive web application for managing academic research projects, built with modern technologies and AI-powered document analysis.

## Overview

This system provides a complete solution for academic institutions to manage research projects, track progress, collaborate on tasks, and leverage AI for document analysis. It supports three user roles: Administrators, Lecturers, and Students.

## Key Features

### Project Management
- Create and manage research projects with detailed descriptions
- Assign students to projects with lecturer supervision
- Track project status and progress with visual indicators
- Project timeline and milestone management

### Task Management
- Kanban board for task organization
- Task assignment and priority management
- Due date tracking and deadline notifications
- Task comments and collaboration

### Document Management
- Upload and store research documents (PDF, DOCX)
- Document versioning and approval workflow
- AI-powered document analysis and Q&A
- Document search and categorization

<!-- ### AI-Powered Analysis
- RAG (Retrieval-Augmented Generation) system for document queries
- Intelligent question answering based on uploaded documents
- Document indexing and semantic search
- Feedback system for AI responses -->

### Progress Tracking
- Visual progress charts and analytics
- Project timeline visualization
- Performance metrics and reporting
- Real-time status updates

### Collaboration
- Real-time notifications via WebSocket
- Comment system for tasks and documents
- User activity tracking
- Team collaboration tools

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite**
- **TailwindCSS**
- **React Query**
- **React Router**
- **Socket.io**

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma** ORM with PostgreSQL
- **JWT** for authentication
- **Cloudinary** for file storage
- **Socket.io**

### AI Service
- **Python** with FastAPI
- **LangChain** for AI workflows
- **ChromaDB** for vector storage
- **OpenAI API** for LLM integration
- **PyPDF2** for document processing

### Database
- **PostgreSQL** for relational data
- **ChromaDB** for vector embeddings
- **Prisma** for database management

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd research-progress-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run dev
   ```

<!-- 4. **Setup AI Service**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   cp .env.example .env
   # Configure your environment variables
   python -m uvicorn app.main:app --reload
   ``` -->

<!-- ### Environment Variables

Create `.env` files in each service directory with the following variables:

**Backend (.env)**
```
DATABASE_URL="postgresql://username:password@localhost:5432/research_db"
JWT_SECRET="your-jwt-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

**Frontend (.env)**
```
VITE_API_URL="http://localhost:3000/api"
VITE_WS_URL="http://localhost:3000"
```

**AI Service (.env)**
```
OPENAI_API_KEY="your-openai-api-key"
DATABASE_URL="postgresql://username:password@localhost:5432/research_db"
CHROMA_PERSIST_DIRECTORY="./chroma_data"
``` -->

## Project Structure

```
research-progress-system/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript types
│   │   └── lib/           # Utilities and configs
│   └── package.json
├── ai-service/            # Python AI service
│   ├── app/
│   │   ├── routers/       # FastAPI routers
│   │   ├── services/      # AI services
│   │   └── models/        # Pydantic models
│   └── requirements.txt
└── docker-compose.yml     # Development environment
```

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details

<!-- ### AI Queries
- `POST /api/ai/query` - Ask question about documents
- `POST /api/ai/feedback` - Provide feedback on AI response -->

## User Roles

### Administrator
- Manage all projects and users
- System configuration and settings
- Analytics and reporting

### Lecturer
- Create and manage projects
- Assign tasks to students
- Review and approve documents
- Monitor project progress

### Student
- View assigned projects
- Complete assigned tasks
- Upload research documents
- Ask questions about documents

## Development

<!-- ### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI service tests
cd ai-service
pytest
``` -->

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

<!-- ## License

This project is licensed under the MIT License - see the LICENSE file for details. -->
