// supabaseClient.js
window.SB_URL = 'https://jzzdjhxisuuwgajujduu.supabase.co';
window.SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emRqaHhpc3V1d2dhanVqZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjUwOTMsImV4cCI6MjA3NTI0MTA5M30.gtzWWZwZGkpjyLvbH9M3HAs5xtQ1mLcDFnmT25-1F5s';

// @supabase/supabase-js de la CDN expone "supabase" en window
window.sb = supabase.createClient(window.SB_URL, window.SB_KEY);
