const SUPABASE_URL = 'https://vedizconrqlkirfynueb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZGl6Y29ucnFsa2lyZnludWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzUyMjIsImV4cCI6MjEwNDYxMTIyMn0.sfEs2wJrolC-oRqaewrwRnabr40Unjm062nLEBi9bQs';
const SECRET_KEY = 'emile2026';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const key = urlParams.get('key');

  if (key !== SECRET_KEY) {
    document.getElementById('unauthorized-msg').style.display = 'block';
    return;
  }

  document.getElementById('login-card').style.display = 'block';
  const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    const { data, error } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('username', user)
      .eq('password', pass)
      .single();

    if (error || !data) {
      alert("Identifiants incorrects.");
    } else {
      sessionStorage.setItem('admin_logged', 'true');
      window.location.href = 'dashboard.html';
    }
  });
});