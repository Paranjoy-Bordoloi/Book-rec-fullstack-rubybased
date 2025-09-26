document.addEventListener('DOMContentLoaded', () => {
    const bookGrid = document.querySelector('.book-grid');
    const bookDetailView = document.getElementById('book-detail-view');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const genreFilter = document.getElementById('genre-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const sortFilter = document.getElementById('sort-filter');
    let allBooks = [];

    const getStarRating = (rating) => {
        if (!rating) return '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        return `
            <div class="star-rating">
                ${ '&#9733;'.repeat(fullStars) }
                ${ halfStar ? '&#9734;' : '' } 
                ${ '&#9734;'.repeat(emptyStars) }
                <span class="rating-text">(${rating.toFixed(1)})</span>
            </div>
        `;
    };

    const displaySimilarBooks = (books) => {
        const container = document.getElementById('similar-books-container');
        if (!container || books.length === 0) return;

        const similarBooksHTML = books.map(book => `
            <div class="similar-book-card" data-book-id="${book._id.$oid}">
                <img src="${book.cover_image_url || 'https://via.placeholder.com/100x150.png?text=No+Image'}" alt="Cover of ${book.title}">
                <h4>${book.title}</h4>
            </div>
        `).join('');

        container.innerHTML = `
            <h3>Readers Also Liked</h3>
            <div class="similar-books-grid">
                ${similarBooksHTML}
            </div>
        `;

        container.querySelectorAll('.similar-book-card').forEach(card => {
            card.addEventListener('click', () => {
                const bookId = card.dataset.bookId;
                const book = allBooks.find(b => b._id.$oid === bookId);
                if(book) {
                    showBookDetail(book);
                } else {
                    // If book is not in the main list, fetch it individually
                    fetch(`http://localhost:3000/api/v1/books/${bookId}`)
                        .then(res => res.json())
                        .then(bookData => showBookDetail(bookData));
                }
            });
        });
    };

    const showBookDetail = (book) => {
        if (!book) return;
        bookGrid.classList.add('hidden');
        bookDetailView.classList.remove('hidden');

        bookDetailView.innerHTML = `
            <button id="back-to-grid">&#8592; Back to list</button>
            <h2>${book.title}</h2>
            <h3>by ${book.author}</h3>
            ${getStarRating(book.average_rating)}
            <img src="${book.cover_image_url || 'https://via.placeholder.com/250x375.png?text=No+Image'}" alt="Cover of ${book.title}">
            <div class="genres">
                ${book.genres && book.genres.length > 0 ? book.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('') : ''}
            </div>
            <p>${book.description || 'No description available.'}</p>
            <div id="similar-books-container"></div>
        `;

        document.getElementById('back-to-grid').addEventListener('click', () => {
            bookDetailView.classList.add('hidden');
            bookGrid.classList.remove('hidden');
        });

        // Fetch and display similar books
        fetch(`http://localhost:3000/api/v1/books/${book._id.$oid}/similar`)
            .then(response => response.json())
            .then(similarBooks => displaySimilarBooks(similarBooks));
    };

    const fetchAndDisplayBooks = (url) => {
        fetch(url)
            .then(response => response.json())
            .then(books => {
                allBooks = books;
                bookGrid.innerHTML = '';

                if (books.length === 0) {
                    bookGrid.innerHTML = '<p>No books found.</p>';
                    return;
                }

                books.forEach((book, index) => {
                    const bookCard = document.createElement('div');
                    bookCard.classList.add('book-card');
                    bookCard.dataset.index = index;

                    const coverImage = document.createElement('img');
                    coverImage.src = book.cover_image_url || 'https://via.placeholder.com/250x375.png?text=No+Image';
                    coverImage.alt = `Cover of ${book.title}`;

                    const title = document.createElement('h2');
                    title.textContent = book.title;

                    const author = document.createElement('h3');
                    author.textContent = book.author;

                    const rating = document.createElement('div');
                    rating.innerHTML = getStarRating(book.average_rating);

                    bookCard.appendChild(coverImage);
                    bookCard.appendChild(title);
                    bookCard.appendChild(author);
                    bookCard.appendChild(rating);

                    bookGrid.appendChild(bookCard);
                });
            })
            .catch(error => {
                console.error('Error fetching books:', error);
                bookGrid.innerHTML = '<p>Error loading books. Please try again later.</p>';
            });
    };

    const populateGenreFilter = () => {
        fetch('http://localhost:3000/api/v1/genres')
            .then(response => response.json())
            .then(genres => {
                genres.forEach(genre => {
                    if (genre) { // Ensure genre is not null or empty
                        const option = document.createElement('option');
                        option.value = genre;
                        option.textContent = genre;
                        genreFilter.appendChild(option);
                    }
                });
            })
            .catch(error => console.error('Error fetching genres:', error));
    };

    bookGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.book-card');
        if (card) {
            const bookIndex = card.dataset.index;
            if (bookIndex) {
                showBookDetail(allBooks[bookIndex]);
            }
        }
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        bookDetailView.classList.add('hidden');
        bookGrid.classList.remove('hidden');
        const query = searchInput.value.trim();
        const genre = genreFilter.value;
        const rating = ratingFilter.value;
        const sort = sortFilter.value;
        let url = 'http://localhost:3000/api/v1/books?';
        const params = [];
        if (query) params.push(`query=${encodeURIComponent(query)}`);
        if (genre) params.push(`genre=${encodeURIComponent(genre)}`);
        if (rating) params.push(`rating=${encodeURIComponent(rating)}`);
        if (sort) params.push(`sort=${encodeURIComponent(sort)}`);
        url += params.join('&');
        fetchAndDisplayBooks(url);
    });

    genreFilter.addEventListener('change', () => {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        searchForm.dispatchEvent(event);
    });

    ratingFilter.addEventListener('change', () => {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        searchForm.dispatchEvent(event);
    });

    sortFilter.addEventListener('change', () => {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        searchForm.dispatchEvent(event);
    });

    // Initial load
    populateGenreFilter();
    fetchAndDisplayBooks('http://localhost:3000/api/v1/books');
});