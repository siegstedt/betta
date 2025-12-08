# Agent Guidelines for Betta Repository

This document outlines the conventions and commands for agentic coding agents operating in this repository.

## 1. Build/Lint/Test Commands

*   **Full Application Build:** `docker-compose up --build`
*   **Backend (Python):**
    *   **Lint:** `ruff check .`
    *   **Format:** `ruff format .`
    *   **Tests:** `pytest`
    *   **Single Test:** `pytest <path_to_test_file>::<test_function_name>`
*   **Frontend (Next.js/React):**
    *   **Lint:** `npm run lint` (ESLint with Prettier integration)
    *   **Format:** `npm run format` (Prettier)
    *   **Format Check:** `npm run format:check` (Prettier check)
    *   **Typecheck:** `npm run typecheck` (TypeScript)
    *   **Tests:** `npm test` (assuming `jest`)
    *   **Single Test:** `npm test -- <path_to_test_file>`

## 2. Development Workflow

*   **Pre-commit Hooks:** Automated linting, formatting, and type checking via Husky and lint-staged.
*   **CI/CD:** GitHub Actions enforce linting, formatting, and type checking on pushes and PRs to main branch.

## 3. Code Style Guidelines

*   **General:** Adhere to existing code style, naming conventions, and architectural patterns.
*   **Imports:** Organize imports consistently (e.g., standard library, third-party, local).
*   **Formatting:** Use automated formatters (ruff for Python, prettier for JS/TS).
*   **Types:** Utilize type hints (Python) and TypeScript (Frontend) for clarity and error prevention.
*   **Naming:** Follow conventional naming (e.g., `snake_case` for Python, `camelCase` for JS/TS variables/functions, `PascalCase` for classes/components).
*   **Error Handling:** Use ErrorProvider for global notifications, ErrorBoundary for crashes, ErrorMessage for inline errors, and LoadingSpinner for consistent loading states. Provide specific, actionable error messages with retry options.
