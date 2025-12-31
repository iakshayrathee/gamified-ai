# 🎓 AI-Powered Gamified Literacy Learning Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.9-2D3748.svg)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

> **An intelligent, adaptive learning platform for early childhood literacy education (Nursery, LKG, UKG) featuring AI-powered personalization, 10 interactive game templates, and comprehensive multi-role dashboards.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [AI Capabilities](#ai-capabilities)
- [Game Templates](#game-templates)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

The AI-Powered Gamified Literacy Learning Platform is a comprehensive educational solution designed to revolutionize early childhood literacy education. Built with cutting-edge AI technology and modern web frameworks, it provides personalized, adaptive learning experiences for children aged 4-6 years.

### Problem Statement

Traditional literacy education often follows a one-size-fits-all approach, failing to adapt to individual learning paces and styles. This platform addresses this by:

- **Personalizing** learning paths based on real-time performance analysis
- **Detecting** confusion patterns (e.g., b/d, p/q reversals) early
- **Adapting** difficulty dynamically to maintain optimal challenge levels
- **Engaging** children through gamification and interactive content
- **Empowering** educators with actionable insights and analytics

### Solution Highlights

- ✅ **85% Complete** - Core features fully functional
- 🤖 **AI-Driven** - Google Gemini integration for adaptive learning
- 🎮 **10 Game Templates** - Diverse, research-backed learning activities
- 📊 **Real-time Analytics** - Comprehensive dashboards for educators and parents
- 🔒 **Secure** - Multi-role authentication with JWT and bcrypt
- 📈 **Scalable** - Designed for 50,000+ concurrent users

---

## 🚀 Key Features

### For Children
- 🎯 **Adaptive Learning**: AI adjusts difficulty based on performance
- 🎮 **Interactive Games**: 10 engaging game templates covering all literacy skills
- ⭐ **Gamification**: Earn stars, coins, and badges for achievements
- 🗺️ **Skill Map**: Visual progress tracking with unlockable skills
- 🎨 **Child-Friendly UI**: Large buttons, vibrant colors, animations

### For Educators
- 📊 **Performance Dashboards**: Real-time student progress tracking
- 🔍 **AI Insights**: Automated detection of learning gaps and confusion patterns
- 📈 **Progress Reports**: Detailed analytics with exportable reports
- 👥 **Class Management**: Monitor multiple students simultaneously
- 🎯 **Intervention Suggestions**: AI-generated recommendations for struggling students

### For Administrators
- 📤 **Bulk Upload**: Import questions via CSV/JSON
- 📄 **Document Processing**: Extract questions from PDF/DOCX (upcoming)
- 👤 **User Management**: Create and manage users across all roles
- 📊 **Platform Analytics**: System-wide usage and performance metrics
- ⚙️ **Configuration**: Customize mastery criteria and game settings

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 14 (App Router) + React 18 + TypeScript + Tailwind │
├─────────────────────────────────────────────────────────────┤
│                      API Layer (Next.js)                     │
│        RESTful APIs + NextAuth.js + Custom Middleware        │
├─────────────────────────────────────────────────────────────┤
│                      Backend Services                        │
│   Node.js + Express + Prisma ORM + AI Services (Gemini)     │
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                             │
│  PostgreSQL (NeonDB) + AWS S3 (Assets) + Redis (Cache)      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Child Plays Quiz → Attempt Recorded → AI Analyzes Performance
                                              ↓
                                    Updates Skill Progress
                                              ↓
                                    Adjusts Next Question Difficulty
                                              ↓
                                    Generates Recommendations
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | React framework with App Router |
| **React** | 18+ | UI library |
| **TypeScript** | 5.9.3 | Type safety |
| **Tailwind CSS** | Latest | Utility-first styling |
| **Framer Motion** | Latest | Animations |
| **shadcn/ui** | Latest | Component library |
| **Recharts** | Latest | Data visualization |
| **@dnd-kit** | Latest | Drag-and-drop interactions |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 5.2.1 | Web framework |
| **Prisma** | 6.9.0 | ORM and database toolkit |
| **PostgreSQL** | Latest | Primary database (NeonDB) |
| **bcryptjs** | 3.0.3 | Password hashing |
| **jsonwebtoken** | 9.0.3 | JWT authentication |

### AI & Machine Learning
| Technology | Version | Purpose |
|------------|---------|---------|
| **Google Gemini AI** | 0.24.1 | Question generation, analysis |
| **Custom Adaptive Engine** | - | Difficulty adjustment, mastery detection |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **NeonDB** | Serverless PostgreSQL hosting |
| **AWS S3** | Asset storage (images, audio, documents) |
| **Vercel** | Frontend hosting (recommended) |
| **Railway/Render** | Backend hosting options |

---

## 🎯 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (NeonDB account recommended)
- **Google Gemini API Key** (free tier available)
- **AWS Account** (for S3 storage)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-tool
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Application
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

#### 4. Database Setup

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data
npm run seed
```

This creates:
- **1 Admin** (admin@literacy.com / admin123)
- **3 Teachers** (teacher@literacy.com / teacher123)
- **10 Children** (PINs: 1234, 5678, 9012, etc.)
- **24 Skill Domains** (A-X)
- **100+ Micro-skills**
- **500+ Sample Questions**

#### 5. Run the Application

**Backend** (Terminal 1):
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### First Login

Visit `http://localhost:3000` and log in:

- **Admin**: admin@literacy.com / admin123
- **Teacher**: teacher@literacy.com / teacher123
- **Child**: Use PIN 1234 (Emma Wilson)

---

## 📁 Project Structure

```
ai-tool/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (9 tables)
│   │   ├── seed.ts                # Database seeding script
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── index.ts               # Express server entry point
│   │   ├── lib/
│   │   │   ├── db.ts              # Prisma client instance
│   │   │   ├── adaptive-engine.ts # AI adaptive learning logic
│   │   │   ├── ai-question-generator.ts # Gemini question generation
│   │   │   ├── auth.ts            # JWT authentication
│   │   │   ├── s3-service.ts      # AWS S3 integration
│   │   │   └── upload-middleware.ts # File upload handling
│   │   ├── middleware/
│   │   │   └── auth-middleware.ts # JWT verification middleware
│   │   └── utils/                 # Utility functions
│   ├── scripts/
│   │   └── generate-questions.ts  # Bulk question generation
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (child)/               # Child-facing routes
│   │   │   ├── domains/           # Domain selection
│   │   │   ├── home/              # Child home page
│   │   │   └── skill-map/         # Skill progression map
│   │   ├── (teacher)/             # Teacher dashboard routes
│   │   │   └── dashboard/         # Teacher analytics
│   │   ├── (admin)/               # Admin panel routes
│   │   │   └── panel/             # Admin interface
│   │   ├── login/                 # Authentication pages
│   │   │   ├── child/             # Child PIN login
│   │   │   ├── teacher/           # Teacher email/password
│   │   │   └── admin/             # Admin login
│   │   ├── play/                  # Quiz gameplay
│   │   │   └── [skillId]/         # Dynamic skill quiz
│   │   └── api/                   # API routes (Next.js)
│   │       ├── auth/              # Authentication endpoints
│   │       ├── skills/            # Skill management
│   │       ├── attempts/          # Attempt tracking
│   │       └── progress/          # Progress tracking
│   ├── components/
│   │   ├── game-templates/        # 10 game templates
│   │   │   ├── TapToSelectGame.tsx
│   │   │   ├── DragAndDropGame.tsx
│   │   │   ├── AudioToLetterGame.tsx
│   │   │   ├── MemoryCardGame.tsx
│   │   │   └── ... (6 more)
│   │   ├── feedback/              # Animations & celebrations
│   │   ├── dashboard/             # Dashboard components
│   │   └── ui/                    # Reusable UI components
│   ├── lib/
│   │   ├── api-client.ts          # API wrapper
│   │   ├── auth.ts                # Client-side auth
│   │   └── types/                 # TypeScript types
│   └── package.json
│
├── README.md                      # This file
├── FINAL_SUMMARY.md               # Project completion summary
└── AI_QUESTION_GENERATION.md      # AI setup guide
```

---

## 🤖 AI Capabilities

### 1. Adaptive Difficulty Engine

**Algorithm**: Real-time performance analysis

```typescript
// Adjusts difficulty based on:
- Accuracy (last 5 attempts)
- Response time (average)
- Error patterns (confusion detection)
- Mastery criteria (80% accuracy, <4s time)
```

**Features**:
- ✅ Dynamic difficulty adjustment (Levels 1-3)
- ✅ Confusion pattern detection (b/d, p/q, m/n, u/n)
- ✅ Mastery detection and skill unlocking
- ✅ Personalized next-question selection

### 2. AI Question Generation

**Model**: Google Gemini Pro

**Capabilities**:
- Generate 15 questions per skill automatically
- Create age-appropriate content for 4-6 year olds
- Include confusing distractors for advanced levels
- Maintain educational quality and diversity

**Usage**:
```bash
cd backend
npm run generate-questions
```

### 3. Performance Analysis (Upcoming)

- **AI-Generated Reports**: Automated insights on student progress
- **Intervention Suggestions**: Personalized recommendations for educators
- **Trend Analysis**: Identify learning patterns over time

### 4. Document Processing (Upcoming)

- **PDF/DOCX Extraction**: Extract questions from uploaded documents
- **Image Recognition**: OCR for text in images
- **Structured Output**: Automatically format questions for database

---

## 🎮 Game Templates

### 1. **Tap to Select Game**
- **Skill**: Letter/word recognition
- **Mechanic**: Multiple choice with tap/click
- **Features**: Audio prompts, hints, animations

### 2. **Drag and Drop Game**
- **Skill**: Matching, categorization
- **Mechanic**: Drag items to correct targets
- **Features**: Visual feedback, snap-to-grid

### 3. **Sorting Game**
- **Skill**: Classification, grouping
- **Mechanic**: Sort items into categories
- **Features**: Multiple bins, validation

### 4. **Picture to Word Game**
- **Skill**: Vocabulary, word-image association
- **Mechanic**: Match images to words
- **Features**: Visual learning, immediate feedback

### 5. **Audio to Letter Game**
- **Skill**: Phonics, sound recognition
- **Mechanic**: Hear sound, select letter
- **Features**: Audio playback, repeat option

### 6. **Puzzle Join Game**
- **Skill**: Onset-rime blending
- **Mechanic**: Join word parts to form words
- **Features**: Visual word building, celebration

### 7. **Memory Card Game**
- **Skill**: Memory, matching
- **Mechanic**: Flip cards to find pairs
- **Features**: Card flip animations, score tracking

### 8. **Find the Word Game**
- **Skill**: Reading comprehension
- **Mechanic**: Highlight word in sentence
- **Features**: Context clues, visual highlighting

### 9. **Sequencing Game**
- **Skill**: Order, logic
- **Mechanic**: Arrange items in correct order
- **Features**: Drag reordering, validation

### 10. **Odd One Out Game**
- **Skill**: Critical thinking, categorization
- **Mechanic**: Identify the different item
- **Features**: Visual discrimination, reasoning

---

## 👥 User Roles

### Children
**Authentication**: 4-digit PIN (no email required)

**Capabilities**:
- Play adaptive quizzes across all domains
- Track progress on skill map
- Earn rewards (stars, coins, badges)
- View personal achievements

**UI Design**:
- Large touch targets (60px+)
- Vibrant colors and animations
- Simple navigation
- Celebration effects

### Teachers (Special Educators)
**Authentication**: Email + Password

**Capabilities**:
- View student dashboards
- Monitor real-time progress
- Access AI-generated insights
- Export detailed reports
- Assign homework and interventions

**Dashboard Features**:
- Student list with at-risk highlighting
- Performance charts (accuracy, time, mastery)
- Recent activity feed
- Confusion pattern alerts

### Administrators
**Authentication**: Email + Password (elevated privileges)

**Capabilities**:
- Manage all users (create, edit, delete)
- Upload questions in bulk (CSV/JSON)
- Configure system settings
- View platform-wide analytics
- Process documents (PDF/DOCX) - upcoming

---

## 📡 API Documentation

### Authentication

#### POST `/api/auth/login`
**Body**:
```json
{
  "email": "teacher@literacy.com",
  "password": "teacher123"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "role": "TEACHER"
  }
}
```

#### POST `/api/auth/login/child`
**Body**:
```json
{
  "pin": "1234"
}
```

### Skills & Questions

#### GET `/api/skills/:skillId/questions`
**Query**: `?difficulty=1&limit=10`
**Response**:
```json
{
  "questions": [
    {
      "id": "q_123",
      "promptText": "Find the letter A",
      "correctAnswer": "A",
      "distractors": ["B", "C", "D"],
      "difficultyLevel": 1
    }
  ]
}
```

### Attempts

#### POST `/api/attempts`
**Body**:
```json
{
  "childId": "child_123",
  "questionId": "q_123",
  "microSkillId": "skill_123",
  "isCorrect": true,
  "responseTimeSeconds": 3.5,
  "hintUsed": false
}
```
**Response**:
```json
{
  "attemptId": "attempt_123",
  "nextQuestion": { ... },
  "skillProgress": {
    "masteryStatus": "IN_PROGRESS",
    "accuracyPercentage": 75.5
  }
}
```

### Progress

#### GET `/api/progress/:childId`
**Response**:
```json
{
  "overallProgress": {
    "skillsMastered": 15,
    "skillsInProgress": 8,
    "totalAttempts": 450,
    "overallAccuracy": 82.3
  },
  "domainProgress": [ ... ],
  "recentAchievements": [ ... ]
}
```

---

## 🗄️ Database Schema

### Core Tables

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  passwordHash  String?
  role          UserRole // CHILD, TEACHER, ADMIN
  teacherId     String?
  createdAt     DateTime @default(now())
}
```

#### SkillDomain
```prisma
model SkillDomain {
  id          String   @id @default(cuid())
  code        String   @unique // A, B, C...X
  name        String
  description String?
  order       Int      @unique
}
```

#### MicroSkill
```prisma
model MicroSkill {
  id                String       @id @default(cuid())
  code              String       @unique // A.1, A.2, B.1
  name              String
  domainId          String
  gameTemplate      GameTemplate
  prerequisiteSkills Json        @default("[]")
  masteryCriteria   Json
}
```

#### Question
```prisma
model Question {
  id                      String   @id @default(cuid())
  microSkillId            String
  difficultyLevel         Int      // 1, 2, or 3
  promptText              String
  correctAnswer           String
  distractors             Json     // Array of strings
  hasConfusingDistractors Boolean
  assetUrls               Json
}
```

#### Attempt
```prisma
model Attempt {
  id                    String    @id @default(cuid())
  childId               String
  questionId            String
  microSkillId          String
  isCorrect             Boolean
  responseTimeSeconds   Float
  hintUsed              Boolean
  errorType             ErrorType
  createdAt             DateTime  @default(now())
}
```

#### SkillProgress
```prisma
model SkillProgress {
  id                  String        @id @default(cuid())
  childId             String
  microSkillId        String
  masteryStatus       MasteryStatus // NOT_STARTED, IN_PROGRESS, MASTERED
  accuracyPercentage  Float
  avgResponseTime     Float
  totalAttempts       Int
}
```

**Total Tables**: 9 (User, SkillDomain, MicroSkill, Question, Attempt, SkillProgress, Achievement, Session, and upcoming PerformanceReport)

---

## 🚀 Deployment

### Production Checklist

- [ ] Update environment variables for production
- [ ] Change default credentials
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting
- [ ] Set up monitoring (New Relic, Datadog)
- [ ] Configure error logging (Sentry)
- [ ] Run security audit
- [ ] Load testing (50,000+ users)

### Recommended Hosting

**Frontend**: Vercel (automatic Next.js optimization)
**Backend**: Railway or Render (Node.js support)
**Database**: NeonDB (serverless PostgreSQL)
**Storage**: AWS S3 + CloudFront CDN

### Environment Variables (Production)

```env
# Database
DATABASE_URL="postgresql://..."

# Security
JWT_SECRET="<generate-strong-secret>"
NEXTAUTH_SECRET="<generate-strong-secret>"

# AI
GEMINI_API_KEY="<production-key>"

# AWS
AWS_ACCESS_KEY_ID="<production-key>"
AWS_SECRET_ACCESS_KEY="<production-secret>"
AWS_S3_BUCKET="<production-bucket>"

# Application
NODE_ENV="production"
FRONTEND_URL="https://yourdomain.com"
```

---

## 💻 Development

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier (automatic on save)
- **Naming**: camelCase for variables, PascalCase for components

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 🧪 Testing

### Unit Tests (Upcoming)

```bash
cd backend
npm test
```

### Integration Tests (Upcoming)

```bash
cd frontend
npm run test:integration
```

### E2E Tests (Upcoming)

```bash
npm run test:e2e
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## 📄 License

ISC License - see LICENSE file for details

---

## 📞 Support

For questions or issues:
- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@literacyplatform.com

---

## 🎯 Roadmap

### Current (v1.0) - 85% Complete
- [x] Core adaptive engine
- [x] 10 game templates
- [x] Multi-role authentication
- [x] Basic dashboards
- [x] AI question generation

### Upcoming (v1.1) - Q1 2025
- [ ] Student performance review system
- [ ] AI-powered recommendations
- [ ] PDF/DOCX document processing
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

### Future (v2.0) - Q2 2025
- [ ] Multi-language support
- [ ] Parent portal
- [ ] Offline mode
- [ ] Advanced gamification
- [ ] Integration with LMS platforms

---

## 🙏 Acknowledgments

- **Google Gemini AI** for question generation
- **Prisma** for excellent ORM
- **Next.js** team for the amazing framework
- **shadcn/ui** for beautiful components
- **NeonDB** for serverless PostgreSQL

---

**Built with ❤️ for early childhood education**
