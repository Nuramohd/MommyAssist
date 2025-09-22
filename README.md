# MommyAssist
# Overview

MomCare is a comprehensive maternal health web application designed to support mothers throughout their pregnancy journey and postpartum period. The platform provides a complete ecosystem for managing prenatal care, tracking health metrics, scheduling medical appointments, monitoring immunizations, and connecting with a supportive community. Built with modern web technologies, it features an intuitive mobile-first interface with AI-powered risk assessment capabilities to help mothers make informed decisions about their health.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application uses React with TypeScript, leveraging Vite as the build tool for fast development and optimized production builds. The UI is built with shadcn/ui components based on Radix UI primitives, providing accessible and customizable interface elements. Styling is handled through Tailwind CSS with a custom design system featuring warm, maternal-friendly colors. The application follows a mobile-first responsive design approach with bottom navigation for easy thumb access.

## Routing and State Management
Client-side routing is managed by Wouter, a lightweight React router. State management utilizes TanStack Query (React Query) for server state management, providing caching, synchronization, and optimistic updates. Form handling is implemented with React Hook Form and Zod for validation.

## Backend Architecture
The server runs on Express.js with TypeScript, providing a RESTful API for all client interactions. The application uses a session-based authentication system integrated with Replit's OIDC authentication service. Session storage is handled through PostgreSQL with connect-pg-simple middleware.

## Database Design
The data layer uses Drizzle ORM with PostgreSQL as the primary database. The schema includes tables for users, ANC appointments, risk assessments, immunizations, community posts, and comments. The database supports user pregnancy tracking, appointment management, health monitoring, and social features.

## Authentication System
Authentication is handled through Replit's OpenID Connect (OIDC) service using Passport.js strategies. The system supports secure session management with PostgreSQL-backed session storage. User authentication state is managed client-side through React Query with automatic token refresh and unauthorized request handling.

## API Structure
The backend exposes RESTful endpoints for:
- User authentication and profile management
- ANC appointment CRUD operations
- Health risk assessment creation and retrieval
- Immunization tracking and reminders
- Community post and comment management
- ML-powered risk assessment processing

## ML Integration
The application includes a mock machine learning risk assessment system that analyzes maternal health indicators like blood pressure, weight gain, fetal movement, and symptoms to provide risk level classifications and personalized recommendations. This is designed to be replaced with actual ML model integration.

## Mobile-First Design
The interface is optimized for mobile devices with touch-friendly navigation, appropriate spacing for thumb interaction, and responsive layouts that work across different screen sizes. The bottom navigation pattern provides easy access to all major features.

# External Dependencies

## Database
- **PostgreSQL**: Primary database for all application data
- **Neon Database**: Cloud PostgreSQL service integration via @neondatabase/serverless

## Authentication
- **Replit OIDC**: OpenID Connect authentication service for user login and session management
- **Passport.js**: Authentication middleware with OpenID Connect strategy

## UI and Styling
- **Radix UI**: Headless UI primitives for accessible components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast JavaScript bundler for production builds

## Runtime Environment
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **WebSocket**: Real-time communication support via ws library
