const SUPABASE_URL = 'https://vedizconrqlkirfynueb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZGl6Y29ucnFsa2lyZnludWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzUyMjIsImV4cCI6MjEwNDYxMTIyMn0.sfEs2wJrolC-oRqaewrwRnabr40Unjm062nLEBi9bQs';
const SECRET_ADMIN_TOKEN = 'emile2026';

let supabaseClient = null;
let allProjects = [];
let selectedFiles = [];

function initSupabase() {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// FONCTION GLOBALE POUR OUVRIR LA MODALE ADMIN
window.openAdminModal = function() {
  const adminModal = document.getElementById('admin-modal');
  if (adminModal) {
    adminModal.classList.add('open');
    adminModal.style.display = 'flex'; // Sécurité d'affichage
  }
};

// FONCTION GLOBALE POUR FERMER LA MODALE ADMIN
window.closeAdminModal = function() {
  const adminModal = document.getElementById('admin-modal');
  if (adminModal) {
    adminModal.classList.remove('open');
    adminModal.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();

  const adminBtn = document.getElementById('admin-add-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminModalClose = document.getElementById('admin-modal-close');
  const grid = document.getElementById('projects-grid');
  const filterBar = document.getElementById('filter-bar');

  // 1. GESTION DU RÔLE ADMIN PAR URL SECRÈTE (?admin=emile2026)
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin') === SECRET_ADMIN_TOKEN;

  if (adminBtn) {
    adminBtn.style.display = isAdmin ? 'inline-block' : 'none';
  }

  // Écouteur de fermeture sur la croix
  if (adminModalClose) {
    adminModalClose.onclick = () => window.closeAdminModal();
  }

  // Fermeture en cliquant sur le fond noir
  window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      window.closeAdminModal();
    }
  });

  // 2. GESTION DU DRAG & DROP DES IMAGES
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('p-files');
  const previewContainer = document.getElementById('preview-container');

  dropZone?.addEventListener('click', () => fileInput?.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone?.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  });

  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });

  function handleFiles(files) {
    if (selectedFiles.length + files.length > 10) {
      alert("Tu ne peux pas ajouter plus de 10 images.");
      return;
    }
    selectedFiles = [...selectedFiles, ...files].slice(0, 10);
    renderPreviews();
  }

  function renderPreviews() {
    if (!previewContainer) return;
    previewContainer.innerHTML = selectedFiles.map((file, index) => `
      <div style="position: relative; display: inline-block;">
        <img src="${URL.createObjectURL(file)}" class="preview-thumb" alt="Aperçu ${index + 1}">
      </div>
    `).join('');
  }

  // 3. FILTRAGE DES PROJETS
  function filterProjects(tech) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      const btnTech = btn.dataset.tech.toLowerCase();
      btn.classList.toggle('active', btnTech === tech.toLowerCase() || (tech === 'all' && btnTech === 'all'));
    });

    if (tech === 'all') {
      renderProjects(allProjects);
    } else {
      const filtered = allProjects.filter(p => 
        p.technologies && p.technologies.toLowerCase().includes(tech.toLowerCase())
      );
      renderProjects(filtered);
    }
  }

  filterBar?.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      const selectedTech = e.target.dataset.tech;
      filterProjects(selectedTech);
    }
  });

  // 4. CHARGEMENT ET AFFICHAGE DES PROJETS
  async function fetchProjects() {
    if (!supabaseClient) {
      if (grid) grid.innerHTML = `<p class="loading-text">Erreur de connexion avec la base de données.</p>`;
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      allProjects = data || [];
      renderProjects(allProjects);

      const techParam = urlParams.get('tech');
      if (techParam) {
        filterProjects(techParam);
      }

    } catch (err) {
      console.error('Erreur Supabase :', err);
      if (grid) {
        grid.innerHTML = `<p class="loading-text">Aucun projet trouvé ou table non configurée dans Supabase.</p>`;
      }
    }
  }

  function renderProjects(projects) {
    if (!grid) return;

    if (projects.length === 0) {
      grid.innerHTML = `<p class="loading-text">Aucun projet ne correspond à cette technologie.</p>`;
      return;
    }

    grid.innerHTML = projects.map(p => {
      const techArray = p.technologies ? p.technologies.split(',').map(t => t.trim()) : [];
      const coverImage = p.image_url || (p.images && p.images[0]) || '';
      return `
        <article class="project-card" onclick="openProjectModal(${p.id})">
          <img src="${coverImage}" alt="${p.title}" class="project-card-img" loading="lazy">
          <div class="project-card-content">
            <h3 class="project-card-title">${p.title}</h3>
            <p class="project-card-desc">${p.description}</p>
            <div class="tech-tags">
              ${techArray.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 5. SOUMISSION DU FORMULAIRE D'AJOUT + UPLOAD STORAGE
  document.getElementById('add-project-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabaseClient) return;

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Téléversement des images...";
    }

    try {
      const uploadedUrls = [];

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabaseClient.storage
          .from('project-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient.storage
          .from('project-images')
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      const newProject = {
        title: document.getElementById('p-title').value,
        description: document.getElementById('p-desc').value,
        technologies: document.getElementById('p-techs').value,
        images: uploadedUrls,
        image_url: uploadedUrls[0] || '',
        github_url: document.getElementById('p-github').value || null,
        demo_url: document.getElementById('p-demo').value || null
      };

      const { error: insertError } = await supabaseClient.from('projects').insert([newProject]);

      if (insertError) throw insertError;

      alert("Projet et images ajoutés avec succès !");
      selectedFiles = [];
      renderPreviews();
      window.closeAdminModal();
      document.getElementById('add-project-form').reset();
      fetchProjects();

    } catch (err) {
      console.error("Erreur lors de l'ajout :", err);
      alert("Erreur lors de l'ajout : " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publier le projet";
      }
    }
  });

  fetchProjects();
});

// MODALE DE DÉTAILS D'UN PROJET
window.openProjectModal = function(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;

  const mainImage = project.image_url || (project.images && project.images[0]) || '';
  document.getElementById('project-modal-img').src = mainImage;
  document.getElementById('project-modal-title').textContent = project.title;
  document.getElementById('project-modal-desc').textContent = project.description;

  const techContainer = document.getElementById('project-modal-techs');
  const techArray = project.technologies ? project.technologies.split(',').map(t => t.trim()) : [];
  techContainer.innerHTML = techArray.map(t => `<span class="tech-tag">${t}</span>`).join('');

  const githubBtn = document.getElementById('project-modal-github');
  githubBtn.href = project.github_url || '#';
  githubBtn.style.display = project.github_url ? 'inline-block' : 'none';

  const demoBtn = document.getElementById('project-modal-demo');
  demoBtn.href = project.demo_url || '#';
  demoBtn.style.display = project.demo_url ? 'inline-block' : 'none';

  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
};

document.getElementById('project-modal-close')?.addEventListener('click', () => {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
});