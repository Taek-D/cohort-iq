# Testing Rules

- Test runner: Vitest (`npm run test`)
- Test files: `src/**/*.test.js`
- 102 tests across 8 files — all must pass before commit
- Pure functions make testing straightforward — no mocking framework needed
- Use `describe`/`it` blocks with clear descriptions
- Test edge cases: empty arrays, null inputs, boundary values
