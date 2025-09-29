require 'httparty'
require 'uri'

namespace :scraper do
  desc "Fetches books from Google Books API and saves them to the database. Pass a search query in brackets, e.g., rake 'scraper:fetch_books_from_google[Ruby on Rails]'"
  task :fetch_books_from_google, [:query] => :environment do |t, args|
    api_key = ENV['GOOGLE_BOOKS_API_KEY']
    unless api_key
      puts "GOOGLE_BOOKS_API_KEY environment variable not set. Please set it to your Google Books API key."
      puts "For local development, you can use the 'dotenv-rails' gem and a .env file."
      next
    end

    query = args[:query] || 'programming' # Default query if none is provided
    puts "Fetching books for query: '#{query}' from Google Books API..."

    # Google Books API endpoint for searching volumes
    search_url = "https://www.googleapis.com/books/v1/volumes?q=#{URI.encode_www_form_component(query)}&key=#{api_key}&maxResults=20"

    response = HTTParty.get(search_url, headers: { 'User-Agent' => 'Gemini-CLI-Agent/1.0' })

    unless response.success?
      puts "Failed to fetch data from Google Books API, status code: #{response.code}"
      puts "Response body: #{response.body}"
      next
    end

    items = response.parsed_response['items']
    if items.nil? || items.empty?
      puts "No books found for the query: '#{query}'"
      next
    end

    puts "Found #{items.count} books. Processing..."

    items.each do |item|
      volume_info = item['volumeInfo']
      next unless volume_info

      # Extract ISBN-13 if available, otherwise ISBN-10
      isbn = nil
      if volume_info['industryIdentifiers']
        isbn_13 = volume_info['industryIdentifiers'].find { |id| id['type'] == 'ISBN_13' }
        isbn_10 = volume_info['industryIdentifiers'].find { |id| id['type'] == 'ISBN_10' }
        isbn = isbn_13['identifier'] if isbn_13
        isbn ||= isbn_10['identifier'] if isbn_10
      end

      title = volume_info['title']

      # Skip if essential information is missing
      if title.blank? || isbn.blank?
        puts "Skipping item due to missing title or ISBN. Title: #{title.inspect}, ISBN: #{isbn.inspect}"
        next
      end

      book = Book.find_or_initialize_by(isbn: isbn)
      new_book = book.new_record?

      book.update(
        title: title,
        author: volume_info['authors']&.join(', '),
        description: volume_info['description'],
        genres: volume_info['categories'],
        cover_image_url: volume_info.dig('imageLinks', 'thumbnail'),
        average_rating: volume_info['averageRating'],
        ratings_count: volume_info['ratingsCount']
      )

      if new_book
        puts "Saved new book: '#{title}'"
      else
        puts "Updated book: '#{title}'"
      end

      # A short delay to be polite to the API
      sleep(0.5)
    end

    puts "Finished processing books."
  end
end