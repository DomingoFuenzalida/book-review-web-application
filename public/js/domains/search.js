import { API } from '../api.js';

let searchState = {
  data: [],
  page: 1,
  total: 0,
  perPage: 10,
  query: ''
};

let searchTimeout = null;

export const SearchViews = {
  async renderList(container) {
    searchState.query = '';
    searchState.page = 1;

    let html = `
      <div class="mb-8 bg-blue-50 border border-blue-100 p-8 rounded-lg text-center">
        <h2 class="text-3xl font-semibold tracking-tight text-blue-900 mb-3">Search Books</h2>
        <p class="text-blue-700 text-sm mb-6 max-w-xl mx-auto">
          Type any words below. The system will return a paginated, relevance-ranked list of books matching the words.
        </p>
        <div class="max-w-2xl mx-auto flex gap-2">
          <input type="text" id="summary-search-input" placeholder="e.g. magic dragon mystery..." class="w-full border border-slate-300 rounded-md p-3 text-base focus:outline-none focus:border-blue-500 shadow-sm">
        </div>
      </div>

      <div id="search-results-container"></div>
    `;

    container.innerHTML = html;

    document.getElementById('summary-search-input').addEventListener('input', (e) => {
      searchState.query = e.target.value.trim();
      searchState.page = 1; 
      
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.fetchAndRenderResults();
      }, 300);
    });

    await this.fetchAndRenderResults();
  },

  async fetchAndRenderResults() {
    const listContainer = document.getElementById('search-results-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '<div class="text-center py-10"><p class="text-slate-500">Searching...</p></div>';
    
    try {
      const q = encodeURIComponent(searchState.query);
      const res = await API.request(`/books/search?q=${q}&page=${searchState.page}`);
      
      searchState.data = res.data || [];
      searchState.total = res.total || 0;
      searchState.perPage = res.per_page || 10;
      
      this.renderResultsHTML(listContainer);
    } catch (err) {
      listContainer.innerHTML = '<div class="text-center py-10 text-red-500">Error searching books</div>';
    }
  },

  renderResultsHTML(listContainer) {
    const totalBooks = searchState.total;

    if (totalBooks === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-10 border border-dashed border-slate-300 rounded-md">
          <p class="text-slate-500 text-lg">No books found.</p>
          <p class="text-slate-400 text-sm mt-1">Try different keywords.</p>
        </div>
      `;
      return;
    }

    const totalPages = Math.ceil(totalBooks / searchState.perPage) || 1;

    let html = `
      <div class="mb-4 text-sm text-slate-500 font-medium">
        Found ${totalBooks} book${totalBooks !== 1 ? 's' : ''} matching your words.
      </div>
      <div class="space-y-4">
        ${searchState.data.map(b => `
          <div class="bg-white border border-slate-200 p-5 rounded-md hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
              <div>
                <a href="#/books/${b.id}" class="text-lg font-bold text-blue-600 hover:underline">${b.name}</a>
                <p class="text-xs text-slate-500 mt-1">Author: ${b.Author ? b.Author.name : (b.author_id ? 'ID ' + b.author_id : 'Unknown')} | Published: ${b.date_of_publish || 'N/A'}</p>
                ${b.score ? `<p class="text-xs text-green-600 mt-1">Relevance Score: ${b.score.toFixed(2)}</p>` : ''}
              </div>
              <a href="#/books/${b.id}" class="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors">View Details</a>
            </div>
            <p class="text-slate-700 text-sm mt-3 border-l-4 border-blue-200 pl-3 bg-slate-50 py-2 pr-2 italic">
              ${b.summary || 'No summary available.'}
            </p>
            ${b.matchedReviews?.length ? `
              <div class="mt-4 border-t border-slate-200 pt-3">
                <p class="text-xs font-semibold text-slate-500 mb-2">Matching Reviews</p>
                <ul class="space-y-2">
                  ${b.matchedReviews.map(review => `
                    <li class="text-sm text-slate-600 italic">
                      "${review}"
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

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

    const btnPrev = document.getElementById('btn-prev-search');
    const btnNext = document.getElementById('btn-next-search');
    if (btnPrev) btnPrev.addEventListener('click', () => { searchState.page--; this.fetchAndRenderResults(); window.scrollTo(0,0); });
    if (btnNext) btnNext.addEventListener('click', () => { searchState.page++; this.fetchAndRenderResults(); window.scrollTo(0,0); });
  }
};