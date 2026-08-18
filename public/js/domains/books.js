import { API, Auth } from '../api.js';


let booksState = {
  data: [],
  page: 1,
  perPage: 15,
  searchQuery: '' 
};


let reviewsState = {
  data: [],
  page: 1,
  perPage: 10,
  sortBy: 'newest'
};

export const BookViews = {
  async renderList(container) {
    const isAdmin = Auth.getUser()?.role === 'admin';
    
    const books = await API.request('/books');
    booksState.data = books || [];
    booksState.page = 1;
    booksState.searchQuery = ''; 

    let html = `
      <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 gap-4">
        <h2 class="text-2xl font-semibold tracking-tight">Books</h2>
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <!-- Buscador de Libros -->
          <input type="text" id="search-book" placeholder="Search by title or author..." class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500 w-full sm:w-64">
          ${isAdmin ? `<button id="btn-new-book" class="bg-slate-800 text-white text-sm px-4 py-2 rounded shadow-sm hover:bg-slate-700 transition-colors whitespace-nowrap">+ New Book</button>` : ''}
        </div>
      </div>

      <!-- Formulario de Creación (Solo Admins) -->
      ${isAdmin ? `
      <div id="form-create-book" class="hidden mb-8 bg-slate-50 border border-slate-200 p-4 rounded-md shadow-sm">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Add New Book</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input type="text" id="create-book-name" placeholder="Book Title" class="sm:col-span-2 border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500">
          <input type="number" id="create-book-author-id" placeholder="Author ID" class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500">
        </div>
        <div class="mb-4">
          <label class="text-xs text-slate-500 mb-1 block">Publish Date</label>
          <input type="date" id="create-book-date" class="border border-slate-300 rounded p-2 text-sm text-slate-600 focus:outline-none focus:border-slate-500">
        </div>
        <textarea id="create-book-summary" placeholder="Book Summary" rows="3" class="w-full border border-slate-300 rounded p-2 text-sm mb-4 focus:outline-none focus:border-slate-500"></textarea>
        <div class="flex gap-2 justify-end">
          <button id="btn-cancel-create-book" class="text-slate-600 text-sm px-4 py-2 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button id="btn-save-create-book" class="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition-colors">Save Book</button>
        </div>
      </div>
      ` : ''}

      <!-- Contenedor dinámico para la grilla paginada de libros -->
      <div id="books-list-container"></div>
    `;

    container.innerHTML = html;

    // Lógica para el buscador (Evento input para buscar en tiempo real)
    document.getElementById('search-book').addEventListener('input', (e) => {
      booksState.searchQuery = e.target.value.toLowerCase();
      booksState.page = 1; 
      this.renderBooksGrid();
    });

    // Lógica para el botón "New Book" (Solo Admins)
    if (isAdmin) {
      document.getElementById('btn-new-book').onclick = () => {
        document.getElementById('form-create-book').classList.remove('hidden');
        document.getElementById('btn-new-book').classList.add('hidden');
      };
      
      document.getElementById('btn-cancel-create-book').onclick = () => {
        document.getElementById('form-create-book').classList.add('hidden');
        document.getElementById('btn-new-book').classList.remove('hidden');
      };

      document.getElementById('btn-save-create-book').onclick = async () => {
        const payload = {
          name: document.getElementById('create-book-name').value,
          author_id: parseInt(document.getElementById('create-book-author-id').value),
          date_of_publish: document.getElementById('create-book-date').value,
          summary: document.getElementById('create-book-summary').value
        };
        if (!payload.name || isNaN(payload.author_id)) return alert('Title and Author ID are required');
        
        const res = await API.request('/books', 'POST', payload);
        if (res) this.renderList(container); 
        else alert('Error creating book. Check if the Author ID exists.');
      };
    }

    // Dibujar la cuadrícula de libros
    this.renderBooksGrid();
  },

  // FUNCIÓN AUXILIAR: Tabla, filtro y paginación para Libros
  renderBooksGrid() {
    const listContainer = document.getElementById('books-list-container');
    if (!listContainer) return;

    // 1. Filtrar los libros por título o nombre del autor
    const filteredBooks = booksState.data.filter(b => {
      const matchTitle = b.name.toLowerCase().includes(booksState.searchQuery);
      const matchAuthor = b.Author && b.Author.name.toLowerCase().includes(booksState.searchQuery);
      return matchTitle || matchAuthor;
    });

    const totalBooks = filteredBooks.length;

    if (totalBooks === 0) {
      listContainer.innerHTML = '<p class="text-slate-500 text-sm py-4">No books found matching your search.</p>';
      return;
    }

    // 2. Aplicar paginación sobre los libros filtrados
    const totalPages = Math.ceil(totalBooks / booksState.perPage) || 1;
    if (booksState.page > totalPages) booksState.page = totalPages;
    if (booksState.page < 1) booksState.page = 1;

    const startIndex = (booksState.page - 1) * booksState.perPage;
    const paginatedBooks = filteredBooks.slice(startIndex, startIndex + booksState.perPage);

    let html = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        ${paginatedBooks.map(b => `
          <a href="#/books/${b.id}" class="group flex flex-col justify-between p-5 border border-slate-200 bg-white rounded-md hover:border-slate-400 hover:shadow-sm transition-all h-full">
            <div>
              <h3 class="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">${b.name}</h3>
              <p class="text-sm text-slate-500 mt-1">Author: ${b.Author ? b.Author.name : 'Unknown'}</p>
            </div>
            <p class="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-2">Published: ${b.date_of_publish || '—'}</p>
          </a>
        `).join('')}
      </div>
    `;

    // 3. Controles de Paginación
    if (totalPages > 1) {
      html += `
        <div class="flex justify-between items-center pt-4 border-t border-slate-100">
          <button id="btn-prev-books" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${booksState.page === 1 ? 'disabled' : ''}>&larr; Previous</button>
          <span class="text-sm text-slate-500 font-medium">Page ${booksState.page} of ${totalPages}</span>
          <button id="btn-next-books" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${booksState.page === totalPages ? 'disabled' : ''}>Next &rarr;</button>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    // 4. Asignar eventos de los botones de paginación
    const btnPrev = document.getElementById('btn-prev-books');
    const btnNext = document.getElementById('btn-next-books');
    if (btnPrev) btnPrev.addEventListener('click', () => { booksState.page--; this.renderBooksGrid(); });
    if (btnNext) btnNext.addEventListener('click', () => { booksState.page++; this.renderBooksGrid(); });
  },

  async renderDetail(container, id) {
    reviewsState = { data: [], page: 1, perPage: 10, sortBy: 'newest' };
    const isAdmin = Auth.getUser()?.role === 'admin';

    const [book, reviews] = await Promise.all([
      API.request(`/books/${id}`),
      API.request(`/reviews?book_id=${id}`) 
    ]);

    if (!book) {
      container.innerHTML = '<p class="text-slate-500">Book not found.</p>';
      return;
    }

    reviewsState.data = reviews || [];

    let html = `
      <div class="flex justify-between mb-6">
        <a href="#/books" class="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">&larr; Back to Books</a>
        ${isAdmin ? `
          <div class="flex gap-2">
            <button id="btn-edit-book" class="text-sm px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors">Edit</button>
            <button id="btn-delete-book" class="text-sm px-3 py-1 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors">Delete</button>
          </div>
        ` : ''}
      </div>
      
      <!-- Vista de Lectura -->
      <div id="book-view-mode" class="mb-10 bg-slate-50 border border-slate-100 p-6 rounded-md">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-900 mb-2">${book.name}</h2>
        <div class="text-sm text-slate-600 mb-4 flex gap-4">
          <span>Author: <a href="#/authors/${book.author_id}" class="text-slate-900 underline font-medium">${book.Author ? book.Author.name : book.author_id}</a></span>
          <span>Published: ${book.date_of_publish || 'Unknown'}</span>
        </div>
        <p class="text-slate-700 text-sm leading-relaxed">${book.summary || 'No summary available.'}</p>
      </div>

      <!-- Vista de Edición (Oculta, Solo Admins) -->
      ${isAdmin ? `
      <div id="book-edit-mode" class="hidden mb-10 bg-slate-50 border border-slate-200 p-6 rounded-md shadow-sm">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Edit Book</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label class="text-xs text-slate-500">Title</label><input type="text" id="edit-book-name" value="${book.name}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Author ID</label><input type="number" id="edit-book-author-id" value="${book.author_id}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Publish Date</label><input type="date" id="edit-book-date" value="${book.date_of_publish}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
        </div>
        <div><label class="text-xs text-slate-500">Summary</label><textarea id="edit-book-summary" rows="4" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 mb-4 focus:outline-none focus:border-slate-500">${book.summary || ''}</textarea></div>
        <div class="flex gap-2 justify-end">
          <button id="btn-cancel-edit-book" class="text-slate-600 text-sm px-4 py-2 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button id="btn-save-edit-book" class="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      </div>
      ` : ''}

      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-4 flex justify-between items-center">
          Reader Reviews
          ${Auth.getUser() ? `<button id="btn-add-review" class="text-sm px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">+ Add Review</button>` : ''}
        </h3>

        <!-- Formulario para crear reseña (Oculto) -->
        <div id="review-form-container" class="hidden mb-6 bg-white border border-slate-200 p-4 rounded-md shadow-sm">
          <h4 class="text-sm font-semibold text-slate-800 mb-3">Write a Review</h4>
          <textarea id="new-review-text" rows="3" class="w-full border border-slate-300 rounded p-2 text-sm mb-3 focus:outline-none focus:border-slate-500" placeholder="What did you think about this book?"></textarea>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-600">Score (1-5):</label>
              <input type="number" id="new-review-score" min="1" max="5" class="border border-slate-300 rounded p-1 text-sm w-16 focus:outline-none focus:border-slate-500">
            </div>
            <div class="flex gap-2">
              <button id="btn-cancel-review" class="text-slate-500 text-sm px-3 py-1 hover:text-slate-800 transition-colors">Cancel</button>
              <button id="btn-submit-review" class="bg-slate-800 text-white px-4 py-1.5 text-sm rounded hover:bg-slate-700 transition-colors">Submit</button>
            </div>
          </div>
        </div>

        <div id="reviews-list-container"></div>
      </div>
    `;

    container.innerHTML = html;

    // Lógica para Editar/Eliminar Libro (Admins)
    if (isAdmin) {
      document.getElementById('btn-edit-book').onclick = () => {
        document.getElementById('book-view-mode').classList.add('hidden');
        document.getElementById('book-edit-mode').classList.remove('hidden');
      };
      
      document.getElementById('btn-cancel-edit-book').onclick = () => {
        document.getElementById('book-edit-mode').classList.add('hidden');
        document.getElementById('book-view-mode').classList.remove('hidden');
      };

      document.getElementById('btn-save-edit-book').onclick = async () => {
        const payload = {
          name: document.getElementById('edit-book-name').value,
          author_id: parseInt(document.getElementById('edit-book-author-id').value),
          date_of_publish: document.getElementById('edit-book-date').value,
          summary: document.getElementById('edit-book-summary').value
        };
        const res = await API.request(`/books/${id}`, 'PUT', payload);
        if (res) this.renderDetail(container, id);
        else alert('Error updating book');
      };

      document.getElementById('btn-delete-book').onclick = async () => {
        if (!confirm(`Are you sure you want to delete "${book.name}"?`)) return;
        const res = await API.request(`/books/${id}`, 'DELETE');
        if (res) window.location.hash = '#/books';
        else alert('Error deleting book.');
      };
    }

    this.renderReviewsList(id);

    // Lógica del Formulario de Reviews
    const btnAddReview = document.getElementById('btn-add-review');
    if (btnAddReview) {
      const formContainer = document.getElementById('review-form-container');
      const btnCancel = document.getElementById('btn-cancel-review');
      const btnSubmit = document.getElementById('btn-submit-review');

      btnAddReview.addEventListener('click', () => {
        formContainer.classList.remove('hidden');
        btnAddReview.classList.add('hidden');
      });

      btnCancel.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        btnAddReview.classList.remove('hidden');
      });

      btnSubmit.addEventListener('click', async () => {
        const reviewText = document.getElementById('new-review-text').value;
        const score = parseInt(document.getElementById('new-review-score').value);

        if (!reviewText.trim() || isNaN(score) || score < 1 || score > 5) {
          alert('Please enter a valid review and a score between 1 and 5.');
          return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Submitting...';

        const payload = { book_id: parseInt(id), review: reviewText, score: score, number_of_votes: 0 };
        const response = await API.request('/reviews', 'POST', payload);

        if (response) {
          await this.renderDetail(container, id);
        } else {
          alert('Failed to save the review. Please try again.');
          btnSubmit.disabled = false;
          btnSubmit.innerText = 'Submit';
        }
      });
    }
  },

  renderReviewsList(bookId) {
    const listContainer = document.getElementById('reviews-list-container');
    if (!listContainer) return;

    let sortedReviews = [...reviewsState.data];
    if (reviewsState.sortBy === 'helpful') {
      sortedReviews.sort((a, b) => (b.number_of_votes || 0) - (a.number_of_votes || 0));
    } else if (reviewsState.sortBy === 'newest') {
      sortedReviews.sort((a, b) => b.id - a.id);
    } else if (reviewsState.sortBy === 'oldest') {
      sortedReviews.sort((a, b) => a.id - b.id);
    }

    const totalReviews = sortedReviews.length;
    const totalPages = Math.ceil(totalReviews / reviewsState.perPage) || 1;
    
    if (reviewsState.page > totalPages) reviewsState.page = totalPages;
    if (reviewsState.page < 1) reviewsState.page = 1;

    const startIndex = (reviewsState.page - 1) * reviewsState.perPage;
    const paginatedReviews = sortedReviews.slice(startIndex, startIndex + reviewsState.perPage);

    let html = '';

    if (totalReviews > 0) {
      html += `
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <span class="text-sm text-slate-500">${totalReviews} review${totalReviews !== 1 ? 's' : ''}</span>
          <select id="review-sort-select" class="text-sm border border-slate-200 rounded py-1 px-2 text-slate-600 focus:outline-none focus:border-slate-500 bg-white">
            <option value="helpful" ${reviewsState.sortBy === 'helpful' ? 'selected' : ''}>Most Helpful</option>
            <option value="newest" ${reviewsState.sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${reviewsState.sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
          </select>
        </div>
      `;

      html += `<div class="space-y-4">`;
      paginatedReviews.forEach(r => {
        html += `
          <div class="pb-4 border-b border-slate-50 last:border-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <span class="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded">${r.score}/5</span>
                <span class="text-xs text-slate-500">${r.number_of_votes || 0} people found this helpful</span>
              </div>
              ${Auth.getUser() ? `<button class="btn-helpful flex items-center gap-1 text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-2 py-1 rounded transition-colors" data-id="${r.id}" data-votes="${r.number_of_votes || 0}">
                Mark as Helpful
              </button>`:''}
            </div>
            <p class="text-slate-700 text-sm">${r.review}</p>
          </div>
        `;
      });
      html += `</div>`;

      if (totalPages > 1) {
        html += `
          <div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
            <button id="btn-prev-page" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${reviewsState.page === 1 ? 'disabled' : ''}>&larr; Previous</button>
            <span class="text-sm text-slate-500 font-medium">Page ${reviewsState.page} of ${totalPages}</span>
            <button id="btn-next-page" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${reviewsState.page === totalPages ? 'disabled' : ''}>Next &rarr;</button>
          </div>
        `;
      }
    } else {
      html += `<p class="text-slate-500 text-sm italic py-4 text-center border border-dashed border-slate-200 rounded-md">No reviews yet. Be the first to review this book!</p>`;
    }

    listContainer.innerHTML = html;

    const sortSelect = document.getElementById('review-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        reviewsState.sortBy = e.target.value;
        reviewsState.page = 1; 
        this.renderReviewsList(bookId);
      });
    }

    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    if (btnPrev) btnPrev.addEventListener('click', () => { reviewsState.page--; this.renderReviewsList(bookId); });
    if (btnNext) btnNext.addEventListener('click', () => { reviewsState.page++; this.renderReviewsList(bookId); });

    const helpfulBtns = listContainer.querySelectorAll('.btn-helpful');
    helpfulBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const reviewId = btn.getAttribute('data-id');
        const currentVotes = parseInt(btn.getAttribute('data-votes'));
        
        btn.disabled = true;
        btn.innerHTML = '...';

        const reviewIndex = reviewsState.data.findIndex(r => r.id == reviewId);
        if (reviewIndex === -1) return;

        const reviewData = reviewsState.data[reviewIndex];
        const newVotes = currentVotes + 1;

        const payload = {
          book_id: reviewData.book_id,
          review: reviewData.review,
          score: reviewData.score,
          number_of_votes: newVotes
        };

        const response = await API.request(`/reviews/${reviewId}/vote`, 'POST', payload);

        if (response) {
          reviewsState.data[reviewIndex].number_of_votes = newVotes;
          this.renderReviewsList(bookId);
        } else {
          alert('Could not record your vote.');
          btn.disabled = false;
          btn.innerHTML = 'Mark as Helpful';
        }
      });
    });
  }
};