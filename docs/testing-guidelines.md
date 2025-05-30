# Testing Guidelines for Torrent VideoClub

## Test Setup Analysis

The Torrent VideoClub project uses Vitest for testing with the following configuration:

### Testing Framework
- **Test Runner**: Vitest
- **Environment**: jsdom (for DOM/React testing)
- **Test Utilities**: @testing-library/react, @testing-library/jest-dom

### Test Structure
- **Main Test Directories**:
  - `/test`: Contains app and lib unit tests
  - `/tests`: Contains some isolated tests (redis-cache.test.ts)
  - Component tests should be placed in `__tests__` folders adjacent to components

### Running Tests
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage reporting

### Configuration
- Tests are configured in `vitest.config.ts`
- Setup file is in `test/setup.ts`
- Path aliases are configured (e.g., `@/` maps to project root)

## Action Plan for Featured Components Testing

### Issues Identified
1. Test files were being written using Jest syntax instead of Vitest
2. Missing test configuration for components
3. Need to ensure proper null handling for TMDb data

### Steps to Fix
1. Update component tests to use Vitest syntax
2. Create tests that verify null/undefined handling
3. Test with mock data to ensure UI displays correctly
4. Verify real data integration with appropriate error handling

### Best Practices
1. **Component Tests**:
   - Test rendering with complete data
   - Test rendering with missing data
   - Test fallback/default values
   - Test error states

2. **Integration Tests**:
   - Test API client integration
   - Test caching behavior
   - Test data transformation

3. **Test Structure**:
   - Use descriptive test names
   - Group related tests with `describe`
   - Keep tests focused and isolated

## Real Data Integration Testing
- Verify Prowlarr client search parameters
- Ensure proper data transformation
- Test TMDb data enrichment
- Verify Redis caching behavior
- Test error handling for API failures

This document serves as a guide for maintaining consistent testing practices for the Torrent VideoClub application.
