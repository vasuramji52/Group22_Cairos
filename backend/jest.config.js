module.exports = {
  // tells Jest to use Node (not a browser) environment
  testEnvironment: 'node',

  // where Jest should look for your test files
  roots: ['<rootDir>/tests'],

  // automatically load environment variables before every test
  setupFiles: ['<rootDir>/tests/setupEnv.js'],

  // makes sure modules are reloaded fresh each test (important for env-dependent files like crypto.util)
  resetModules: true
};
