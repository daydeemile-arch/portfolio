// ==========================================================================
// 1. GESTION DU THÈME (UMLA vs BITUME CAVIAR)
// ==========================================================================
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');

// Récupération du thème sauvegardé ou par défaut 'dark'
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeUI(currentTheme);

themeToggleBtn?.addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeUI(newTheme);

  // Événement personnalisé pour rafraîchir le graphique si présent
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
});

function updateThemeUI(theme) {
  if (!themeIcon || !themeLabel) return;
  if (theme === 'dark') {
    themeIcon.textContent = '🌙';
  } else {
    themeIcon.textContent = '☀️';
  }
}

// ==========================================================================
// 2. MENU HAMBURGER MOBILE
// ==========================================================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger?.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// ==========================================================================
// 3. EFFET MACHINE À ÉCRIRE (TYPEWRITER)
// ==========================================================================
const typewriterElement = document.getElementById('typewriter');
if (typewriterElement) {
  const words = [
    "Développeur Informatique",
    "Passionné de Web & Mobile",
    "Étudiant au CESI",
    "Créateur de solutions sur-mesure"
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const currentWord = words[wordIndex];
    
    if (isDeleting) {
      typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentWord.length) {
      typeSpeed = 2000; // Pause à la fin du mot
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
  }

  typeEffect();
}

// ==========================================================================
// 4. MODALE IMAGE PHOTO DE PROFIL
// ==========================================================================
const profileImg = document.getElementById('profile-img');
const imageModal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalClose = document.getElementById('modal-close');

profileImg?.addEventListener('click', () => {
  if (imageModal && modalImg) {
    imageModal.classList.add('open');
    imageModal.setAttribute('aria-hidden', 'false');
    modalImg.src = profileImg.src;
  }
});

modalClose?.addEventListener('click', () => {
  imageModal?.classList.remove('open');
  imageModal?.setAttribute('aria-hidden', 'true');
});

imageModal?.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    imageModal.classList.remove('open');
    imageModal.setAttribute('aria-hidden', 'true');
  }
});