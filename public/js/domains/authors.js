import { API, Auth } from '../api.js';

// Estado local para paginar y buscar autores
let authorsState = {
  data: [],
  page: 1,
  perPage: 30, 
  searchQuery: '' 
};

export const AuthorViews = {
  async renderList(container) {
    const authors = await API.request('/authors');
    const isAdmin = Auth.getUser()?.role === 'admin';
    
    // Guardar en el estado local
    authorsState.data = authors || [];
    authorsState.page = 1;
    authorsState.searchQuery = '';

    let html = `
      <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 gap-4">
        <h2 class="text-2xl font-semibold tracking-tight">Authors</h2>
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <!-- Buscador de Autores -->
          <input type="text" id="search-author" placeholder="Search by name or country..." class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500 w-full sm:w-64">
          ${isAdmin ? `<button id="btn-new-author" class="bg-slate-800 text-white text-sm px-4 py-2 rounded shadow-sm hover:bg-slate-700 transition-colors whitespace-nowrap">+ New Author</button>` : ''}
        </div>
      </div>

      <!-- Formulario de Creación (Solo Admins) -->
      ${isAdmin ? `
      <div id="form-create-author" class="hidden mb-8 bg-slate-50 border border-slate-200 p-4 rounded-md shadow-sm">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Create New Author</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input type="text" id="create-author-name" placeholder="Name" class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500">
          <input type="date" id="create-author-dob" class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500 text-slate-600">
          <input type="text" id="create-author-country" placeholder="Country" class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500">
        </div>
        <textarea id="create-author-desc" placeholder="Description / Biography" rows="3" class="w-full border border-slate-300 rounded p-2 text-sm mb-4 focus:outline-none focus:border-slate-500"></textarea>
        <div class="flex gap-2 justify-end">
          <button id="btn-cancel-create" class="text-slate-600 text-sm px-4 py-2 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button id="btn-save-create" class="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition-colors">Save Author</button>
        </div>
      </div>
      ` : ''}

      <!-- Contenedor dinámico donde se renderizará la tabla paginada/filtrada -->
      <div id="authors-list-container"></div>
    `;

    container.innerHTML = html;

    // Lógica para el buscador (Evento input para buscar en tiempo real)
    document.getElementById('search-author').addEventListener('input', (e) => {
      authorsState.searchQuery = e.target.value.toLowerCase();
      authorsState.page = 1; // Al buscar, siempre regresamos a la página 1
      this.renderAuthorsTable();
    });

    // Lógica para Crear (Admins)
    if (isAdmin) {
      document.getElementById('btn-new-author').onclick = () => {
        document.getElementById('form-create-author').classList.remove('hidden');
        document.getElementById('btn-new-author').classList.add('hidden');
      };
      
      document.getElementById('btn-cancel-create').onclick = () => {
        document.getElementById('form-create-author').classList.add('hidden');
        document.getElementById('btn-new-author').classList.remove('hidden');
      };

      document.getElementById('btn-save-create').onclick = async () => {
        const payload = {
          name: document.getElementById('create-author-name').value,
          birth_date: document.getElementById('create-author-dob').value,
          country: document.getElementById('create-author-country').value,
          description: document.getElementById('create-author-desc').value
        };
        if (!payload.name) return alert('Name is required');
        
        const res = await API.request('/authors', 'POST', payload);
        if (res) this.renderList(container); 
        else alert('Error creating author');
      };
    }

    // Dibujar la tabla por primera vez
    this.renderAuthorsTable();
  },

  // FUNCIÓN AUXILIAR: Tabla, filtro y paginación
  renderAuthorsTable() {
    const listContainer = document.getElementById('authors-list-container');
    if (!listContainer) return;

    // 1. Filtrar los datos locales
    const filteredAuthors = authorsState.data.filter(a => {
      const matchName = a.name.toLowerCase().includes(authorsState.searchQuery);
      const matchCountry = a.country && a.country.toLowerCase().includes(authorsState.searchQuery);
      return matchName || matchCountry;
    });

    const totalAuthors = filteredAuthors.length;

    if (totalAuthors === 0) {
      listContainer.innerHTML = '<p class="text-slate-500 text-sm py-4">No authors found matching your search.</p>';
      return;
    }

    // 2. Paginación
    const totalPages = Math.ceil(totalAuthors / authorsState.perPage) || 1;
    if (authorsState.page > totalPages) authorsState.page = totalPages;
    if (authorsState.page < 1) authorsState.page = 1;

    const startIndex = (authorsState.page - 1) * authorsState.perPage;
    const paginatedAuthors = filteredAuthors.slice(startIndex, startIndex + authorsState.perPage);

    // 3. Render HTML
    let html = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Country</th>
              <th class="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${paginatedAuthors.map(a => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-medium text-slate-900">${a.name}</td>
                <td class="px-4 py-3">${a.country || '—'}</td>
                <td class="px-4 py-3 text-right">
                  <a href="#/authors/${a.id}" class="text-blue-600 hover:text-blue-800 font-medium">View</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 4. Controles de paginación
    if (totalPages > 1) {
      html += `
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
          <button id="btn-prev-authors" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${authorsState.page === 1 ? 'disabled' : ''}>&larr; Previous</button>
          <span class="text-sm text-slate-500 font-medium">Page ${authorsState.page} of ${totalPages}</span>
          <button id="btn-next-authors" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${authorsState.page === totalPages ? 'disabled' : ''}>Next &rarr;</button>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    // 5. Asignar Eventos a los botones de paginación
    const btnPrev = document.getElementById('btn-prev-authors');
    const btnNext = document.getElementById('btn-next-authors');
    if (btnPrev) btnPrev.addEventListener('click', () => { authorsState.page--; this.renderAuthorsTable(); });
    if (btnNext) btnNext.addEventListener('click', () => { authorsState.page++; this.renderAuthorsTable(); });
  },

  async renderDetail(container, id) {
    const [author, books] = await Promise.all([
      API.request(`/authors/${id}`),
      API.request(`/books?author_id=${id}`) 
    ]);
    const isAdmin = Auth.getUser()?.role === 'admin';

    if (!author) {
      container.innerHTML = '<p class="text-slate-500">Author not found.</p>';
      return;
    }

    let html = `
      <div class="flex justify-between mb-6">
        <a href="#/authors" class="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">&larr; Back to Authors</a>
        ${isAdmin ? `
          <div class="flex gap-2">
            <button id="btn-edit-author" class="text-sm px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors">Edit</button>
            <button id="btn-delete-author" class="text-sm px-3 py-1 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors">Delete</button>
          </div>
        ` : ''}
      </div>
      
      <!-- Vista de Lectura -->
      <div id="author-view-mode" class="mb-10">
        <h2 class="text-3xl font-semibold tracking-tight text-slate-900 mb-1">${author.name}</h2>
        <div class="text-sm text-slate-500 mb-4 flex gap-4">
          <span>Born: ${author.birth_date || 'Unknown'}</span>
          <span>Location: ${author.country || 'Unknown'}</span>
        </div>
        <p class="text-slate-700 leading-relaxed max-w-3xl">${author.description || 'No biography available.'}</p>
      </div>

      <!-- Vista de Edición (Oculta) -->
      ${isAdmin ? `
      <div id="author-edit-mode" class="hidden mb-10 bg-slate-50 border border-slate-200 p-6 rounded-md shadow-sm">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Edit Author</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label class="text-xs text-slate-500">Name</label><input type="text" id="edit-author-name" value="${author.name}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Birth Date</label><input type="date" id="edit-author-dob" value="${author.birth_date}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Country</label><input type="text" id="edit-author-country" value="${author.country || ''}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
        </div>
        <div><label class="text-xs text-slate-500">Description</label><textarea id="edit-author-desc" rows="4" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 mb-4 focus:outline-none focus:border-slate-500">${author.description || ''}</textarea></div>
        <div class="flex gap-2 justify-end">
          <button id="btn-cancel-edit" class="text-slate-600 text-sm px-4 py-2 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button id="btn-save-edit" class="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      </div>
      ` : ''}

      <div class="border-t border-slate-200 pt-8">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Bibliography</h3>
    `;

    if (books && books.length > 0) {
      html += `
        <ul class="space-y-3">
          ${books.map(b => `
            <li class="flex items-center justify-between p-4 rounded-md border border-slate-100 bg-slate-50">
              <div>
                <a href="#/books/${b.id}" class="font-medium text-slate-900 hover:text-blue-600 transition-colors">${b.name}</a>
                <p class="text-sm text-slate-500 mt-0.5">Published: ${b.date_of_publish || 'N/A'}</p>
              </div>
            </li>
          `).join('')}
        </ul>
      `;
    } else {
      html += `<p class="text-slate-500 text-sm">No books registered for this author.</p>`;
    }

    container.innerHTML = html;

    // Lógica para Editar/Eliminar (Admins)
    if (isAdmin) {
      document.getElementById('btn-edit-author').onclick = () => {
        document.getElementById('author-view-mode').classList.add('hidden');
        document.getElementById('author-edit-mode').classList.remove('hidden');
      };
      
      document.getElementById('btn-cancel-edit').onclick = () => {
        document.getElementById('author-edit-mode').classList.add('hidden');
        document.getElementById('author-view-mode').classList.remove('hidden');
      };

      document.getElementById('btn-save-edit').onclick = async () => {
        const payload = {
          name: document.getElementById('edit-author-name').value,
          birth_date: document.getElementById('edit-author-dob').value,
          country: document.getElementById('edit-author-country').value,
          description: document.getElementById('edit-author-desc').value
        };
        const res = await API.request(`/authors/${id}`, 'PUT', payload);
        if (res) this.renderDetail(container, id); // Recargar detalle
        else alert('Error updating author');
      };

      document.getElementById('btn-delete-author').onclick = async () => {
        if (!confirm(`Are you sure you want to delete "${author.name}"? This action cannot be undone.`)) return;
        const res = await API.request(`/authors/${id}`, 'DELETE');
        if (res) window.location.hash = '#/authors'; // Volver a la lista
        else alert('Error deleting author. Make sure they have no linked books first.');
      };
    }
  }
};