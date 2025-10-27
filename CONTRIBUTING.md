# Contributing to Vend

Thank you for your interest in contributing to Vend! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

### Suggesting Features

Feature suggestions are welcome! Please:

- Check existing issues to avoid duplicates
- Provide clear use case and rationale
- Describe expected behavior
- Consider implementation complexity

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/vend.git
   cd vend
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow code style guidelines (below)
   - Add tests for new features
   - Update documentation as needed
   - Keep commits focused and atomic

4. **Test Your Changes**
   ```bash
   npm test
   npm start  # Verify server runs
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation updates
   - `test:` Test additions/changes
   - `refactor:` Code refactoring
   - `chore:` Maintenance tasks

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub.

## Code Style Guidelines

### JavaScript Style

- Use ES6+ modules (`import`/`export`)
- Use `const` by default, `let` when needed
- Prefer arrow functions for callbacks
- Use template literals for strings
- Add JSDoc comments for functions
- Keep functions small and focused

Example:
```javascript
/**
 * Fetches asset transfers for an address
 * @param {string} address - Wallet address
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Transfer data
 */
export async function getAssetTransfers(address, options = {}) {
  const { maxCount = 100 } = options;
  // Implementation...
}
```

### File Organization

- One export per file (prefer default exports for main functionality)
- Group imports: external dependencies, then internal modules
- Place configuration in `config.js`
- Keep routes thin, logic in services

### Error Handling

- Always handle errors in async functions
- Log errors with appropriate context
- Return meaningful error messages to API consumers
- Use try/catch blocks

### Testing

- Write tests for all new features
- Aim for >80% code coverage
- Test both success and error cases
- Use descriptive test names

Example:
```javascript
describe('getAssetTransfers', () => {
  it('should fetch transfers for valid address', async () => {
    const result = await getAssetTransfers('0x123...');
    expect(result).toHaveProperty('transfers');
  });

  it('should throw error for invalid address', async () => {
    await expect(getAssetTransfers('invalid'))
      .rejects.toThrow();
  });
});
```

## Documentation

- Update README.md for new features
- Add tutorials in `/docs` for complex features
- Keep code comments current
- Document API changes in CHANGELOG.md

## Development Workflow

### Setting Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your keys
nano .env

# Run in development mode
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test -- --coverage
```

### Debugging

Use Node.js debugger:
```bash
node --inspect src/index.js
```

Or add breakpoints in your code:
```javascript
debugger;
```

## Project Structure

```
vend/
├── src/
│   ├── index.js          # Server entry point
│   ├── config.js         # Configuration
│   ├── logger.js         # Logging setup
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   └── services/         # Business logic
├── tests/                # Test files
├── docs/                 # Documentation
└── package.json
```

## Adding New Features

### Adding a New API Endpoint

1. Create route file in `src/routes/`
2. Implement business logic in `src/services/`
3. Add route to `src/index.js`
4. Write tests in `tests/`
5. Update README.md with endpoint docs

Example:
```javascript
// src/routes/balances.js
import express from 'express';
import { getTokenBalances } from '../services/alchemy.js';
import { paymentRequired } from '../middleware/payment.js';

const router = express.Router();

router.get('/', paymentRequired(), async (req, res, next) => {
  try {
    const { address } = req.query;
    const balances = await getTokenBalances(address);
    res.json({ success: true, data: balances });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Adding Payment Verification

To implement real payment verification:

1. Study x402 facilitator API
2. Implement verification in `src/middleware/payment.js`
3. Add blockchain query logic
4. Test with real testnet transactions
5. Document the process

## Review Process

Pull requests will be reviewed for:

- Code quality and style
- Test coverage
- Documentation completeness
- Breaking changes (should be avoided)
- Performance implications
- Security considerations

## Community

- **GitHub Discussions** - Ask questions, share ideas
- **Issues** - Bug reports and feature requests
- **Pull Requests** - Code contributions

## Recognition

Contributors will be:
- Listed in project documentation
- Credited in release notes
- Recognized in community channels

## Getting Help

- Check existing documentation in `/docs`
- Search closed issues for similar problems
- Ask in GitHub Discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Vend! 🚀
