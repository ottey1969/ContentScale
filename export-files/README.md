# ContentScale Agent - Complete Project Export

This is a complete export of the ContentScale Agent application - an AI-powered content generation platform.

## Quick Start

1. **Extract files**: Extract this archive to your desired location
2. **Install dependencies**: Run `npm install`
3. **Setup database**: Create a PostgreSQL database and add connection URL to `.env`
4. **Environment variables**: Copy `.env.example` to `.env` and fill in required values
5. **Database setup**: Run `npm run db:push` to create database tables
6. **Start development**: Run `npm run dev`

## Environment Variables Required

Create a `.env` file with:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/contentscale

# Authentication (Required for login)
SESSION_SECRET=your-random-session-secret-here
OPENID_CLIENT_ID=your-replit-app-client-id
OPENID_CLIENT_SECRET=your-replit-app-client-secret

# AI Services (Required for content generation)
ANTHROPIC_API_KEY=your-anthropic-api-key

# PayPal (Optional - for payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Optional APIs (System works without these)
OPENAI_API_KEY=your-openai-key
ANSWER_SOCRATES_API_KEY=your-answer-socrates-key
```

## Key Features

- **AI Content Generation**: Powered by Anthropic Claude for high-quality content
- **Keyword Research**: Built-in keyword analysis and clustering
- **SEO Optimization**: Content scoring and AI overview potential assessment
- **CSV Upload**: Bulk keyword processing
- **Referral System**: User acquisition and credit system
- **Security Dashboard**: Advanced fingerprinting and abuse prevention
- **Admin Panel**: Comprehensive management interface
- **Real-time Updates**: WebSocket-powered live updates

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time**: WebSockets
- **AI**: Anthropic Claude API

## Database Setup

The application uses PostgreSQL. After setting DATABASE_URL:

1. Install PostgreSQL locally or use a cloud provider (Neon, Supabase, etc.)
2. Run `npm run db:push` to create all required tables
3. The app will automatically seed initial data on first run

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
contentscale-agent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   └── pages/          # Route components
│   └── index.html
├── server/                 # Express backend
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   └── *.ts               # Server files
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
└── *.config.*             # Configuration files
```

## Deployment

The application is optimized for Replit deployment but can run anywhere Node.js is supported:

1. **Replit**: Upload files and run `npm run dev`
2. **Vercel/Netlify**: Use `npm run build` for static frontend
3. **Railway/Render**: Full-stack deployment with `npm start`
4. **Docker**: Add Dockerfile for containerized deployment

## Admin Access

Admin panel is accessible at `/admin` with the configured admin email (ottmar.francisca1969@gmail.com in the original setup).

## Security Features

- Fingerprint tracking and IP monitoring
- Rate limiting per action type
- Automatic abuse detection and blocking
- Security event logging
- Admin security dashboard

## Support

This export contains the complete working application as of June 27, 2025. All critical functionality has been implemented and tested.

## License

MIT License - See original project for full license terms.