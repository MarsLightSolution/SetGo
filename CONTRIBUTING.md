# Contributing to SetGo 🤝

First off, thank you for considering contributing to SetGo! It's people like you that make SetGo such a great platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Process](#development-process)
- [Style Guidelines](#style-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to tiwariraj1202@gmail.com.

---

## 🎯 How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

**Bug Report Template:**
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable
- **Environment**:
  - OS: [e.g., Windows 11, macOS 13, Ubuntu 22.04]
  - Browser: [e.g., Chrome 120, Firefox 121]
  - Node version: [e.g., 18.19.0]
  - SetGo version: [e.g., 1.0.0]

### Suggesting Features ✨

Feature suggestions are welcome! Please provide:

- **Clear title** and detailed description
- **Use case**: Why this feature would be useful
- **Proposed solution**: How you envision it working
- **Alternatives**: Any alternative solutions you've considered
- **Additional context**: Mockups, examples, or references

### Contributing Code 💻

1. **Find an issue** to work on or create one
2. **Comment** on the issue to let others know you're working on it
3. **Fork** the repository
4. **Create a branch** for your feature
5. **Make your changes** following our guidelines
6. **Submit a pull request**

---

## 🔨 Development Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/SetGo.git
cd SetGo
```

### 2. Set Up Development Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your local configuration
npm install
npm start
```

**Frontend:**
```bash
cd Frontend
cp .env.example .env
# Edit .env with your local configuration
npm install
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 4. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed
- Add tests for new features

### 5. Test Your Changes

```bash
# Backend tests
cd backend
npm test

# Frontend linting
cd Frontend
npm run lint

# Build test
npm run build
```

### 6. Commit Your Changes

Follow our [commit guidelines](#commit-guidelines).

```bash
git add .
git commit -m "feat: add amazing new feature"
```

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 🎨 Style Guidelines

### JavaScript/React Style Guide

- **ES6+ syntax**: Use modern JavaScript features
- **Functional components**: Prefer hooks over class components
- **Destructuring**: Use object and array destructuring
- **Arrow functions**: Use arrow functions for callbacks
- **const/let**: Never use `var`
- **Single quotes**: For strings (except JSX attributes)
- **Semicolons**: Always use semicolons
- **2 spaces**: For indentation

**Good Example:**
```javascript
const MyComponent = ({ userId, onUpdate }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  const handleClick = () => {
    onUpdate(user);
  };

  return (
    <div className="user-card">
      <h2>{user?.name}</h2>
      <button onClick={handleClick}>Update</button>
    </div>
  );
};
```

### Backend Style Guide

- **Async/await**: Prefer over promise chains
- **Error handling**: Always handle errors properly
- **Middleware order**: Rate limit → Validation → Auth → Business logic
- **HTTP status codes**: Use appropriate status codes
- **RESTful conventions**: Follow REST principles

**Good Example:**
```javascript
router.post('/items',
  rateLimiter,
  validateCreateItem,
  verifyJWT,
  async (req, res, next) => {
    try {
      const item = await itemService.create(req.body, req.user);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }
);
```

### File Naming Conventions

- **React components**: PascalCase (e.g., `UserProfile.jsx`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)
- **Routes**: camelCase with `.route.js` suffix (e.g., `user.route.js`)
- **Models**: PascalCase (e.g., `User.js`)

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes
- **build**: Build system changes

### Examples

```bash
feat(auth): add Google OAuth integration

Implemented OAuth 2.0 flow for Google sign-in.
Added new dependencies: passport-google-oauth20.

Closes #123
```

```bash
fix(payment): resolve race condition in checkout

The checkout process was occasionally failing due to
concurrent order creation. Added transaction handling
to ensure atomicity.

Fixes #456
```

```bash
docs: update installation instructions

Added troubleshooting section for common issues.
```

### Rules

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter of subject
- No period at the end of subject
- Subject line: max 72 characters
- Body: explain what and why, not how
- Footer: reference issues and breaking changes

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Tests added/updated and passing
- [ ] CI/CD pipeline passes

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Before/After screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks**: CI/CD must pass
2. **Code review**: At least one maintainer approval required
3. **Testing**: Reviewers will test functionality
4. **Feedback**: Address all review comments
5. **Merge**: Maintainer will merge when approved

### After Merge

- Delete your branch
- Update your local repository
- Check that changes are live (if applicable)

---

## 🏆 Recognition

Contributors will be:
- Listed in the [Contributors section](https://github.com/MarsLightSolution/SetGo/graphs/contributors)
- Mentioned in release notes for significant contributions
- Added to the [README.md](README.md) for major features

---

## 💬 Community

### Getting Help

- **GitHub Discussions**: For questions and discussions
- **GitHub Issues**: For bugs and feature requests
- **Email**: tiwariraj1202@gmail.com for private inquiries

### Communication Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Stay on topic
- Help others when you can
- Assume good intentions

---

## 📚 Resources

### Learning Resources

- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB University](https://university.mongodb.com/)
- [Git Documentation](https://git-scm.com/doc)

### SetGo Documentation

- [API Documentation](docs/API.md) *(Coming Soon)*
- [Architecture Overview](docs/ARCHITECTURE.md) *(Coming Soon)*
- [Security Guidelines](SECURITY.md)
- [Deployment Guide](Frontend/DEPLOYMENT_GUIDE.md)

---

## 🎓 First-Time Contributors

New to open source? No problem! Here's how to get started:

1. **Start small**: Look for issues labeled `good first issue`
2. **Ask questions**: Don't hesitate to ask for help
3. **Read documentation**: Familiarize yourself with the codebase
4. **Join discussions**: Engage with the community
5. **Learn by doing**: The best way to learn is by contributing

### Good First Issues

Issues labeled with `good first issue` are great starting points:
- Simple bug fixes
- Documentation improvements
- Adding tests
- Code cleanup

---

## ⚡ Quick Commands

```bash
# Setup
npm install

# Development
npm run dev          # Frontend development server
npm start            # Backend development server

# Testing
npm test            # Run tests
npm run lint        # Run linter

# Building
npm run build       # Production build

# Git
git status          # Check status
git checkout -b feature/name  # Create branch
git add .           # Stage changes
git commit -m "message"       # Commit
git push origin branch-name   # Push
```

---

## 🙏 Thank You!

Your contributions make SetGo better for everyone. We appreciate your time and effort!

If you have questions about contributing, feel free to ask in [GitHub Discussions](https://github.com/MarsLightSolution/SetGo/discussions) or reach out via email.

Happy coding! 🚀

---

<div align="center">

Made with ❤️ by the SetGo Community

[⬆ Back to Top](#contributing-to-setgo-)

</div>
