// js/domains/books.js
import { API, Auth } from '../api.js';

export const BookViews = {
  async renderList(container) {
    const books = await API.request('/books');
    
    let html = `
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold tracking-tight">Books</h2>
        ${Auth.getUser() ? `<button class="bg-slate-800 text-white text-sm px-4 py-2 rounded shadow-sm hover:bg-slate-700">+ New Book</button>` : ''}
      </div>
    `;

    if (!books || books.length === 0) {
      container.innerHTML = html + '<p class="text-slate-500 text-sm">No books found.</p>';
      return;
    }

    html += `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${books.map(b => `
          <a href="#/books/${b.id}" class="group block p-5 border border-slate-200 rounded-md hover:border-slate-400 transition-colors">
            <h3 class="font-medium text-slate-900 group-hover:text-slate-700 truncate">${b.name}</h3>
            <p class="text-sm text-slate-500 mt-1">Published: ${b.date_of_publish || '—'}</p>
          </a>
        `).join('')}
      </div>
    `;
    container.innerHTML = html;
  },

  async renderDetail(container, id) {
    const [book, reviews] = await Promise.all([
      API.request(`/books/${id}`),
      API.request(`/reviews?book_id=${id}`)
    ]);

    if (!book) {
      container.innerHTML = '<p class="text-slate-500">Book not found.</p>';
      return;
    }

    let html = `
      <a href="#/books" class="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-flex items-center gap-1 transition-colors">&larr; Back to Books</a>
      
      <div class="mb-10 bg-slate-50 border border-slate-100 p-6 rounded-md">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-900 mb-2">${book.name}</h2>
        <div class="text-sm text-slate-600 mb-4 flex gap-4">
          <span>Author ID: <a href="#/authors/${book.author_id}" class="text-slate-900 underline">${book.author_id}</a></span>
          <span>Published: ${book.date_of_publish || 'Unknown'}</span>
        </div>
        <p class="text-slate-700 text-sm leading-relaxed">${book.summary || 'No summary available.'}</p>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-4 flex justify-between items-center">
          Reader Reviews
          ${Auth.getUser() ? `<button class="text-sm px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50">+ Add Review</button>` : ''}
        </h3>
    `;

    if (reviews && reviews.length > 0) {
      html += `
        <div class="space-y-4">
          ${reviews.map(r => `
            <div class="border-b border-slate-100 pb-4 last:border-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded">${r.score}/10</span>
                <span class="text-xs text-slate-400">${r.number_of_votes} helpful votes</span>
              </div>
              <p class="text-slate-700 text-sm">${r.review}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      html += `<p class="text-slate-500 text-sm italic">No reviews yet. Be the first to review this book!</p>`;
    }

    container.innerHTML = html;
  }
};