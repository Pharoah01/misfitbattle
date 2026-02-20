/**
 * Simple verification script to check environment configuration
 * Run with: node verify-config.js
 */

console.log('=== Environment Configuration Verification ===\n');

// Check if .env files exist
const fs = require('fs');
const path = require('path');

const envFiles = [
  '.env.development',
  '.env.production',
  '.env.example'
];

console.log('Checking environment files:');
envFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${file}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
});

console.log('\nChecking constants file:');
const constantsPath = path.join(__dirname, 'src', 'config', 'constants.ts');
const constantsExists = fs.existsSync(constantsPath);
console.log(`  src/config/constants.ts: ${constantsExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (constantsExists) {
  const constantsContent = fs.readFileSync(constantsPath, 'utf8');
  console.log('\nConstants file contains:');
  console.log(`  - API_BASE_URL: ${constantsContent.includes('API_BASE_URL') ? '✓' : '✗'}`);
  console.log(`  - TOKEN_STORAGE_KEY: ${constantsContent.includes('TOKEN_STORAGE_KEY') ? '✓' : '✗'}`);
  console.log(`  - MAX_CODE_LENGTH: ${constantsContent.includes('MAX_CODE_LENGTH') ? '✓' : '✗'}`);
  console.log(`  - VALIDATION_PATTERNS: ${constantsContent.includes('VALIDATION_PATTERNS') ? '✓' : '✗'}`);
  console.log(`  - ERROR_MESSAGES: ${constantsContent.includes('ERROR_MESSAGES') ? '✓' : '✗'}`);
  console.log(`  - SUCCESS_MESSAGES: ${constantsContent.includes('SUCCESS_MESSAGES') ? '✓' : '✗'}`);
}

console.log('\n=== Verification Complete ===');
console.log('\nNext steps:');
console.log('1. Start the dev server: npm run dev');
console.log('2. The API_BASE_URL will be: http://localhost:8000 (from .env.development)');
console.log('3. For production builds, update VITE_API_URL in .env.production');
