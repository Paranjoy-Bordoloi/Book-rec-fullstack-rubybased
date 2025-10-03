document.addEventListener('DOMContentLoaded', () => {
    // Main elements
    const mainContent = document.querySelector('main');
    const bookGrid = document.querySelector('.book-grid');
    const bookDetailView = document.getElementById('book-detail-view');
    
    // Standard search form
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const genreFilter = document.getElementById('genre-filter');

    // Tag search form
    const tagSearchForm = document.getElementById('tag-search-form');
    const tagSearchInput = document.getElementById('tag-search-input');
    const tagSuggestions = document.getElementById('tag-suggestions');

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

    // --- API Fetching ---
    const apiFetch = (url) => fetch(url).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    }).catch(e => console.error("API Fetch Error:", e));

    // --- Rendering ---
    const renderBookDetail = (book) => {
        if (!book) return;
        const coverImage = book.cover_image_url || 'https://via.placeholder.com/300x450.png?text=No+Image';
        const description = book.description || 'No description available.';
        const genres = book.genres?.map(g => `<span class="genre-tag">${g}</span>`).join('') || '';
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
        genreFilter.innerHTML = '<option value="">All Genres</option>';
        genres.forEach(genre => { if (genre) genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`; });
    };

    const populateTagSuggestions = (tags) => {
        tagSuggestions.innerHTML = '';
        tags.forEach(tag => { if (tag) tagSuggestions.innerHTML += `<option value="${tag}"></option>`; });
    };

    // --- Event Listeners ---
    bookGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.book-card');
        if (card?.dataset.bookId) apiFetch(`/api/v1/books/${card.dataset.bookId}`).then(renderBookDetail);
    });

    bookDetailView.addEventListener('click', (e) => {
        if (e.target.id === 'back-to-grid') animateView('grid');
        const card = e.target.closest('.book-card');
        if (card?.dataset.bookId) apiFetch(`/api/v1/books/${card.dataset.bookId}`).then(renderBookDetail);
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        const genre = genreFilter.value;
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        if (genre) params.set('genre', genre);
        if (!query && !genre) {
            apiFetch('/api/v1/homepage_feed').then(renderHomepageFeed);
        } else {
            apiFetch(`/api/v1/search?${params.toString()}`).then(renderSearchResults);
        }
    });

    tagSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tag = tagSearchInput.value.trim();
        if (tag) {
            apiFetch(`/api/v1/tags/${encodeURIComponent(tag)}`).then(renderSearchResults);
        }
    });
    
    genreFilter.addEventListener('change', () => searchForm.dispatchEvent(new Event('submit')));

    // --- Initial Load ---
    const init = () => {
        apiFetch('/api/v1/homepage_feed').then(renderHomepageFeed);
        apiFetch('/api/v1/genres').then(populateGenreFilter);
        apiFetch('/api/v1/all_tags').then(populateTagSuggestions);
    };

    init();
});