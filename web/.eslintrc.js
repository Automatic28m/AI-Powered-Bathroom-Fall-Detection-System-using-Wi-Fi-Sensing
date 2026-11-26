// ESLint config for Next.js
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Warn on console.log — use the logging module in services
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
