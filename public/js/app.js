import { Auth } from './api.js';
import { AuthorViews } from './domains/authors.js';
import { BookViews } from './domains/books.js';

const appRoot = document.getElementById('app-root');
const authSection = document.getElementById('auth-section');

async function router() {
  const hash = window.location.hash.slice(1) || '/authors';
  const parts = hash.split('/').filter(Boolean);
  
  const domain = parts[0] || 'authors';
  const id = parts[1]; 

  // Update Nav highlighting
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#/${domain}`);
  });

  appRoot.innerHTML = '<div class="animate-pulse text-slate-400 text-sm">Loading...</div>';

  if (domain === 'authors') {
    if (id) await AuthorViews.renderDetail(appRoot, id);
    else await AuthorViews.renderList(appRoot);
  } else if (domain === 'books') {
    if (id) await BookViews.renderDetail(appRoot, id);
    else await BookViews.renderList(appRoot);
  } else {
    appRoot.innerHTML = `<h2 class="text-xl font-medium text-slate-800">404 - Page Not Found</h2>`;
  }
}

function renderAuth() {
  const user = Auth.getUser();
  if (user) {
    authSection.innerHTML = `
      <span class="text-slate-600">Logged in as <span class="font-medium text-slate-900">${user.username}</span></span>
      <button id="btn-logout" class="text-slate-500 hover:text-slate-900 font-medium">Logout</button>
    `;
    document.getElementById('btn-logout').onclick = () => { Auth.logout(); renderAuth(); router(); };
  } else {
    authSection.innerHTML = `
      <input type="text" id="username" placeholder="Username" class="border border-slate-300 px-2 py-1.5 rounded text-sm w-32 focus:outline-none focus:border-slate-500" />
      <input type="password" id="password" placeholder="Password" class="border border-slate-300 px-2 py-1.5 rounded text-sm w-32 focus:outline-none focus:border-slate-500" />
      <button id="btn-login" class="bg-slate-800 text-white px-4 py-1.5 rounded hover:bg-slate-700 font-medium transition-colors">Log In</button>
    `;
    document.getElementById('btn-login').onclick = async () => {
      const res = await Auth.login(document.getElementById('username').value, document.getElementById('password').value);
      if (res.success) { renderAuth(); router(); } 
      else { alert(res.message); }
    };
  }
}

window.addEventListener('hashchange', router);
renderAuth();
router();