// Simple script to create a .env file with Supabase credentials
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Supabase Environment Setup');
console.log('-------------------------');
console.log('This script will help you set up your Supabase credentials.');
console.log('You can find these in your Supabase dashboard under Project Settings > API');
console.log('');

rl.question('Enter your Supabase URL: ', (url) => {
  rl.question('Enter your Supabase anon key: ', (key) => {
    const envContent = `# Supabase configuration
VITE_SUPABASE_URL=${url.trim()}
VITE_SUPABASE_ANON_KEY=${key.trim()}`;

    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log('\nCredentials saved to .env file successfully!');
    console.log('You can now restart your app to use Supabase.');
    rl.close();
  });
}); 