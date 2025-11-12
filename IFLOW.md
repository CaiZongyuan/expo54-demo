# CLAUDE.md - React Native Project Analysis

## Project Overview

**Project Name**: as_test  
**Technology Stack**: React Native with Expo 54, TypeScript, and modern development tools  
**Package Manager**: Bun (confirmed by bun.lock file and README documentation)  
**Platform**: Cross-platform (iOS, Android, Web)

## Technology Stack & Dependencies

### Core Framework
- **React Native**: v0.81.5
- **Expo**: v54.0.23
- **React**: v19.1.0
- **TypeScript**: v5.9.2

### Navigation & Routing
- **Expo Router**: v6.0.14 (File-based routing)
- **React Navigation**: v7.1.8 (For bottom tabs)

### Styling & UI
- **NativeWind**: v4.2.1 (Tailwind CSS for React Native)
- **React Native Reanimated**: v3.17.4
- **React Native Gesture Handler**: v2.28.0
- **React Native Safe Area Context**: v5.4.0
- **React Native Screens**: v4.16.0

### State Management
- **Jotai**: v2.15.1 (Atomic state management)
- **TanStack Query**: v5.90.7 (Server state management)

### Database & Storage
- **Drizzle ORM**: v0.44.7 (Database ORM).Before you use Drizzle, you must read [DrizzleWithExpo.md](docs/DrizzleWithExpo.md) to understand how to use it.
- **Expo SQLite**: v16.0.9 (SQLite database)
- **Expo Drizzle Studio Plugin**: v0.2.1 (Database studio)

### Validation & Utilities
- **Zod**: v4.1.12 (Schema validation)
- **React Native Web**: v0.21.0 (Web support)

### Development Tools
- **ESLint**: v9.25.0 with Expo config
- **Prettier**: Tailwind CSS plugin
- **Babel**: With Expo preset and NativeWind

## Configuration Files

### Babel Configuration
- Uses `babel-preset-expo` with JSX import source set to NativeWind
- Includes `nativewind/babel` preset for Tailwind CSS support

### Metro Configuration
- Uses Expo's default Metro config
- Integrated with NativeWind via `withNativeWind`
- Input file: `./app/global.css`

### TypeScript Configuration
- Extends Expo's base TypeScript config
- Strict mode enabled
- Path alias `@/*` mapped to `./\*`

### Tailwind CSS Configuration
- Content includes app/** and components/** directories
- Uses NativeWind preset
- Base Tailwind directives in global.css

## Available Scripts

From package.json:

```json
{
  "scripts": {
    "start": "expo start",                    // Start development server
    "reset-project": "node ./scripts/reset-project.js", // Reset project
    "android": "expo start --android",        // Start Android development
    "ios": "expo start --ios",               // Start iOS development
    "web": "expo start --web",               // Start web development
    "lint": "expo lint"                      // Run ESLint
  }
}
```

### Additional Bun Commands
Based on the README, Bun is the package manager:
- `bun install` - Install dependencies
- `bun start` - Start development server
- `bun run android/ios/web` - Platform-specific starts

## Architecture Patterns

### 1. File-Based Routing
- Uses Expo Router with file-based routing
- Supports TypeScript for route typing
- Nested directories create nested routes

### 2. State Management
- **Jotai** for client-side state management (atoms)
- **TanStack Query** for server state and data fetching
- **Zod** for runtime type validation

### 3. Styling Architecture
- **NativeWind** for utility-first styling
- Tailwind CSS configuration with custom content paths
- Global CSS with Tailwind directives

### 4. Database Architecture
- **Drizzle ORM** with SQLite database
- Expo SQLite for database persistence
- Drizzle Studio plugin for database management

## Development Workflow

### Starting the Development Environment
```bash
# Using Bun (recommended)
bun install
bun start

### Key Development Commands
```bash
bun lint          # Run ESLint
bun install       # Install dependencies
expo start        # Start Expo development server
```

## Project Notes

### Important Considerations
1. **Expo Go Only**: Project uses Expo Go without prebuild, so compatibility is limited to Expo-supported features
2. **New Architecture**: New React Native Architecture is enabled
3. **Experimental Features**: React Compiler and typed routes are enabled
4. **Bun as Package Manager**: All commands should use bun when possible
5. **Context7 MCP**: Instructions mention using context7 MCP for function searches. Also, you can create a markdown file for the technical analysis, kind of like the ./docs/DrizzleWithExpo.md one in the docs folder.
6. **Drizzle**: Before you use Drizzle, you must read [DrizzleWithExpo.md](docs/DrizzleWithExpo.md) to understand how to use it
7. **ReactNativeGuide**: Before you use ReactNativeGuide, you must read [ReactNativeGuide.md](docs/ReactNativeGuide.md) to understand how to use it
8. Please ensure that the CLAUDE.md file is updated regularly
9. Please conduct all analysis and processing in English, while providing all communication to the user in Chinese

### Architecture Status
- The project is in early development stages with most directories empty
- app-example directory contains demo components and example implementations
- Core architecture is set up but implementation is minimal

### VS Code Integration
- Expo tools extension recommended
- Code actions on save enabled for auto-fixing and organizing

## Future Development

### To Implement
1. Database schema and migrations using Drizzle Kit
2. Custom components in app/components directory
3. Custom hooks in app/hooks directory
4. Page implementations in app/pages directory
5. State management atoms and queries
6. API integration with TanStack Query
7. Form validation with Zod schemas

### Best Practices
- Follow the established architecture patterns
- Use TypeScript for type safety
- Leverage NativeWind for styling consistency
- Implement proper error boundaries
- Use Jotai atoms for shared state
- Implement proper data fetching with TanStack Query
- Use Zod schemas for validation
