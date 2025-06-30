document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const pageContent = document.getElementById('page-content');
    const sidebar = document.getElementById('sidebar');
    const usernameDisplay = document.getElementById('username-display');
    const seekerNav = document.getElementById('job-seeker-nav');
    const providerNav = document.getElementById('job-provider-nav');

    // --- State ---
    let currentUser = null;
    let token = null;

    const API_URL = '/api';

    // --- API Helper ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('eLaborBridgeToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(API_URL + endpoint, config);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'An error occurred');
            }
            return response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            alert(error.message);
            throw error;
        }
    }

    // --- Authentication ---
    async function register(username, email, password, role) {
        try {
            const data = await apiRequest('/users/register', 'POST', { username, email, password, role });
            setSession(data.token);
            await checkSession();
        } catch (error) {
            // Error is already logged and alerted by apiRequest
        }
    }

    async function login(username, password) {
        try {
            const data = await apiRequest('/users/login', 'POST', { username, password });
            setSession(data.token, data.user);
            showApp(data.user);
        } catch (error) {
             // Error is already logged and alerted by apiRequest
        }
    }
    
    function setSession(newToken, userData) {
        token = newToken;
        localStorage.setItem('eLaborBridgeToken', token);
        if(userData) {
            currentUser = userData;
            sessionStorage.setItem('eLaborBridgeUser', JSON.stringify(userData));
        }
    }

    function logout() {
        token = null;
        currentUser = null;
        localStorage.removeItem('eLaborBridgeToken');
        sessionStorage.removeItem('eLaborBridgeUser');
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    async function checkSession() {
        const storedToken = localStorage.getItem('eLaborBridgeToken');
        if (storedToken) {
            token = storedToken;
            // You might want an endpoint to verify the token and get user data
            const storedUser = sessionStorage.getItem('eLaborBridgeUser');
            if(storedUser) {
                currentUser = JSON.parse(storedUser);
                showApp(currentUser);
            } else {
                // Optional: a /api/users/me endpoint to get fresh user data
                logout(); // If no user data, logout
            }
        }
    }

    // --- UI Control ---
    function showApp(user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        usernameDisplay.textContent = user.username;

        if (user.role === 'seeker') {
            seekerNav.style.display = 'block';
            providerNav.style.display = 'none';
            loadView('search-jobs');
        } else if (user.role === 'provider') {
            seekerNav.style.display = 'none';
            providerNav.style.display = 'block';
            loadView('my-postings');
        }
    }

    // --- Dark Mode ---
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        darkModeToggle.innerHTML = `<i class="fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>`;
        localStorage.setItem('darkMode', isDarkMode);
    }

    // --- Views / Dynamic Content ---
    function loadView(viewName) {
        // Update active link in sidebar
        document.querySelectorAll('#sidebar nav ul li a').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        pageContent.innerHTML = ''; // Clear content
        switch (viewName) {
            case 'search-jobs':
                pageContent.innerHTML = renderSearchJobs();
                break;
            case 'my-applications':
                pageContent.innerHTML = renderMyApplications();
                break;
            case 'profile':
                pageContent.innerHTML = renderProfile();
                break;
            case 'post-job':
                pageContent.innerHTML = renderPostJob();
                break;
            case 'my-postings':
                pageContent.innerHTML = renderMyPostings();
                break;
            case 'notifications':
                 pageContent.innerHTML = '<h2>Notifications</h2><div class="card"><p>Notifications feature coming soon!</p></div>';
                 break;
        }
    }
    
    // --- Rendering Functions ---
    function renderSearchJobs() {
        let listingsHTML = db.jobs.map(job => `
            <div class="card">
                <h3>${job.title}</h3>
                <p><strong>Provider:</strong> ${db.users.find(u => u.id === job.providerId).username}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Posted:</strong> ${new Date(job.postedDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status status-${job.status}">${job.status}</span></p>
                <button class="btn-success">Apply Now</button>
            </div>
        `).join('');

        return `
            <h2>Search For Jobs</h2>
            <div class="card">
                <input type="text" class="page-form-input" placeholder="Search by keyword...">
            </div>
            <div class="job-listings">${listingsHTML}</div>
        `;
    }

    function renderMyApplications() {
        const myApps = db.applications.filter(app => app.seekerId === currentUser.id);
        let appsHTML = myApps.map(app => {
            const job = db.jobs.find(j => j.id === app.jobId);
            return `
                <tr>
                    <td>${job.title}</td>
                    <td>${db.users.find(u => u.id === job.providerId).username}</td>
                    <td>${new Date(app.dateApplied).toLocaleDateString()}</td>
                    <td><span class="status status-${app.status}">${app.status}</span></td>
                </tr>
            `;
        }).join('');

        return `
            <h2>My Applications</h2>
            <table class="data-table">
                <thead>
                    <tr><th>Job Title</th><th>Provider</th><th>Date Applied</th><th>Status</th></tr>
                </thead>
                <tbody>${appsHTML}</tbody>
            </table>
        `;
    }
    
    function renderProfile() {
        return `
            <h2>My Profile</h2>
            <div class="card">
                <form id="profile-form" class="page-form">
                    <label for="username">Username</label>
                    <input type="text" id="username" value="${currentUser.username}" required>
                    <label for="email">Email</label>
                    <input type="email" id="email" value="${currentUser.email}" required>
                    <label for="skills">My Skills (comma-separated)</label>
                    <textarea id="skills" rows="4">${currentUser.skills || ''}</textarea>
                    <button type="submit">Update Profile</button>
                </form>
            </div>
        `;
    }

    function renderPostJob() {
        return `
            <h2>Post a New Job</h2>
            <div class="card">
                <form id="post-job-form" class="page-form">
                    <input type="text" name="title" placeholder="Job Title" required>
                    <textarea name="description" rows="5" placeholder="Job Description" required></textarea>
                    <input type="text" name="location" placeholder="Location (e.g., Remote, New York, NY)" required>
                    <button type="submit">Post Job</button>
                </form>
            </div>
        `;
    }

    function renderMyPostings() {
        const myJobs = db.jobs.filter(job => job.providerId === currentUser.id);
        let postingsHTML = myJobs.map(job => {
            const applicantCount = db.applications.filter(app => app.jobId === job.id).length;
            return `
                <div class="card">
                    <h3>${job.title}</h3>
                    <p><strong>Status:</strong> <span class="status status-${job.status}">${job.status}</span></p>
                    <p><strong>Applicants:</strong> ${applicantCount}</p>
                    <button>View Applicants</button>
                </div>
            `;
        }).join('');

        return `
            <h2>My Job Postings</h2>
            ${postingsHTML || '<div class="card"><p>You have not posted any jobs yet.</p></div>'}
        `;
    }

    // --- Event Listeners ---
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.style.display = 'none'; registerContainer.style.display = 'block'; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerContainer.style.display = 'none'; loginContainer.style.display = 'block'; });
    logoutBtn.addEventListener('click', logout);
    darkModeToggle.addEventListener('click', toggleDarkMode);

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.querySelector('input[type="text"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        login(username, password);
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.querySelector('input[type="text"]').value;
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        const role = e.target.querySelector('select').value;
        if (!role) {
            alert('Please select a role.');
            return;
        }
        register(username, email, password, role);
    });

    sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.dataset.view) {
            e.preventDefault();
            loadView(link.dataset.view);
        }
    });
    
    pageContent.addEventListener('submit', (e) => {
        e.preventDefault();
        if (e.target.id === 'post-job-form') {
            const formData = new FormData(e.target);
            const job = {
                id: getNextId(),
                providerId: currentUser.id,
                title: formData.get('title'),
                description: formData.get('description'),
                location: formData.get('location'),
                status: 'open',
                postedDate: new Date()
            };
            db.jobs.push(job);
            saveDB();
            loadView('my-postings');
        }
        
        if (e.target.id === 'profile-form') {
            const userToUpdate = db.users.find(u => u.id === currentUser.id);
            userToUpdate.username = e.target.querySelector('#username').value;
            userToUpdate.email = e.target.querySelector('#email').value;
            userToUpdate.skills = e.target.querySelector('#skills').value;
            currentUser = { ...userToUpdate }; // Update current session
            sessionStorage.setItem('eLaborBridgeUser', JSON.stringify(currentUser));
            usernameDisplay.textContent = currentUser.username;
            saveDB();
            alert('Profile updated!');
        }
    });

    // --- Initial Load ---
    checkSession();
});
