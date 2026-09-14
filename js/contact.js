const SUPABASE_URL = 'https://vedizconrqlkirfynueb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZGl6Y29ucnFsa2lyZnludWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzUyMjIsImV4cCI6MjEwNDYxMTIyMn0.sfEs2wJrolC-oRqaewrwRnabr40Unjm062nLEBi9bQs';

document.addEventListener('DOMContentLoaded', () => {
  const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return;

    const btn = document.getElementById('c-submit');
    btn.disabled = true;
    btn.textContent = "Envoi en cours...";

    const { error } = await supabaseClient.from('messages').insert([{
      name: document.getElementById('c-name').value,
      email: document.getElementById('c-email').value,
      subject: document.getElementById('c-subject').value || 'Sans sujet',
      message: document.getElementById('c-message').value
    }]);

    btn.disabled = false;
    btn.textContent = "Envoyer le message";

    if (error) {
      alert("Erreur lors de l'envoi : " + error.message);
    } else {
      alert("Message envoyé avec succès !");
      document.getElementById('contact-form').reset();
    }
  });
});