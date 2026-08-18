import { API } from '../api.js';

let searchState = {
  data: [],
  page: 1,
  perPage: 15,
  query: ''
};

export const SearchViews = {
  async renderList(container) {
    // Cargamos todos los libros (con sus autores) una sola vez
    const books = await API.request('/books');
    searchState.data = books || [];
    searchState.page = 1;
    searchState.query = '';

    let html = `
      <div class="mb-8 bg-blue-50 border border-blue-100 p-8 rounded-lg text-center">
        <h2 class="text-3xl font-semibold tracking-tight text-blue-900 mb-3">Summary Search</h2>
        <p class="text-blue-700 text-sm mb-6 max-w-xl mx-auto">
          Type any words below. The system will return a paginated list of books where the summary contains <strong>any</strong> of the words you entered.
        </p>
        <div class="max-w-2xl mx-auto flex gap-2">
          <input type="text" id="summary-search-input" placeholder="e.g. magic dragon mystery..." class="w-full border border-slate-300 rounded-md p-3 text-base focus:outline-none focus:border-blue-500 shadow-sm">
        </div>
      </div>

      <div id="search-results-container"></div>
    `;

    container.innerHTML = html;

    // Escuchar el input para buscar en tiempo real
    document.getElementById('summary-search-input').addEventListener('input', (e) => {
      searchState.query = e.target.value.toLowerCase().trim();
      searchState.page = 1; 
      this.renderResults();
    });

    // Renderizar estado inicial
    this.renderResults();
  },

  renderResults() {
    const listContainer = document.getElementById('search-results-container');
    if (!listContainer) return;

    // 1. LÓGICA DE BÚSQUEDA: Separar por palabras y buscar "alguna" (any)
    const searchWords = searchState.query.split(' ').filter(w => w.length > 0);
    
    const filteredBooks = searchState.data.filter(b => {
      // Si no hay búsqueda, mostramos todos
      if (searchWords.length === 0) return true;
      
      const summary = (b.summary || '').toLowerCase();
      // .some() verifica si AL MENOS UNA palabra del input está en el summary
      return searchWords.some(word => summary.includes(word));
    });

    const totalBooks = filteredBooks.length;

    if (totalBooks === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-10 border border-dashed border-slate-300 rounded-md">
          <p class="text-slate-500 text-lg">No books found.</p>
          <p class="text-slate-400 text-sm mt-1">Try different keywords.</p>
        </div>
      `;
      return;
    }

    // 2. LÓGICA DE PAGINACIÓN
    const totalPages = Math.ceil(totalBooks / searchState.perPage) || 1;
    if (searchState.page > totalPages) searchState.page = totalPages;
    if (searchState.page < 1) searchState.page = 1;

    const startIndex = (searchState.page - 1) * searchState.perPage;
    const paginatedBooks = filteredBooks.slice(startIndex, startIndex + searchState.perPage);

    // 3. RENDERIZAR RESULTADOS
    let html = `
      <div class="mb-4 text-sm text-slate-500 font-medium">
        Found ${totalBooks} book${totalBooks !== 1 ? 's' : ''} matching your words.
      </div>
      <div class="space-y-4">
        ${paginatedBooks.map(b => `
          <div class="bg-white border border-slate-200 p-5 rounded-md hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
              <div>
                <a href="#/books/${b.id}" class="text-lg font-bold text-blue-600 hover:underline">${b.name}</a>
                <p class="text-xs text-slate-500 mt-1">Author: ${b.Author ? b.Author.name : 'ID ' + b.author_id} | Published: ${b.date_of_publish || 'N/A'}</p>
              </div>
              <a href="#/books/${b.id}" class="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors">View Details</a>
            </div>
            <p class="text-slate-700 text-sm mt-3 border-l-4 border-blue-200 pl-3 bg-slate-50 py-2 pr-2 italic">
              ${b.summary || 'No summary available.'}
            </p>
          </div>
        `).join('')}
      </div>
    `;

    // 4. CONTROLES DE PAGINACIÓN
    if (totalPages > 1) {
      html += `
        <div class="flex justify-between items-center mt-8 pt-4 border-t border-slate-200">
          <button id="btn-prev-search" class="text-sm px-4 py-2 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors" ${searchState.page === 1 ? 'disabled' : ''}>&larr; Previous</button>
          <span class="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded">Page ${searchState.page} of ${totalPages}</span>
          <button id="btn-next-search" class="text-sm px-4 py-2 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors" ${searchState.page === totalPages ? 'disabled' : ''}>Next &rarr;</button>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    // Asignar eventos a la paginación
    const btnPrev = document.getElementById('btn-prev-search');
    const btnNext = document.getElementById('btn-next-search');
    if (btnPrev) btnPrev.addEventListener('click', () => { searchState.page--; this.renderResults(); window.scrollTo(0,0); });
    if (btnNext) btnNext.addEventListener('click', () => { searchState.page++; this.renderResults(); window.scrollTo(0,0); });
  }
};