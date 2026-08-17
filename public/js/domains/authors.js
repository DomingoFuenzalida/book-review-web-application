import { API, Auth } from '../api.js';

export const AuthorViews = {
  async renderList(container) {
    const authors = await API.request('/authors');
    
    let html = `
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold tracking-tight">Authors</h2>
        ${Auth.getUser() ? `<button class="bg-slate-800 text-white text-sm px-4 py-2 rounded shadow-sm hover:bg-slate-700">+ New Author</button>` : ''}
      </div>
    `;

    if (!authors || authors.length === 0) {
      container.innerHTML = html + '<p class="text-slate-500 text-sm">No authors found.</p>';
      return;
    }

    html += `
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
            ${authors.map(a => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-medium text-slate-900">${a.name}</td>
                <td class="px-4 py-3">${a.country || '—'}</td>
                <td class="px-4 py-3 text-right">
                  <a href="#/authors/${a.id}" class="text-slate-500 hover:text-slate-900 font-medium">View</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  async renderDetail(container, id) {
    const [author, books] = await Promise.all([
      API.request(`/authors/${id}`),
      API.request(`/books?author_id=${id}`) // Fetches specific books for this author
    ]);

    if (!author) {
      container.innerHTML = '<p class="text-slate-500">Author not found.</p>';
      return;
    }

    let html = `
      <a href="#/authors" class="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-flex items-center gap-1 transition-colors">&larr; Back to Authors</a>
      
      <div class="mb-10">
        <h2 class="text-3xl font-semibold tracking-tight text-slate-900 mb-1">${author.name}</h2>
        <div class="text-sm text-slate-500 mb-4 flex gap-4">
          <span>Born: ${author.birth_date || 'Unknown'}</span>
          <span>Location: ${author.country || 'Unknown'}</span>
        </div>
        <p class="text-slate-700 leading-relaxed max-w-3xl">${author.description || 'No biography available.'}</p>
      </div>

      <div class="border-t border-slate-200 pt-8">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Bibliography</h3>
    `;

    if (books && books.length > 0) {
      html += `
        <ul class="space-y-3">
          ${books.map(b => `
            <li class="flex items-center justify-between p-4 rounded-md border border-slate-100 bg-slate-50">
              <div>
                <a href="#/books/${b.id}" class="font-medium text-slate-900 hover:underline">${b.name}</a>
                <p class="text-sm text-slate-500 mt-0.5">Published: ${b.date_of_publish || 'N/A'}</p>
              </div>
              <a href="#/books/${b.id}" class="text-sm px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:border-slate-400 transition-colors">Details</a>
            </li>
          `).join('')}
        </ul>
      `;
    } else {
      html += `<p class="text-slate-500 text-sm">No books registered for this author.</p>`;
    }

    container.innerHTML = html;
  }
};