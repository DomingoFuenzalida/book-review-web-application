import { API } from '../api.js';

export const ReportViews = {
  async renderList(container) {
    container.innerHTML = `<div class="animate-pulse text-slate-500 text-sm">Loading reports...</div>`;

    try {
      const [top10, top50] = await Promise.all([
        API.request('/reports/top-10-rated'),
        API.request('/reports/top-50-selling')
      ]);

      const safeTop10 = top10 || [];
      const safeTop50 = top50 || [];

      let html = `
        <h2 class="text-3xl font-semibold tracking-tight text-slate-900 mb-8">System Reports</h2>

        <!-- REPORT 1: Top 10 Rated Books -->
        <div class="mb-12">
          <h3 class="text-xl font-semibold text-slate-800 mb-4">Top 10 Rated Books of All Time</h3>
          <div class="overflow-x-auto bg-white border border-slate-200 rounded-md shadow-sm">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 font-medium">Book Title</th>
                  <th class="px-4 py-3 font-medium text-center">Avg Score</th>
                  <th class="px-4 py-3 font-medium">Highest Rated Review</th>
                  <th class="px-4 py-3 font-medium">Lowest Rated Review</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${safeTop10.length ? safeTop10.map(b => `
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">${b.name}</td>
                    <td class="px-4 py-3 font-bold text-blue-600 text-center">${parseFloat(b.avg_score || 0).toFixed(1)}</td>
                    <td class="px-4 py-3 text-xs italic text-green-700 max-w-[200px] truncate" title="${b.highest_review}">"${b.highest_review || '—'}"</td>
                    <td class="px-4 py-3 text-xs italic text-red-700 max-w-[200px] truncate" title="${b.lowest_review}">"${b.lowest_review || '—'}"</td>
                  </tr>
                `).join('') : `<tr><td colspan="4" class="p-4 text-center text-slate-500">No data available from API</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- REPORT 2: Top 50 Selling Books -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-slate-800 mb-4">Top 50 Selling Books</h3>
          <div class="overflow-x-auto bg-white border border-slate-200 rounded-md shadow-sm">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 font-medium">Rank</th>
                  <th class="px-4 py-3 font-medium">Book Title</th>
                  <th class="px-4 py-3 font-medium">Total Book Sales</th>
                  <th class="px-4 py-3 font-medium">Author's Total Sales</th>
                  <th class="px-4 py-3 font-medium text-center">Top 5 in Pub Year?</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${safeTop50.length ? safeTop50.map((b, i) => `
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-400">#${i+1}</td>
                    <td class="px-4 py-3 font-medium text-slate-900">${b.name}</td>
                    <td class="px-4 py-3 font-semibold text-emerald-600">${Number(b.book_sales).toLocaleString()}</td>
                    <td class="px-4 py-3">${Number(b.author_sales).toLocaleString()}</td>
                    <td class="px-4 py-3 text-center">
                      ${b.top_5_year ? '<span class="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">YES</span>' : '<span class="text-slate-400">—</span>'}
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="5" class="p-4 text-center text-slate-500">No data available from API</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      container.innerHTML = `<p class="text-red-500 text-sm">Error loading reports. Check the console for details.</p>`;
      console.error(error);
    }
  }
};