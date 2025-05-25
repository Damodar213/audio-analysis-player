import { createClient } from '@supabase/supabase-js';

// Replace these with your actual values from the Supabase dashboard
const supabaseUrl = 'https://nfmsinllitpiryckvimc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbXNpbmxsaXRwaXJ5Y2t2aW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDYxMTgsImV4cCI6MjA2MjI4MjExOH0.Ujt3A502VpH0dtW7RXXh3klIPkm1pjb8lJFyidk6hrk'; // <-- paste your anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);