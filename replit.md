# Gradient Canvas Tool

## Overview

An interactive freeform gradient canvas tool for creating custom mesh gradients with draggable color points. The application allows users to place unlimited color nodes on a canvas, adjust their properties (color, opacity, radius, edge type, shape), and export the resulting gradients. Built as a professional design tool with precision controls and real-time visual feedback.

## Recent Changes

### October 14, 2025
- **ColorPicker UI Restructure**: Removed separate "Image Circle" tab and consolidated all features into single Colors view
- **Image Upload in Colors Tab**: Added image upload functionality with preview directly in the Colors tab
- **Image Scale Control**: Added image scaling slider (0.1x - 3x) for uploaded images
- **Gradient Type Checkboxes**: Changed gradient type selection from dropdown to checkboxes (Solid, Linear, Radial) with simplified labels
- **Gradient Type Always Visible**: Gradient type checkboxes are now always visible regardless of current gradient style
- **Duplicate Gradient Type Removed**: Removed duplicate gradient type selector from gradient editor panel
- **Edge Type Removal**: Completely removed the edge type section (soft/hard edge controls) from the interface
- **Rectangle Shape Added**: Added "rectangle" as a new shape option (3:2 aspect ratio) alongside blob, circle, and square with proper canvas rendering
- **Keyboard Shortcuts**: Added undo (Ctrl/Cmd+Z) and redo (Ctrl/Cmd+Shift+Z) keyboard shortcuts
- **Universal Image Upload**: Image upload now works with any selected shape without shape-specific restrictions
- **Enhanced Drag-and-Drop Interaction**: Improved hover detection for gradient points (14px radius) and pink focus handles (12px radius) for easier grab-and-drag functionality
- **Zoom Behavior Enhancement**: Fixed canvas container layout so background color properly extends beyond the canvas when zooming out below 100%, providing a consistent viewport experience
- **Grid Display Improvement**: Migrated grid rendering from canvas to CSS background pattern with transparent canvas overlay, ensuring the grid is visible everywhere (inside canvas quadrants and extending into background) while following pan/zoom transformations
- **UX Improvements**: Better cursor feedback when hovering over draggable elements (points and focus handles)
- **Solid Gradient Fix**: Fixed solid gradient type to render as pure solid color without blur (previously was using radial gradient with fade)
- **Rectangle Gradient Fix**: Fixed rectangle shape to use proper gradient dimensions (3:2 aspect ratio) instead of circular gradient dimensions
- **Gradient Type Layout**: Changed gradient type checkboxes from vertical to horizontal layout for better UI organization
- **Gradient Type Persistence**: Fixed issue where changing colors would incorrectly switch gradient type from linear to radial

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server with hot module replacement
- Wouter for lightweight client-side routing (replacing React Router)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**UI Component System**
- Radix UI primitives for accessible, unstyled components (dialogs, popovers, tooltips, context menus, etc.)
- shadcn/ui design system ("new-york" style variant) for consistent component styling
- Tailwind CSS for utility-first styling with custom design tokens
- Dark theme-first approach with professional design tool aesthetics (studio grey #333333 canvas background)
- CSS variables for theme customization stored in HSL color space

**State Management & Data Flow**
- React hooks (useState, useRef, useEffect, useCallback) for local component state
- TanStack Query (React Query) for server state management and caching
- Custom hooks for reusable logic (useIsMobile, useToast)
- Canvas-based rendering with dual canvas approach (main gradient canvas + text overlay canvas)

**Key Features Implementation**
- Interactive gradient canvas with pan/zoom capabilities
- Draggable gradient points (nodes) with customizable properties:
  - Color (HEX/HSB/RGB input modes)
  - Opacity control
  - Influence radius with visual preview
  - Edge type (soft/hard)
  - Shape variants (blob/circle/square)
  - Gradient type per node (solid/linear/radial)
  - Focus point adjustment for directional gradients
- Comprehensive gradient customization UI (linear/radial gradients):
  - Enhanced gradient slider with visual draggable stop handles
  - Click anywhere on slider to add new color stops (automatically samples color from gradient at that position)
  - Intelligent color interpolation when adding stops between existing colors
  - Full spectrum color picker panel with interactive selector
  - HEX color input for precise color entry
  - RGB numeric inputs (R, G, B, A) with real-time sync
  - Hue slider with full spectrum visualization
  - Alpha/Opacity slider with transparency preview (checkerboard pattern)
  - Stops list panel showing all stops with:
    - Color swatch previews
    - HEX code fields
    - Position controls (0-100%)
    - Delete buttons
  - Real-time gradient preview with alpha support (RGBA)
  - Gradient type toggle (Linear/Radial)
  - Support for unlimited color stops with full transparency control
- Image circle with gradient border:
  - Image upload functionality
  - Circular preview with customizable gradient border
  - Adjustable border thickness (2-30px)
  - Border blur effect (0-20px)
  - Gradient border uses same stop slider controls
  - Separate rendering layers to keep image sharp while blurring border
- Context menu support for node operations (duplicate, delete)
- Undo/redo functionality
- Real-time gradient mesh rendering
- Export capabilities

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the stack
- ESM module system for modern JavaScript features
- Custom middleware for request logging and error handling

**Development & Production Setup**
- Vite middleware integration in development mode for HMR
- Static file serving in production from `dist/public`
- Environment-based configuration (NODE_ENV detection)
- Replit-specific development tools (cartographer, dev banner, runtime error overlay)

**API Structure**
- RESTful API routes prefixed with `/api`
- Centralized route registration in `server/routes.ts`
- Storage abstraction layer with interface-based design (IStorage)
- In-memory storage implementation (MemStorage) for development

### Data Storage Solutions

**Database Configuration**
- Drizzle ORM configured for PostgreSQL via Neon serverless
- Schema definition in `shared/schema.ts` for type sharing between client and server
- Zod integration via drizzle-zod for runtime validation
- Migration management through drizzle-kit
- Database URL required via environment variable

**Current Schema**
- Users table with UUID primary key, username (unique), and password fields
- Extensible schema design ready for gradient storage and user sessions

**Session Management**
- connect-pg-simple configured for PostgreSQL-backed sessions (though not yet actively used)
- Cookie-based session storage preparation

### External Dependencies

**UI & Interaction Libraries**
- @radix-ui/* suite (20+ component primitives for accessibility)
- cmdk for command palette functionality
- embla-carousel-react for carousel components
- date-fns for date manipulation
- class-variance-authority & clsx for conditional styling
- lucide-react for icon system
- recharts for chart visualization capabilities

**Form & Validation**
- react-hook-form with @hookform/resolvers for form state management
- Zod for schema validation

**Database & API**
- @neondatabase/serverless for serverless PostgreSQL connections
- drizzle-orm for type-safe database queries
- drizzle-zod for schema-to-validation conversion

**Development Tools**
- @replit/vite-plugin-* suite for Replit-specific development features
- tsx for TypeScript execution in development
- esbuild for production builds

**Design System Token Configuration**
- Font: Inter (Google Fonts) with fallback to system fonts
- Color system based on HSL with CSS custom properties
- Responsive breakpoint: 768px for mobile detection
- Custom shadow and border radius values defined in Tailwind config