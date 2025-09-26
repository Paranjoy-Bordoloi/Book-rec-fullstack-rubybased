document.addEventListener('DOMContentLoaded', () => {
    const bookGrid = document.querySelector('.book-grid');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    const fetchAndDisplayBooks = (url) => {
        fetch(url)
            .then(response => response.json())
            .then(books => {
                bookGrid.innerHTML = ''; // Clear existing content

                if (books.length === 0) {
                    bookGrid.innerHTML = '<p>No books found.</p>';
                    return;
                }

                books.forEach(book => {
                    const bookCard = document.createElement('div');
                    bookCard.classList.add('book-card');

                    const coverImage = document.createElement('img');
                    coverImage.src = book.cover_image_url || 'https://via.placeholder.com/250x375.png?text=No+Image';
                    coverImage.alt = `Cover of ${book.title}`;

                    const title = document.createElement('h2');
                    title.textContent = book.title;

                    const author = document.createElement('h3');
                    author.textContent = book.author;

                    const genresContainer = document.createElement('div');
                    genresContainer.classList.add('genres');

                    if (book.genres && book.genres.length > 0) {
                        book.genres.forEach(genre => {
                            const genreTag = document.createElement('span');
                            genreTag.classList.add('genre-tag');
                            genreTag.textContent = genre;
                            genresContainer.appendChild(genreTag);
                        });
                    }

                    const description = document.createElement('p');
                    description.textContent = book.description || 'No description available.';

                    bookCard.appendChild(coverImage);
                    bookCard.appendChild(title);
                    bookCard.appendChild(author);
                    bookCard.appendChild(genresContainer);
                    bookCard.appendChild(description);

                    bookGrid.appendChild(bookCard);
                });
            })
            .catch(error => {
                console.error('Error fetching books:', error);
                bookGrid.innerHTML = '<p>Error loading books. Please try again later.</p>';
            });
    };

    // Initial load of all books
    fetchAndDisplayBooks('http://localhost:3000/api/v1/books');

    // Search functionality
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            fetchAndDisplayBooks(`http://localhost:3000/api/v1/books?query=${encodeURIComponent(query)}`);
        } else {
            // If search is empty, load all books
            fetchAndDisplayBooks('http://localhost:3000/api/v1/books');
        }
    });
});