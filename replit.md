# ContentScale Agent

## Overview

ContentScale Agent is a full-stack web application designed for AI-powered content generation and SEO optimization. Built with a React frontend and Express.js backend, it features a sophisticated AI agent called "Sofeia Agent" that helps users create optimized content, perform keyword research, and manage SEO campaigns.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom dark theme design system
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for monorepo structure

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **File Processing**: Multer for CSV uploads and file handling

### Database Architecture
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Session Storage**: Database-backed sessions using connect-pg-simple
- **Schema Design**: Comprehensive schema covering users, content, keywords, referrals, achievements, and activity tracking

## Key Components

### Authentication System
- Replit Auth integration with OIDC (OpenID Connect)
- Session-based authentication with secure cookie management
- User profile management with credits system
- Referral system for user acquisition

### Content Generation Engine
- AI-powered content generation with SEO optimization
- Multiple content types support (blog posts, articles, etc.)
- SEO scoring and AI overview potential assessment
- Content status management (draft, published, etc.)

### Keyword Research System
- Integrated keyword research capabilities
- Search volume estimation and difficulty assessment
- AI overview potential analysis
- Keyword clustering and organization

### Referral and Gamification
- Referral code generation and tracking
- Credit-based pricing system
- Achievement system for user engagement
- Activity feed for user actions

### CSV Processing
- Bulk keyword import via CSV upload
- Batch processing capabilities
- Progress tracking for large uploads

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or updating user records
2. **Content Creation**: Users request content generation, which triggers AI processing and database storage
3. **Keyword Research**: Users perform keyword research, results are cached and stored
4. **Referral Processing**: New user signups are tracked through referral codes, credits awarded on conversions
5. **Real-time Updates**: WebSocket connections provide real-time updates for long-running operations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **express-session**: Session management
- **passport**: Authentication middleware
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Comprehensive UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette functionality

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development

## Installation Instructions

Upload contentscale-complete-fixes.tar.gz to your Replit project
Extract the contents, overwriting existing files
Restart your Replit application
Test all functionality with the browser console open (F12) for debugging

## Deployment Strategy

### Development Environment
- Replit-optimized development with hot reload
- PostgreSQL module provisioned automatically
- Environment variables managed through Replit secrets

### Production Build Process
1. Frontend built with Vite to `dist/public`
2. Backend bundled with esbuild to `dist/index.js`
3. Static assets served from Express server
4. Database migrations applied via Drizzle Kit

### Hosting Configuration
- Replit autoscale deployment target
- Port 5000 internally mapped to port 80 externally
- Node.js 20 runtime environment
- PostgreSQL 16 database module

## Security Architecture

### Comprehensive Security System
- **Fingerprint Tracking**: Browser fingerprinting via request headers analysis
- **IP Monitoring**: Real-time IP tracking and blocking capabilities  
- **Rate Limiting**: Intelligent rate limits by action type (content: 10/hour, keywords: 50/hour)
- **Behavioral Analysis**: Pattern detection for suspicious activities
- **Auto-blocking**: Temporary IP/fingerprint blocks for violations
- **Security Dashboard**: Real-time monitoring with threat assessment

### Security Components
- `SecurityService`: Core security logic with fingerprinting and monitoring
- `SecurityMiddleware`: Request-level security enforcement
- `SecurityDashboard`: Admin interface for threat monitoring
- Database tables: `security_events`, `blocked_ips`, `blocked_fingerprints`

### Admin Panel Integration
- Tabbed interface with Settings and Security sections
- Live video preview for YouTube demo management
- Real-time security metrics and event monitoring
- Comprehensive threat analysis and compliance features

## Changelog

- June 27, 2025. Initial setup
- June 27, 2025. Advanced security system with fingerprint tracking and abuse prevention
- June 27, 2025. Custom rocket favicon and tabbed admin panel with security dashboard
- June 27, 2025. Comprehensive SEO optimization with 50+ AI-focused keywords targeting USA, Canada, UK, Australia, New Zealand, Europe for Google AI Overview and AI search engines
- June 27, 2025. UI/UX improvements: replaced FontAwesome with Lucide React icons, enhanced card layouts with 2-column grid, improved spacing and padding for better user experience
- June 27, 2025. Fixed critical UI functionality issues: non-responsive buttons, broken input fields, scrolling problems, and API configuration visibility
- June 27, 2025. API Configuration section relocated to bottom of dashboard page with fully functional save buttons for Anthropic API and PayPal configuration
- June 27, 2025. System designed to work without OpenAI or Answer Socrates APIs - AI agent performs real-time research and content generation using only Anthropic API
- June 29, 2025. Applied SEO insight engine scrolling fixes for improved user interface navigation
- June 29, 2025. Applied guaranteed working buttons fix with enhanced state management and debugging functionality
- June 29, 2025. Applied auth redirect fix while maintaining permanently disabled authentication for development

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Issues (Priority: CRITICAL)
- User experiencing persistent UI functionality problems
- Generate button, Keyword Research button, CSV Upload button not responding properly
- Input fields not working consistently 
- Multiple debugging attempts by previous agents unsuccessful
- User requesting new agent for fresh approach to comprehensive debugging
- Admin email: ottmar.francisca1969@gmail.com (must use this exact email)
- PayPal integration: $2 per article, free first article for new users, 85% profit margin ($1.70 profit per article)

## Authentication System Status
- **PERMANENTLY DISABLED** for development and testing purposes
- All authentication middleware bypassed in `server/replitAuth.ts`
- Mock admin user automatically provided (ID: "44276721", email: "ottmar.francisca1969@gmail.com")
- Session handling completely disabled
- Frontend routing shows dashboard directly without authentication checks