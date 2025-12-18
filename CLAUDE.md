# WordGym Students - Project Configuration

This is the project-specific configuration for WordGym Students (单字健身坊 - 学生版).

## Project Overview

**Tech Stack:**
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.0.8
- Tailwind CSS 3.4.0
- vite-plugin-singlefile 0.13.5 (single HTML output)

**Development Methodology:**
- Test-Driven Development (TDD)
- git-issue-pr-flow workflow

## Code Quality Standards

### TypeScript
- Use strict mode
- No `any` types without explicit justification
- Prefer interfaces over types for object shapes
- Use proper type inference, avoid redundant type annotations

### React Best Practices
- Functional components with hooks
- Proper dependency arrays in useEffect/useCallback/useMemo
- Avoid inline function definitions in JSX props
- Use React.memo for expensive components
- Keep components focused and single-responsibility

### Code Style
- Remove hedging language ("might", "could potentially", "perhaps")
- Remove agreement phrases ("I understand", "Sure", "Of course")
- Be direct and specific in technical communication
- Prefer explicit over implicit

## Single HTML Build Configuration

**CRITICAL:** This project uses `vite-plugin-singlefile` to generate a single HTML file output.

**Key Considerations:**
- All CSS is inlined (Tailwind)
- All JavaScript is bundled inline
- No external asset references in production build
- Build output: `dist/index.html` (self-contained)

**Testing the build:**
```bash
npm run build
npm run preview
```

## TDD Workflow

When implementing features:

1. **Write test first** - Define expected behavior
2. **Run test** - Confirm it fails
3. **Implement** - Write minimal code to pass
4. **Refactor** - Clean up while keeping tests green
5. **Commit** - Use conventional commit format

## Git Workflow

### Branch Naming
- Feature: `feature/[issue-number]-short-description`
- Bugfix: `fix/[issue-number]-short-description`
- Refactor: `refactor/[issue-number]-short-description`

### Commit Messages
Follow Conventional Commits:
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:** feat, fix, refactor, test, docs, style, chore

**Examples:**
```
feat(vocabulary): add word card component
fix(auth): resolve login state persistence
test(vocabulary): add word card interaction tests
refactor(ui): extract common button styles
```

### PR Process
1. Create issue first
2. Create branch from issue
3. Implement with TDD
4. Create PR referencing issue
5. Ensure all tests pass
6. Request review if needed

## Context Management

**Use /clear when:**
- Starting a new feature
- Switching between bug fix and feature work
- Context exceeds 50k tokens
- Changing focus areas significantly

## Development Practices

### File Organization
- Components: Small, focused, single-responsibility
- Test files: Co-located with component files (`.test.tsx`)
- Avoid deep nesting (max 3-4 levels)

### Performance
- Lazy load routes/components when appropriate
- Optimize Tailwind (use JIT mode)
- Monitor bundle size (single file output matters)

### Security
- Validate all user inputs
- Sanitize data before rendering
- No hardcoded secrets or API keys
- Use environment variables for config

## Anti-Patterns to Avoid

**Don't:**
- Create documentation files unless explicitly requested
- Use `any` type without justification
- Skip tests (this is a TDD project)
- Commit without following conventional commit format
- Create PRs without linking to issues
- Bundle unnecessary dependencies (affects single HTML size)

## Build Verification

Before committing:
```bash
# Ensure types are correct
npm run build

# Verify single HTML output
ls -lh dist/index.html

# Test the build
npm run preview
```

## Project-Specific Reminders

1. **Single HTML output:** Be mindful of bundle size, every dependency is inlined
2. **Chinese + English:** UI may have bilingual content
3. **Student-focused:** UX should be simple and clear for students
4. **Tailwind utility-first:** Use Tailwind classes, avoid custom CSS when possible
5. **TypeScript strict:** No type errors, no type workarounds

---

*WordGym Students Configuration | React 18 + TypeScript + Vite + Single HTML*
