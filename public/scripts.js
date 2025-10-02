document.addEventListener('DOMContentLoaded', () => {
    const bookGrid = document.querySelector('.book-grid');
    const bookDetailView = document.getElementById('book-detail-view');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const genreFilter = document.getElementById('genre-filter');

    // --- Helper Functions ---
    const getBookId = (book) => (book?._id?.$oid || book?.id || null);

    const showView = (view) => {
        bookGrid.style.display = 'none';
        bookDetailView.style.display = 'none';
        if (view === 'grid') {
            bookGrid.style.display = 'block';
        } else if (view === 'detail') {
            bookDetailView.style.display = 'block';
        }
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
            <button id="back-to-grid" class="btn btn-outline-secondary mb-3">&#8592; Back to list</button>
            <div class="book-detail-content">
                <img src="${coverImage}" alt="Cover of ${book.title}">
                <div class="book-info">
                    <h2 class="mb-2">${book.title}</h2>
                    <h3 class="text-muted h5 mb-3">by ${book.author || 'Unknown Author'}</h3>
                    <div class="genres mb-3">${genres}</div>
                    <p>${description}</p>
                </div>
            </div>
            <div id="similar-books-container"></div>
        `;
        showView('detail');
        
        const bookId = getBookId(book);
        if (bookId) {
            apiFetch(`/api/v1/books/${bookId}/similar`).then(renderSimilarBooks);
        }
    };

    const renderSimilarBooks = (books) => {
        const container = document.getElementById('similar-books-container');
        if (!container || !books || books.length === 0) return;

        const similarBooksHTML = books.map(book => `
            <div class="similar-book-card" data-book-id="${getBookId(book)}">
                <img src="${book.cover_image_url || 'https://via.placeholder.com/100x150.png?text=No+Image'}" alt="Cover of ${book.title}">
                <h4>${book.title}</h4>
            </div>
        `).join('');

        container.innerHTML = `
            <h3 class="mt-5">Readers Also Liked</h3>
            <div class="similar-books-grid">${similarBooksHTML}</div>
        `;
    };

    const renderHomepageFeed = (data) => {
        bookGrid.innerHTML = '';
        if (!data || !data.feed) return;

        for (const [genre, books] of Object.entries(data.feed)) {
            if (books.length > 0) {
                const booksHTML = books.map(book => `
                    <div class="book-card" data-book-id="${getBookId(book)}">
                        <img src="${book.cover_image_url || 'https://via.placeholder.com/150x225.png?text=No+Image'}" alt="Cover of ${book.title}">
                         <div class="book-card-info">
                            <h4>${book.title}</h4>
                            <p>${book.author || 'Unknown Author'}</p>
                        </div>
                    </div>
                `).join('');

                bookGrid.innerHTML += `
                    <section class="genre-section">
                        <h2>${genre}</h2>
                        <div class="books-carousel">${booksHTML}</div>
                    </section>
                `;
            }
        }
        showView('grid');
    };

    const renderSearchResults = (books) => {
        bookGrid.innerHTML = '';
        if (!books || books.length === 0) {
            bookGrid.innerHTML = '<p class="text-center">No books found.</p>';
            showView('grid');
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
        showView('grid');
    };

    const populateGenreFilter = (genres) => {
        genreFilter.innerHTML = '<option value="">All Genres</option>';
        genres.forEach(genre => {
            if (genre) {
                genreFilter.innerHTML += `<option value="${genre}">${genre}</option>`;
            }
        });
    };

    // --- Event Listeners ---
    bookGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.book-card');
        if (card?.dataset.bookId) {
            apiFetch(`/api/v1/books/${card.dataset.bookId}`).then(renderBookDetail);
        }
    });

    bookDetailView.addEventListener('click', (e) => {
        if (e.target.id === 'back-to-grid') {
            showView('grid');
        }
        const card = e.target.closest('.similar-book-card');
        if (card?.dataset.bookId) {
            apiFetch(`/api/v1/books/${card.dataset.bookId}`).then(renderBookDetail);
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        const genre = genreFilter.value;
        
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        if (genre) params.set('genre', genre);

        // If search is empty, load homepage, otherwise search
        if (!query && !genre) {
            apiFetch('/api/v1/homepage_feed').then(renderHomepageFeed);
        } else {
            apiFetch(`/api/v1/search?${params.toString()}`).then(renderSearchResults);
        }
    });
    
    genreFilter.addEventListener('change', () => searchForm.dispatchEvent(new Event('submit')));

    // --- Initial Load ---
    const init = () => {
        apiFetch('/api/v1/homepage_feed').then(renderHomepageFeed);
        apiFetch('/api/v1/genres').then(populateGenreFilter);
        showView('grid');
    };

    init();
});