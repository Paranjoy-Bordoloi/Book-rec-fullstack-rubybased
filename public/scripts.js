document.addEventListener('DOMContentLoaded', () => {
    // Helper to safely query elements and avoid runtime errors on MPA pages
    const $ = (selector) => document.querySelector(selector) || null;
    const getById = (id) => document.getElementById(id) || null;

    // Main elements (may not exist on every server-rendered page)
    const mainContent = $('main') || document.body;
    const bookGrid = $('.book-grid');
    const bookDetailView = getById('book-detail-view');
    
    // Standard search form (optional)
    const searchForm = getById('search-form');
    const searchInput = getById('search-input');
    const genreFilter = getById('genre-filter');

    // Tag search form (optional)
    const tagSearchForm = getById('tag-search-form');
    const tagSearchInput = getById('tag-search-input');
    const tagSuggestions = getById('tag-suggestions');

    // --- Helper Functions ---
    const getBookId = (book) => {
        if (!book || !book._id) return null;
        if (book._id.$oid) return book._id.$oid;
        return book._id.toString();
    };

    // --- Animation & View Management ---
    const animateView = (viewToShow) => {
        const DURATION = 300;
        mainContent.classList.add('is-transitioning');
        setTimeout(() => {
            bookGrid.style.display = (viewToShow === 'grid') ? 'block' : 'none';
            bookDetailView.style.display = (viewToShow === 'detail') ? 'block' : 'none';
            mainContent.classList.remove('is-transitioning');
            if (viewToShow === 'detail') {
                anime({ targets: '#book-detail-view', opacity: [0, 1], duration: DURATION, easing: 'easeOutQuad' });
            }
        }, DURATION);
    };

    // --- State ---
    let currentUser = null;

    // --- API Fetching ---
    const apiFetch = (url, options = {}) => {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (currentUser?.token) {
            headers['Authorization'] = `Bearer ${currentUser.token}`;
        }
        // Ensure we don't rely on stale browser cache for API responses unless caller overrides
        const fetchOptions = { cache: (options.cache || 'no-store'), ...options };
        return fetch(url, { ...fetchOptions, headers }).then(async res => {
            // Treat 304 Not Modified as "no change" and return null so callers can handle it gracefully
            if (res.status === 304) {
                console.debug('apiFetch: 304 Not Modified for', url);
                return null;
            }
            // Handle unauthorized explicitly
            if (res.status === 401) {
                // clear session and show login prompt
                clearSession();
                alert('Session expired. Please log in again.');
                throw new Error('Unauthorized');
            }
            if (!res.ok) {
                // Try parse JSON, otherwise show text (HTML error pages)
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const err = await res.json();
                    throw new Error(err.error || `HTTP error! status: ${res.status}`);
                } else {
                    const text = await res.text();
                    console.error('Non-JSON error response:', text);
                    // show a friendly message rather than crashing on JSON.parse
                    throw new Error(`Server error (${res.status}). See console for details.`);
                }
            }
            if (res.status === 204) return null; // No Content
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) return null; // nothing to parse
            const payload = await res.json();
            console.debug('apiFetch success', url, payload);
            return payload;
        }).catch(e => {
            console.error("API Fetch Error:", e);
            // Avoid alert spamming on background fetches; show a compact message
            const toast = document.getElementById('global-error-toast');
            if (toast) {
                toast.textContent = e.message;
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 3500);
            }
            throw e;
        });
    };

    const apiPost = (url, body) => apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    // --- Rendering ---
    const renderBookDetail = (book) => {
        if (!book) return;
        const coverImage = book.cover_image_url || 'https://via.placeholder.com/300x450.png?text=No+Image';
        const description = book.description || 'No description available.';
        const genres = book.genres?.map(g => `<span class="genre-tag">${g}</span>`).join('') || '';
    if (!bookDetailView) return;
    bookDetailView.innerHTML = `
            <button id="back-to-grid" class="btn btn-outline-secondary mb-4">&#8592; Back to list</button>
            <div class="book-detail-content">
                <img src="${coverImage}" alt="Cover of ${book.title}">
                <div class="book-info">
                    <h2 class="mb-2">${book.title}</h2>
                    <h3 class="text-muted h5 mb-3">by ${book.author || 'Unknown Author'}</h3>
                    <div class="genres mb-4">${genres}</div>
                    <p>${description}</p>
                </div>
            </div>
            <div id="similar-books-container"></div>
        `;
        animateView('detail');
        const bookId = getBookId(book);
        if (bookId) apiFetch(`/api/v1/books/${bookId}/similar`).then(renderSimilarBooks);
    };

    const renderSimilarBooks = (books) => {
        const container = document.getElementById('similar-books-container');
        if (!container || !books || books.length === 0) return;
        const similarBooksHTML = books.map(book => `
            <div class="book-card" data-book-id="${getBookId(book)}">
                <img src="${book.cover_image_url || 'https://via.placeholder.com/100x150.png?text=No+Image'}" alt="Cover of ${book.title}">
                <div class="book-card-info"><h4>${book.title}</h4></div>
            </div>
        `).join('');
        container.innerHTML = `
            <h3 class="mt-5">You Might Also Enjoy</h3>
            <div class="search-results-grid">${similarBooksHTML}</div>
        `;
        anime({ targets: '.search-results-grid .book-card', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(50), easing: 'easeOutQuad' });
    };

    const renderHomepageFeed = (data) => {
        if (!bookGrid) return;
        bookGrid.innerHTML = '';
        if (!data || !data.feed) return;
        for (const [genre, books] of Object.entries(data.feed)) {
            if (books.length > 0) {
                const slidesHTML = books.map(book => `
                    <li class="splide__slide">
                        <div class="book-card" data-book-id="${getBookId(book)}">
                            <img src="${book.cover_image_url || 'https://via.placeholder.com/150x225.png?text=No+Image'}" alt="Cover of ${book.title}">
                            <div class="book-card-info">
                                <h4>${book.title}</h4>
                                <p>${book.author || 'Unknown Author'}</p>
                            </div>
                        </div>
                    </li>
                `).join('');
                bookGrid.innerHTML += `
                    <section class="genre-section">
                        <h2>${genre}</h2>
                        <div class="splide">
                            <div class="splide__track"><ul class="splide__list">${slidesHTML}</ul></div>
                        </div>
                    </section>
                `;
            }
        }
        animateView('grid');
        initSliders();
        anime({ targets: '.genre-section .book-card', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(30), easing: 'easeOutQuad' });
    };

    const initSliders = () => {
        document.querySelectorAll('.splide').forEach(splideElement => {
            new Splide(splideElement, {
                type: 'loop', perPage: 6, perMove: 1, gap: '1.5rem', pagination: false, autoplay: true, interval: 5000, pauseOnHover: true,
                breakpoints: { 1400: { perPage: 5 }, 1200: { perPage: 4 }, 992: { perPage: 3 }, 768: { perPage: 2 } }
            }).mount();
        });
    };

    const renderSearchResults = (books) => {
        if (!bookGrid) return;
        bookGrid.innerHTML = '';
        if (!books || books.length === 0) {
            bookGrid.innerHTML = '<p class="text-center">No books found.</p>';
            animateView('grid');
            return;
        }
        const booksHTML = books.map(book => `
            <div class="book-card" data-book-id="${getBookId(book)}">
                <img src="${book.cover_image_url || 'https://via.placeholder.com/200x300.png?text=No+Image'}" alt="Cover of ${book.title}">
                <div class="book-card-info">
                    <h4>${book.title}</h4>
                    <p>${book.author || 'Unknown Author'}</p>
                </div>
            </div>
        `).join('');
        bookGrid.innerHTML = `<div class="search-results-grid">${booksHTML}</div>`;
        animateView('grid');
        anime({ targets: '.search-results-grid .book-card', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(50), easing: 'easeOutQuad' });
    };

    const populateGenreFilter = (genres) => {
        if (!genreFilter) return;
        genreFilter.innerHTML = '<option value="">All Genres</option>';
        genres.forEach(genre => { if (genre) genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`; });
    };

    const populateTagSuggestions = (tags) => {
        if (!tagSuggestions) return;
        tagSuggestions.innerHTML = '';
        tags.forEach(tag => { if (tag) tagSuggestions.innerHTML += `<option value="${tag}"></option>`; });
    };

    // --- Authentication & Session ---
    const saveSession = (data) => {
        currentUser = { token: data.token, name: data.user.name, id: data.user.id };
        localStorage.setItem('bookwiseUser', JSON.stringify(currentUser));
        updateUIForAuthState();
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
        modalInstance.hide();
        // Fetch and render reading lists for the logged-in user
        apiFetch('/api/v1/reading_lists').then(renderReadingLists).catch(() => {});
    };

    const clearSession = () => {
        currentUser = null;
        localStorage.removeItem('bookwiseUser');
        updateUIForAuthState();
    };

    const updateUIForAuthState = () => {
        const userActions = document.getElementById('user-actions');
        if (currentUser) {
            userActions.innerHTML = `
                <span class="navbar-text me-3">Welcome, ${currentUser.name}</span>
                <button id="logout-button" class="btn btn-outline-primary">Logout</button>
            `;
        } else {
            userActions.innerHTML = '<button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#login-modal">Login</button>';
        }
    };

    const checkSession = () => {
        const savedUser = localStorage.getItem('bookwiseUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUIForAuthState();
            // If session restored, fetch reading lists
            apiFetch('/api/v1/reading_lists').then(renderReadingLists).catch(() => {});
        }
    };

    // --- Reading lists UI ---
    const renderReadingLists = (lists) => {
        const container = document.getElementById('reading-lists-container');
        if (!container) return;

        // Debug log so we can see what shape the API returned
        console.debug('renderReadingLists called with:', lists);

        // Normalize different possible shapes: array, { reading_lists: [...] }, { lists: [...] }, { data: [...] }
        let normalized = [];
        if (!lists) normalized = [];
        else if (Array.isArray(lists)) normalized = lists;
        else if (lists.reading_lists && Array.isArray(lists.reading_lists)) normalized = lists.reading_lists;
        else if (lists.lists && Array.isArray(lists.lists)) normalized = lists.lists;
        else if (lists.data && Array.isArray(lists.data)) normalized = lists.data;
        else normalized = [];

        // If the server already rendered the reading lists (MPA) we should not overwrite them.
        // Server rendered lists should mark the container with data-server-rendered="true"
        if (container.dataset.serverRendered === 'true') {
            // Attach handlers to existing elements and bail out
            container.querySelectorAll('.view-reading-list').forEach(el => {
                el.addEventListener('click', (e) => {
                    const id = e.target.dataset.listId;
                    if (id) apiFetch(`/api/v1/reading_lists/${id}`).then(openReadingList).catch(err => console.error('openReadingList error', err));
                });
            });
            return;
        }

        if (normalized.length === 0) {
            container.innerHTML = '';
            return;
        }

        const getListId = (list) => {
            if (!list) return '';
            if (list.id) return list.id.toString();
            if (list._id) {
                if (typeof list._id === 'string') return list._id;
                if (list._id.$oid) return list._id.$oid;
                return list._id.toString();
            }
            return '';
        };

        container.innerHTML = normalized.map(list => {
            const listId = getListId(list);
            const name = list.name || 'Untitled';
            return `
            <div class="dropdown me-2 d-inline-block">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">${name}</button>
                <ul class="dropdown-menu dropdown-menu-end p-2">
                    <li><a class="dropdown-item view-reading-list" data-list-id="${listId}">View</a></li>
                    <li><a class="dropdown-item" data-action="create-reading-list">Create new</a></li>
                </ul>
            </div>
        `;
        }).join('');

        // Dump normalized payload into dev debug panel (visible only during dev)
        try {
            const dbg = document.getElementById('reading-lists-debug');
            const panel = document.getElementById('dev-debug-panel');
            if (dbg && panel) {
                dbg.textContent = JSON.stringify(normalized, null, 2);
                panel.style.display = 'block';
            }
        } catch (err) { console.warn('debug panel write failed', err); }

        // Attach handlers (re-query after setting innerHTML)
        container.querySelectorAll('.view-reading-list').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.target.dataset.listId;
                if (id) apiFetch(`/api/v1/reading_lists/${id}`).then(openReadingList).catch(err => console.error('openReadingList error', err));
            });
        });
    };

    const openReadingList = (readingList) => {
        const modalTitle = document.getElementById('reading-list-modal-title');
        const modalBody = document.getElementById('reading-list-modal-body');
        if (!modalBody || !modalTitle) return;
        modalTitle.textContent = readingList.name || 'Reading List';

        const slides = (readingList.books || []).map(book => `
            <li class="splide__slide">
                <div class="book-card" data-book-id="${getBookId(book)}">
                    <img src="${book.cover_image_url || 'https://via.placeholder.com/150x225.png?text=No+Image'}" alt="Cover of ${book.title}">
                    <div class="book-card-info"><h4>${book.title}</h4><p>${book.author || ''}</p></div>
                </div>
            </li>
        `).join('');

        modalBody.innerHTML = `
            <div class="splide reading-list-splide">
                <div class="splide__track"><ul class="splide__list">${slides}</ul></div>
            </div>
        `;

        // Initialize slider and animations
        const splideEl = modalBody.querySelector('.reading-list-splide');
        if (splideEl) {
            new Splide(splideEl, { type: 'loop', perPage: 4, gap: '1rem', autoplay: true, interval: 4000, pauseOnHover: true,
                breakpoints: { 1200: { perPage: 3 }, 992: { perPage: 2 }, 576: { perPage: 1 } } }).mount();
        }
        anime({ targets: '.reading-list-splide .book-card', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(40), easing: 'easeOutQuad' });

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reading-list-modal'));
        modal.show();
    };

    // --- Event Listeners ---
    if (bookGrid) {
        bookGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.book-card');
            if (card?.dataset.bookId) apiFetch(`/api/v1/books/${card.dataset.bookId}`).then(renderBookDetail);
        });
    }

    if (bookDetailView) {
        bookDetailView.addEventListener('click', (e) => {
            if (e.target.id === 'back-to-grid') animateView('grid');
            const card = e.target.closest('.book-card');
            if (card?.dataset.bookId) apiFetch(`/api/v1/books/${card.dataset.bookId}`).then(renderBookDetail);
        });
    }

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            // If the form is server-rendered and intended to submit normally (no-js), allow standard submit when user prefers
            e.preventDefault();
            const query = searchInput.value.trim();
            const genre = genreFilter ? genreFilter.value : '';
            const params = new URLSearchParams();
            if (query) params.set('query', query);
            if (genre) params.set('genre', genre);
            if (!query && !genre) {
                apiFetch('/api/v1/homepage_feed').then(renderHomepageFeed);
            } else {
                apiFetch(`/api/v1/search?${params.toString()}`).then(renderSearchResults);
            }
        });
    }

    if (tagSearchForm && tagSearchInput) {
        tagSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const tag = tagSearchInput.value.trim();
            if (tag) {
                // Route is defined as /api/v1/books/tags/:tag
                apiFetch(`/api/v1/books/tags/${encodeURIComponent(tag)}`).then(renderSearchResults);
            }
        });
    }

    const loginForm = getById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailEl = getById('login-email');
            const passEl = getById('login-password');
            const email = emailEl ? emailEl.value : '';
            const password = passEl ? passEl.value : '';
            const loginErrorDiv = getById('login-error');

            apiPost('/api/v1/authentication/login', { email, password })
                .then(saveSession)
                .catch(err => {
                    if (loginErrorDiv) {
                        loginErrorDiv.textContent = 'Invalid username or password.';
                        loginErrorDiv.style.display = 'block';
                    }
                    console.error('Login failed:', err);
                });
        });
    }

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const password_confirmation = document.getElementById('register-password-confirmation').value;
        const userData = { user: { name, email, password, password_confirmation } };
        apiPost('/api/v1/users', userData)
            .then(saveSession)
            .catch(err => console.error('Registration failed'));
    });

    document.getElementById('user-actions').addEventListener('click', (e) => {
        if (e.target.id === 'logout-button') {
            clearSession();
        }
    });
    
    genreFilter.addEventListener('change', () => searchForm.dispatchEvent(new Event('submit')));

    // --- Initial Load ---
    const init = () => {
        checkSession();
        console.debug('init currentUser:', currentUser);
        apiFetch('/api/v1/homepage_feed').then(renderHomepageFeed);
        apiFetch('/api/v1/genres').then(populateGenreFilter);
        apiFetch('/api/v1/all_tags').then(populateTagSuggestions);
    };

    init();
});