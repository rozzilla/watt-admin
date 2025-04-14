# Watt Admin Development Guide

## Build/Test/Lint Commands
```bash
# Development
npm run dev                     # Start development server
npm run build                   # Build for production
npm run start                   # Start in production mode
npm run clean                   # Remove build artifacts

# Testing
npm run test                    # Run all tests
npm run test:cli                # Run CLI tests only
npm run test:backend            # Run backend tests only
npm run test:frontend           # Run frontend tests only
node --test test/path/to/file.test.js  # Run single Node.js test file
cd web/frontend && vitest run path/to/file.test.ts  # Run single frontend test

# Linting
npm run lint                    # Lint all code
npm run lint:fix                # Fix linting issues automatically
```

## Code Style Guidelines
- **Formatting**: Project uses neostandard via ESLint (strict mode)
- **TypeScript**: Use explicit types for function params, returns, interfaces
- **Imports**: Group related imports, alphabetize within groups
- **Naming**: camelCase for variables/functions, PascalCase for components/classes/interfaces/types
- **Error Handling**: Log errors with fastify.log, handle async errors with try/catch
- **React**: Functional components with hooks, use React.ReactElement return types
- **Testing**: Node.js test module for backend, Vitest for frontend
- **Backend**: Follow Fastify conventions with typed routes using JsonSchemaToTsProvider