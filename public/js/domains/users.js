import { API, Auth } from '../api.js';


let usersState = {
  data: [],
  page: 1,
  perPage: 15,
  searchQuery: ''
};

export const UserViews = {
  async renderList(container) {
    const user = Auth.getUser();
    
    // Protección estricta: Solo admins
    if (!user || user.role !== 'admin') {
      container.innerHTML = `
        <div class="text-center py-10">
          <h2 class="text-2xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p class="text-slate-600">You must be an administrator to view this page.</p>
        </div>
      `;
      return;
    }

    // Obtener y guardar todos los usuarios
    const users = await API.request('/users');
    usersState.data = users || [];
    usersState.page = 1;
    usersState.searchQuery = '';

    let html = `
      <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 gap-4">
        <h2 class="text-2xl font-semibold tracking-tight">System Users</h2>
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input type="text" id="search-user" placeholder="Search by name, username or email..." class="border border-slate-300 rounded p-2 text-sm focus:outline-none focus:border-slate-500 w-full sm:w-72">
          <button id="btn-new-user" class="bg-slate-800 text-white text-sm px-4 py-2 rounded shadow-sm hover:bg-slate-700 transition-colors whitespace-nowrap">+ New User</button>
        </div>
      </div>

      <!-- Formulario de Creación -->
      <div id="form-create-user" class="hidden mb-8 bg-slate-50 border border-slate-200 p-6 rounded-md shadow-sm">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Create New User</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label class="text-xs text-slate-500">First Name</label><input type="text" id="create-user-firstname" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Last Name</label><input type="text" id="create-user-lastname" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Username</label><input type="text" id="create-user-username" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Email</label><input type="email" id="create-user-email" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Password</label><input type="password" id="create-user-password" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div>
            <label class="text-xs text-slate-500">Role</label>
            <select id="create-user-role" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500 bg-white">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button id="btn-cancel-create-user" class="text-slate-600 text-sm px-4 py-2 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button id="btn-save-create-user" class="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition-colors">Save User</button>
        </div>
      </div>

      <!-- Contenedor de la tabla -->
      <div id="users-list-container"></div>
    `;

    container.innerHTML = html;

    // Buscador
    document.getElementById('search-user').addEventListener('input', (e) => {
      usersState.searchQuery = e.target.value.toLowerCase();
      usersState.page = 1; 
      this.renderUsersTable();
    });

    // Crear Usuario
    document.getElementById('btn-new-user').onclick = () => {
      document.getElementById('form-create-user').classList.remove('hidden');
      document.getElementById('btn-new-user').classList.add('hidden');
    };
    
    document.getElementById('btn-cancel-create-user').onclick = () => {
      document.getElementById('form-create-user').classList.add('hidden');
      document.getElementById('btn-new-user').classList.remove('hidden');
    };

    document.getElementById('btn-save-create-user').onclick = async () => {
      const payload = {
        first_name: document.getElementById('create-user-firstname').value,
        last_name: document.getElementById('create-user-lastname').value,
        username: document.getElementById('create-user-username').value,
        email: document.getElementById('create-user-email').value,
        password: document.getElementById('create-user-password').value,
        role: document.getElementById('create-user-role').value
      };

      if (!payload.username || !payload.password || !payload.email) {
        return alert('Username, Email, and Password are required.');
      }
      
      const res = await API.request('/users', 'POST', payload);
      if (res) this.renderList(container); 
      else alert('Error creating user. Username or email might already exist.');
    };

    this.renderUsersTable();
  },

  renderUsersTable() {
    const listContainer = document.getElementById('users-list-container');
    if (!listContainer) return;

    // Filtrar
    const filteredUsers = usersState.data.filter(u => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const matchName = fullName.includes(usersState.searchQuery);
      const matchUsername = u.username && u.username.toLowerCase().includes(usersState.searchQuery);
      const matchEmail = u.email && u.email.toLowerCase().includes(usersState.searchQuery);
      return matchName || matchUsername || matchEmail;
    });

    const totalUsers = filteredUsers.length;

    if (totalUsers === 0) {
      listContainer.innerHTML = '<p class="text-slate-500 text-sm py-4">No users found.</p>';
      return;
    }

    // Paginar
    const totalPages = Math.ceil(totalUsers / usersState.perPage) || 1;
    if (usersState.page > totalPages) usersState.page = totalPages;
    if (usersState.page < 1) usersState.page = 1;

    const startIndex = (usersState.page - 1) * usersState.perPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersState.perPage);

    let html = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Username</th>
              <th class="px-4 py-3 font-medium">Email</th>
              <th class="px-4 py-3 font-medium">Role</th>
              <th class="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${paginatedUsers.map(u => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-medium text-slate-900">${u.first_name || ''} ${u.last_name || ''}</td>
                <td class="px-4 py-3">${u.username}</td>
                <td class="px-4 py-3">${u.email || '—'}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}">
                    ${u.role}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <a href="#/users/${u.id}" class="text-blue-600 hover:text-blue-800 font-medium">View</a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Paginación UI
    if (totalPages > 1) {
      html += `
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
          <button id="btn-prev-users" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${usersState.page === 1 ? 'disabled' : ''}>&larr; Previous</button>
          <span class="text-sm text-slate-500 font-medium">Page ${usersState.page} of ${totalPages}</span>
          <button id="btn-next-users" class="text-sm px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed" ${usersState.page === totalPages ? 'disabled' : ''}>Next &rarr;</button>
        </div>
      `;
    }

    listContainer.innerHTML = html;

    const btnPrev = document.getElementById('btn-prev-users');
    const btnNext = document.getElementById('btn-next-users');
    if (btnPrev) btnPrev.addEventListener('click', () => { usersState.page--; this.renderUsersTable(); });
    if (btnNext) btnNext.addEventListener('click', () => { usersState.page++; this.renderUsersTable(); });
  },

  async renderDetail(container, id) {
    const adminUser = Auth.getUser();
    if (!adminUser || adminUser.role !== 'admin') {
      container.innerHTML = '<p class="text-red-500">Access Denied</p>';
      return;
    }

    const user = await API.request(`/users/${id}`);
    if (!user) {
      container.innerHTML = '<p class="text-slate-500">User not found.</p>';
      return;
    }

    let html = `
      <div class="flex justify-between mb-6">
        <a href="#/users" class="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">&larr; Back to Users</a>
        <div class="flex gap-2">
          <button id="btn-edit-user" class="text-sm px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors">Edit</button>
          <button id="btn-delete-user" class="text-sm px-3 py-1 bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100 transition-colors" ${adminUser.id === user.id ? 'disabled title="You cannot delete yourself"' : ''}>Delete</button>
        </div>
      </div>
      
      <!-- Vista de Lectura -->
      <div id="user-view-mode" class="mb-10 bg-slate-50 border border-slate-100 p-6 rounded-md">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 uppercase">
            ${(user.first_name?.[0] || '')}${(user.last_name?.[0] || '')}
          </div>
          <div>
            <h2 class="text-2xl font-semibold tracking-tight text-slate-900">${user.first_name || ''} ${user.last_name || ''}</h2>
            <p class="text-slate-500">@${user.username}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <span class="block text-slate-500 mb-1">Email Address</span>
            <span class="font-medium text-slate-900">${user.email || '—'}</span>
          </div>
          <div>
            <span class="block text-slate-500 mb-1">Account Role</span>
            <span class="px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}">${user.role}</span>
          </div>
        </div>
      </div>

      <!-- Vista de Edición (Oculta) -->
      <div id="user-edit-mode" class="hidden mb-10 bg-slate-50 border border-slate-200 p-6 rounded-md shadow-sm">
        <h3 class="text-lg font-medium text-slate-900 mb-4">Edit User Profile</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div><label class="text-xs text-slate-500">First Name</label><input type="text" id="edit-user-firstname" value="${user.first_name || ''}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Last Name</label><input type="text" id="edit-user-lastname" value="${user.last_name || ''}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Username</label><input type="text" id="edit-user-username" value="${user.username}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">Email</label><input type="email" id="edit-user-email" value="${user.email || ''}" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div><label class="text-xs text-slate-500">New Password (optional)</label><input type="password" id="edit-user-password" placeholder="Leave blank to keep current" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500"></div>
          <div>
            <label class="text-xs text-slate-500">Role</label>
            <select id="edit-user-role" class="w-full border border-slate-300 rounded p-2 text-sm mt-1 focus:outline-none focus:border-slate-500 bg-white" ${adminUser.id === user.id ? 'disabled title="Cannot change your own role"' : ''}>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button id="btn-cancel-edit-user" class="text-slate-600 text-sm px-4 py-2 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button id="btn-save-edit-user" class="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Eventos Editar / Borrar
    document.getElementById('btn-edit-user').onclick = () => {
      document.getElementById('user-view-mode').classList.add('hidden');
      document.getElementById('user-edit-mode').classList.remove('hidden');
    };
    
    document.getElementById('btn-cancel-edit-user').onclick = () => {
      document.getElementById('user-edit-mode').classList.add('hidden');
      document.getElementById('user-view-mode').classList.remove('hidden');
    };

    document.getElementById('btn-save-edit-user').onclick = async () => {
      const payload = {
        first_name: document.getElementById('edit-user-firstname').value,
        last_name: document.getElementById('edit-user-lastname').value,
        username: document.getElementById('edit-user-username').value,
        email: document.getElementById('edit-user-email').value,
        role: document.getElementById('edit-user-role').value
      };

      // Si escribió una contraseña nueva, la añadimos al payload
      const pass = document.getElementById('edit-user-password').value;
      if (pass.trim() !== '') {
        payload.password = pass;
      }

      const res = await API.request(`/users/${id}`, 'PUT', payload);
      if (res) this.renderDetail(container, id);
      else alert('Error updating user.');
    };

    const btnDelete = document.getElementById('btn-delete-user');
    if (btnDelete && adminUser.id !== user.id) {
      btnDelete.onclick = async () => {
        if (!confirm(`Are you sure you want to delete user @${user.username}?`)) return;
        const res = await API.request(`/users/${id}`, 'DELETE');
        if (res) window.location.hash = '#/users';
        else alert('Error deleting user.');
      };
    }
  }
};