# OpenAuditSwarms

AI Agent Sharing Platform for Auditors - A centralized platform where auditors can discover, share, and implement AI agents across multiple platforms (OpenAI, Claude, Gemini, LangChain, Copilot).

## Features

- 🤖 **Platform Agnostic**: Share agents across OpenAI, Claude, Gemini, LangChain, and Copilot
- 🔍 **Advanced Search & Filtering**: Find the perfect agent for your audit needs
- 👥 **Community Driven**: Upvote, rate, and review agents from the audit community
- 📊 **User Dashboard**: Track your agents' performance and manage your uploads
- 🔐 **Secure Authentication**: Sign up/sign in with email or OAuth providers
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend (Currently Implemented)
- **Framework**: Next.js 15+ with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components inspired by shadcn/ui
- **Icons**: Lucide React

### Backend (To Be Implemented)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OpenAuditSwarms.git
cd OpenAuditSwarms
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
OpenAuditSwarms/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── browse/             # Browse agents page
│   │   ├── agents/[id]/        # Agent detail page
│   │   ├── upload/             # Upload agent page
│   │   ├── signin/             # Sign in page
│   │   ├── signup/             # Sign up page
│   │   └── dashboard/          # User dashboard
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── layouts/            # Layout components (Header, etc.)
│   ├── lib/
│   │   └── utils/              # Utility functions
│   └── styles/
│       └── globals.css         # Global styles with Tailwind
├── public/                     # Static assets
├── PRD.md                      # Product Requirements Document
├── CLAUDE.md                   # Development guide for Claude AI
└── package.json

```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Pages Overview

### Landing Page (`/`)
- Hero section with call-to-action
- Featured agents showcase
- Popular categories
- Platform features

### Browse Page (`/browse`)
- Search and filter agents
- Grid/list view toggle
- Category and platform filters
- Sorting options (popular, recent, highest rated)

### Agent Detail Page (`/agents/[id]`)
- Complete agent information
- Platform-specific configurations
- Sample inputs/outputs
- User reviews and ratings
- Download and upvote functionality

### Upload Page (`/upload`)
- Multi-step form wizard
- Platform configuration for each supported AI
- Documentation and sample data
- Prerequisites and setup instructions

### Authentication Pages (`/signin`, `/signup`)
- Email/password authentication
- OAuth providers (Google, GitHub)
- Password strength requirements
- Terms of service agreement

### Dashboard (`/dashboard`)
- Agent performance metrics
- Manage uploaded agents
- Favorite agents collection
- Analytics and insights
- Profile settings

## Next Steps

### Backend Implementation
1. Set up Supabase project
2. Create database schema with RLS policies
3. Implement authentication flow
4. Add API endpoints for CRUD operations
5. Set up real-time subscriptions

### Additional Features
- Comment system on agents
- Agent versioning
- Export/import functionality
- API documentation
- Advanced analytics
- Email notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or feedback, please open an issue on GitHub.