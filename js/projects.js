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

// Extraction propre des images (gère le JSON stringifié, les tableaux ou les chaînes uniques)
function parseProjectImages(imageUrlData) {
  if (!imageUrlData) return [];
  if (Array.isArray(imageUrlData)) return imageUrlData;
  if (typeof imageUrlData === 'string') {
    try {
      const parsed = JSON.parse(imageUrlData);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [imageUrlData];
    }
  }
  return [];
}

// FONCTION GLOBALE POUR OUVRIR LA MODALE ADMIN
window.openAdminModal = function() {
  const adminModal = document.getElementById('admin-modal');
  if (adminModal) {
    adminModal.classList.add('open');
    adminModal.style.display = 'flex';
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

  if (adminModalClose) {
    adminModalClose.onclick = () => window.closeAdminModal();
  }

  window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      window.closeAdminModal();
    }
  });

  // 2. GESTION DES CHAMPS DYNAMIQUES DE TECHNOLOGIES (MODALE ADMIN)
  const techContainer = document.getElementById('tech-inputs-container');
  document.getElementById('add-tech-btn')?.addEventListener('click', () => {
    if (!techContainer) return;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.innerHTML = `
      <input type="text" class="form-input p-tech-input" placeholder="ex: JavaScript" required>
      <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="padding: 0 0.8rem;">&times;</button>
    `;
    techContainer.appendChild(div);
  });

  // 3. GESTION DU DRAG & DROP DES IMAGES
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

  // 4. GENERATION DYNAMIQUE DES FILTRES ET FILTRAGE INTERACTIF
  function generateDynamicFilters(projects) {
    if (!filterBar) return;

    const techSet = new Set();

    projects.forEach(p => {
      let techs = p.technologies;
      if (typeof techs === 'string') {
        techs = techs.split(',').map(t => t.trim());
      }
      if (Array.isArray(techs)) {
        techs.forEach(t => t && techSet.add(t.trim()));
      }
    });

    filterBar.innerHTML = `<button class="filter-btn active" data-tech="all">Tous</button>`;

    techSet.forEach(tech => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.tech = tech;
      btn.textContent = tech;
      filterBar.appendChild(btn);
    });
  }

  function filterProjects(selectedTech) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tech.toLowerCase() === selectedTech.toLowerCase());
    });

    if (selectedTech === 'all') {
      renderProjects(allProjects);
    } else {
      const filtered = allProjects.filter(p => {
        let techs = p.technologies;
        if (typeof techs === 'string') techs = techs.split(',').map(t => t.trim());
        if (Array.isArray(techs)) {
          return techs.some(t => t.toLowerCase() === selectedTech.toLowerCase());
        }
        return false;
      });
      renderProjects(filtered);
    }
  }

  filterBar?.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      filterProjects(e.target.dataset.tech);
    }
  });

  // 5. CHARGEMENT ET AFFICHAGE DES PROJETS
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
      generateDynamicFilters(allProjects);
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
      grid.innerHTML = `<p class="loading-text">Aucun projet ne correspond à ce filtre.</p>`;
      return;
    }

    grid.innerHTML = projects.map(p => {
      let techList = [];
      if (Array.isArray(p.technologies)) techList = p.technologies;
      else if (typeof p.technologies === 'string') techList = p.technologies.split(',').map(t => t.trim());

      const images = parseProjectImages(p.image_url || p.images);
      const coverImage = images[0] || 'img/placeholder.jpg';

      return `
        <article class="project-card" onclick="openProjectModal(${p.id})">
          <img src="${coverImage}" alt="${p.title}" class="project-card-img" loading="lazy">
          <div class="project-card-content">
            <h3 class="project-card-title">${p.title}</h3>
            <p class="project-card-desc">${p.description}</p>
            <div class="tech-tags">
              ${techList.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 6. SOUMISSION DU FORMULAIRE D'AJOUT (ADMIN) + UPLOAD STORAGE
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

      // Extraction des technologies saisies dans la modale
      const techInputs = document.querySelectorAll('.p-tech-input');
      const techList = Array.from(techInputs).map(i => i.value.trim()).filter(v => v.length > 0);

      const newProject = {
        title: document.getElementById('p-title').value,
        description: document.getElementById('p-desc').value,
        technologies: techList,
        image_url: uploadedUrls,
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

  const images = parseProjectImages(project.image_url || project.images);
  document.getElementById('project-modal-img').src = images[0] || 'img/placeholder.jpg';
  document.getElementById('project-modal-title').textContent = project.title;
  document.getElementById('project-modal-desc').textContent = project.description;

  const techContainer = document.getElementById('project-modal-techs');
  let techList = [];
  if (Array.isArray(project.technologies)) techList = project.technologies;
  else if (typeof project.technologies === 'string') techList = project.technologies.split(',').map(t => t.trim());

  techContainer.innerHTML = techList.map(t => `<span class="tech-tag">${t}</span>`).join('');

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