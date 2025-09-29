# Contributing to naisho

Thank you for considering contributing to naisho! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/naisho.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

- Run the development server: `pnpm dev`
- Run tests: `pnpm test`
- Type check: `pnpm typecheck`
- Lint and format: `pnpm lint && pnpm format`

## Before Submitting

1. Ensure all tests pass: `pnpm test:run`
2. Run type checking: `pnpm typecheck`
3. Format your code: `pnpm format`
4. Write clear commit messages

## Pull Request Process

1. Update documentation if needed
2. Ensure your code follows the existing style
3. Add tests for new functionality
4. Keep PRs focused on a single feature or fix
5. Reference any related issues in your PR description

## Code Guidelines

- Use TypeScript with strict mode
- Avoid `any` types when possible
- Write tests for new features
- Follow existing patterns in the codebase
- Security first — never skip validation or verification steps

## Questions?

Open an issue for discussion before starting work on major changes.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.