const SUPABASE_URL = 'https://vedizconrqlkirfynueb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZGl6Y29ucnFsa2lyZnludWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzUyMjIsImV4cCI6MjEwNDYxMTIyMn0.sfEs2wJrolC-oRqaewrwRnabr40Unjm062nLEBi9bQs';

let selectedFiles = [];

window.openAdminModal = () => {
    const modal = document.getElementById('admin-modal');
    if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; }
};

window.closeAdminModal = () => {
    const modal = document.getElementById('admin-modal');
    if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('admin_logged') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem('admin_logged');
        window.location.href = 'index.html';
    });

    // Ajout dynamique des champs technologies
    const techContainer = document.getElementById('tech-inputs-container');
    document.getElementById('add-tech-btn')?.addEventListener('click', () => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '0.5rem';
        div.innerHTML = `
            <input type="text" class="form-input p-tech-input" placeholder="ex: JavaScript" required>
            <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="padding: 0 0.8rem;">&times;</button>
        `;
        techContainer.appendChild(div);
    });

    async function loadProjects() {
        const { data: projects } = await supabaseClient.from('projects').select('*').order('id', { ascending: false });
        const container = document.getElementById('admin-projects-list');

        if (!projects || projects.length === 0) {
            container.innerHTML = `<p>Aucun projet pour le moment.</p>`;
            return;
        }

        container.innerHTML = projects.map(p => {
            const techs = Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || '');
            return `
              <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                <div>
                  <strong>${p.title}</strong> - <small>${techs}</small>
                </div>
                <button class="btn btn-secondary" onclick="deleteProject(${p.id})">Supprimer</button>
              </div>
            `;
        }).join('');
    }

    async function loadMessages() {
        const { data: messages } = await supabaseClient.from('messages').select('*').order('created_at', { ascending: false });
        const container = document.getElementById('admin-messages-list');

        if (!messages || messages.length === 0) {
            container.innerHTML = `<p>Aucun message reçu.</p>`;
            return;
        }

        container.innerHTML = messages.map(m => `
          <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <p><strong>De :</strong> ${m.name} (${m.email})</p>
            <p><strong>Sujet :</strong> ${m.subject}</p>
            <p style="margin-top: 0.5rem;">${m.message}</p>
            <small style="color: var(--text-secondary);">${new Date(m.created_at).toLocaleString()}</small>
          </div>
        `).join('');
    }

    window.deleteProject = async function (id) {
        if (confirm("Supprimer ce projet ?")) {
            await supabaseClient.from('projects').delete().eq('id', id);
            loadProjects();
        }
    };

    // Upload & Drag Drop Images
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('p-files');
    const previewContainer = document.getElementById('preview-container');

    dropZone?.addEventListener('click', () => fileInput?.click());
    ['dragenter', 'dragover'].forEach(name => dropZone?.addEventListener(name, (e) => e.preventDefault()));
    dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
    });

    fileInput?.addEventListener('change', (e) => handleFiles(Array.from(e.target.files)));

    function handleFiles(files) {
        selectedFiles = [...selectedFiles, ...files].slice(0, 10);
        if (previewContainer) {
            previewContainer.innerHTML = selectedFiles.map((f, i) => `
                <img src="${URL.createObjectURL(f)}" class="preview-thumb" alt="Aperçu ${i + 1}">
            `).join('');
        }
    }

    // Soumission Formulaire
    document.getElementById('add-project-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = "Téléversement des images...";

        try {
            const uploadedUrls = [];
            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

                const { error: uploadError } = await supabaseClient.storage.from('project-images').upload(fileName, file);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabaseClient.storage.from('project-images').getPublicUrl(fileName);
                if (publicUrlData?.publicUrl) uploadedUrls.push(publicUrlData.publicUrl);
            }

            // Récupérer toutes les technologies dans une liste JS
            const techInputs = document.querySelectorAll('.p-tech-input');
            const techList = Array.from(techInputs).map(i => i.value.trim()).filter(v => v.length > 0);

            const newProject = {
                title: document.getElementById('p-title').value,
                description: document.getElementById('p-desc').value,
                technologies: techList, // Tableau de texte direct
                image_url: uploadedUrls, // Stocké en tableau JSON
                github_url: document.getElementById('p-github').value || null,
                demo_url: document.getElementById('p-demo').value || null
            };

            const { error } = await supabaseClient.from('projects').insert([newProject]);
            if (error) throw error;

            alert("Projet ajouté avec succès !");
            selectedFiles = [];
            if (previewContainer) previewContainer.innerHTML = '';
            document.getElementById('add-project-form').reset();
            window.closeAdminModal();
            loadProjects();

        } catch (err) {
            alert("Erreur lors de l'ajout : " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Publier le projet";
        }
    });

    loadProjects();
    loadMessages();
});