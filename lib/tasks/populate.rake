namespace :scraper do
  desc "Populates the database with ~500 books for a preset list of genres using sub-queries."
  task :populate_preset_genres => :environment do
    # A hash where keys are the main genres and values are arrays of specific search queries.
    genres_with_subqueries = {
      "Science Fiction" => ["science fiction", "cyberpunk", "dystopian", "space opera", "post-apocalyptic"],
      "Fantasy" => ["fantasy", "epic fantasy", "urban fantasy", "sword and sorcery", "dark fantasy"],
      "Mystery" => ["mystery", "detective fiction", "cozy mystery", "crime fiction", "noir"],
      "Thriller" => ["thriller", "psychological thriller", "spy thriller", "legal thriller", "techno-thriller"],
      "Romance" => ["romance", "contemporary romance", "historical romance", "paranormal romance", "romantic suspense"],
      "History" => ["history", "ancient history", "world history", "military history", "biographical history"],
      "Biography" => ["biography", "autobiography", "memoir", "historical biography", "celebrity biography"],
      "Science" => ["science", "popular science", "physics", "biology", "astronomy"],
      "Technology" => ["technology", "computer science", "artificial intelligence", "programming", "cybersecurity"],
      "Philosophy" => ["philosophy", "ancient philosophy", "existentialism", "stoicism", "eastern philosophy"],
      "Psychology" => ["psychology", "cognitive psychology", "social psychology", "clinical psychology", "developmental psychology"],
      "Business" => ["business", "entrepreneurship", "investing", "marketing", "management"]
    }

    puts "Starting advanced population of the database."
    puts "This will take a very long time (potentially several hours)."
    puts "=============================================================="

    genres_with_subqueries.each do |main_genre, subqueries|
      total_books_for_genre = 0
      books_to_fetch_per_subquery = (500.0 / subqueries.length).ceil

      puts "\nFetching up to 500 books for main genre: '#{main_genre}'..."

      subqueries.each do |query|
        break if total_books_for_genre >= 500

        puts "  -> Searching for sub-query: '#{query}'"
        begin
          # We need to get the number of books actually found by the task
          # This is a bit of a hack, we'd ideally refactor the search task to return the count
          initial_book_count = Book.count

          Rake::Task['scraper:google_books_search'].reenable
          Rake::Task['scraper:google_books_search'].invoke(query, books_to_fetch_per_subquery)
          
          new_books_found = Book.count - initial_book_count
          total_books_for_genre += new_books_found

        rescue => e
          puts "    An error occurred while fetching books for '#{query}': #{e.message}"
        end
      end
      puts "Finished fetching for main genre '#{main_genre}'. Found #{total_books_for_genre} new books."
      puts "--------------------------------------------------------------"
    end

    puts "\n=============================================================="
    puts "Finished populating all preset genres."
  end
end