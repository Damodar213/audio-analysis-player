import { createClient } from '@supabase/supabase-js';

// Replace these with your actual values from the Supabase dashboard
const supabaseUrl = 'https://xanbnqxslhgubyyuwejl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbmJucXhzbGhndWJ5eXV3ZWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTAxMDYsImV4cCI6MjA2MzkyNjEwNn0.-HHpSUwatIn0LgYu02Wh6BeUL0LtO84b9Casm7ts22o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);