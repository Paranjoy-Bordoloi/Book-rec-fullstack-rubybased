require 'securerandom'

namespace :scraper do
  # Helper method to search Open Library for an ISBN
  def find_isbn_on_open_library(title)
    puts "    -> Title missing ISBN. Searching Open Library for '#{title}'..."
    search_url = "https://openlibrary.org/search.json?q=#{URI.encode_www_form_component(title)}"
    response = HTTParty.get(search_url, headers: { 'User-Agent' => 'Gemini-CLI-Agent/1.0' })
    return nil unless response.success?

    docs = response.parsed_response['docs']
    return nil if docs.nil? || docs.empty?

    # Find the first document that has an isbn
    first_doc_with_isbn = docs.find { |doc| doc['isbn']&.first }
    return nil unless first_doc_with_isbn

    isbn = first_doc_with_isbn['isbn'].first
    puts "    -> Found ISBN on Open Library: #{isbn}"
    isbn
  end

  desc "Fetches books from Google Books API. Usage: rails scraper:google_books_search[query,max_results]"
  task :google_books_search, [:query, :max_results] => :environment do |t, args|
    api_key = ENV['GOOGLE_BOOKS_API_KEY']
    unless api_key
      puts "GOOGLE_BOOKS_API_KEY environment variable not set."
      next
    end

    query = args[:query] || 'programming'
    max_results = (args[:max_results] || 40).to_i
    per_page = 40 # Max allowed by API
    start_index = 0
    books_found = 0

    puts "Fetching up to #{max_results} books for query: '#{query}'..."

    while books_found < max_results
      remaining = max_results - books_found
      current_max = [remaining, per_page].min

      search_url = "https://www.googleapis.com/books/v1/volumes?q=#{URI.encode_www_form_component(query)}&key=#{api_key}&maxResults=#{current_max}&startIndex=#{start_index}"
      
      puts "Fetching from index #{start_index}..."
      response = HTTParty.get(search_url, headers: { 'User-Agent' => 'Gemini-CLI-Agent/1.0' })

      unless response.success?
        puts "Failed to fetch data, status: #{response.code}. Body: #{response.body}"
        break
      end

      items = response.parsed_response['items']
      if items.nil? || items.empty?
        puts "No more books found for the query."
        break
      end

      items.each do |item|
        volume_info = item['volumeInfo']
        next unless volume_info

        title = volume_info['title']
        next if title.blank?

        isbn = nil
        if volume_info['industryIdentifiers']
          isbn_13 = volume_info['industryIdentifiers'].find { |id| id['type'] == 'ISBN_13' }
          isbn_10 = volume_info['industryIdentifiers'].find { |id| id['type'] == 'ISBN_10' }
          isbn = isbn_13['identifier'] if isbn_13
          isbn ||= isbn_10['identifier'] if isbn_10
        end

        # If ISBN is missing, try to find it on Open Library
        if isbn.blank?
          isbn = find_isbn_on_open_library(title)
        end

        # If ISBN is still missing, generate a unique placeholder
        if isbn.blank?
          placeholder = "NOISBN_#{title.parameterize}_#{SecureRandom.hex(4)}"
          puts "    -> Could not find ISBN. Generating placeholder: #{placeholder}"
          isbn = placeholder
        end

        book = Book.find_or_initialize_by(isbn: isbn)
        new_book = book.new_record?

        # Don't overwrite existing data with nil from the new API call
        book.title ||= title
        book.author ||= volume_info['authors']&.join(', ')
        book.description ||= volume_info['description']
        book.genres ||= volume_info['categories']
        book.cover_image_url ||= volume_info.dig('imageLinks', 'thumbnail')
        book.average_rating ||= volume_info['averageRating']
        book.ratings_count ||= volume_info['ratingsCount']
        book.save