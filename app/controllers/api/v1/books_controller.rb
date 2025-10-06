class Api::V1::BooksController < Api::V1::BaseController
  skip_before_action :authenticate_request, only: [:index, :show, :similar, :genres, :homepage_feed, :search, :all_tags, :search_by_tag]

  def index
    render_homepage_feed
  end

  def show
    return head :not_found if params[:id] == 'undefined'
    @book = Book.find(params[:id])
    render json: @book
  end


  def similar
    return head :not_found if params[:id] == 'undefined'
    @book = Book.find(params[:id])

    # If the book has no genres or author, we can't make a good recommendation.
    if @book.genres.blank? || @book.author.blank?
      return render json: []
    end

    @similar_books = Book.collection.aggregate([
      {
        # Match books that share at least one genre and are not the same book
        '$match': {
          genres: { '$in': @book.genres },
          _id: { '$ne': @book.id }
        }
      },
      {
        # Add a calculated score field
        '$addFields': {
          'recommendation_score': {
            '$add': [
              # Score based on number of matching genres (weight: 5)
              { '$multiply': [{ '$size': { '$setIntersection': ['$genres', @book.genres] } }, 5] },
              # Big bonus for same author (weight: 25)
              { '$cond': { if: { '$eq': ['$author', @book.author] }, then: 25, else: 0 } },
              # Small bonus for average rating
              { '$ifNull': ['$average_rating', 0] }
            ]
          }
        }
      },
      # Sort by the new score, descending
      { '$sort': { 'recommendation_score': -1 } },
      # Limit to top 10 results
      { '$limit': 10 }
    ]).to_a # .to_a to execute the aggregation

    # Ensure all book IDs are strings for consistent JSON output
    books_with_string_ids = @similar_books.map do |book|
      book['_id'] = book['_id'].to_s
      book
    end

    render json: books_with_string_ids
  end

  def genres
    render json: Book.pluck(:genres).flatten.compact.uniq.sort
  end

  def homepage_feed
    render_homepage_feed
  end

  def search
    render_search_results
  end

  def all_tags
    # Get all unique, non-nil tags, sorted alphabetically
    tags = Book.distinct(:tags).compact.sort
    render json: tags
  end

  def search_by_tag
    @books = Book.where(tags: params[:tag])
    render json: @books
  end

  def generate_tags
    @book = Book.find(params[:id])
    
    # Initialize the AI client
    # (Requires GOOGLE_API_KEY environment variable)
    client = GenAI::Language.new(:google_palm2, ENV['GOOGLE_API_KEY'])
    
    # Create a prompt
    prompt = "Based on the following book description, generate a list of 5 to 7 relevant tags or keywords. Return them as a simple comma-separated string. Do not include quotes or a preamble.\n\nDescription: #{@book.description}"
    
    # Call the AI
    response = client.complete(prompt, temperature: 0.3, max_tokens: 50)
    
    # Process the result and update the book
    if response.value
      new_tags = response.value.split(',').map(&:strip)
      @book.tags ||= []
      @book.tags.concat(new_tags).uniq!
      @book.save
    end
    
    render json: @book
  end

  private

  def render_homepage_feed
    # Get top 5 genres by book count
    top_genres = Book.collection.aggregate([
      { '$unwind' => '$genres' },
      { '$group' => { '_id' => '$genres', 'count' => { '$sum' => 1 } } },
      { '$sort' => { 'count' => -1 } },
      { '$limit' => 5 }
    ]).map { |g| g['_id'] }

    feed = top_genres.each_with_object({}) do |genre, h|
      h[genre] = Book.where(genres: genre).order_by(ratings_count: :desc).limit(10)
    end

    if feed.empty?
        feed["Recently Added"] = Book.order_by(created_at: :desc).limit(10)
    end

    render json: { is_homepage_feed: true, feed: feed }
  end

  def render_search_results
    # Return an empty set if no query parameters are provided to avoid loading all books.
    if params[:query].blank? && params[:genre].blank? && params[:rating].blank?
      render json: []
      return
    end

    @books = Book.all

    if params[:query].present?
      query = Regexp.escape(params[:query])
      regex = Regexp.new(query, Regexp::IGNORECASE)
      @books = @books.where('$or': [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { description: regex }
      ])
    end

    if params[:genre].present?
      @books = @books.where(genres: params[:genre])
    end

    if params[:rating].present?
      @books = @books.where(:average_rating.gte => params[:rating].to_f)
    end

    if params[:sort].present?
      case params[:sort]
      when 'popularity'
        @books = @books.order_by(ratings_count: :desc)
      when 'rating'
        @books = @books.order_by(average_rating: :desc)
      when 'title'
        @books = @books.order_by(title: :asc)
      end
    end

    # Paginate results using the kaminari gem.
    # `page` comes from the request params, `per` sets the number of items per page.
    @books = @books.page(params[:page]).per(25)

    # Set pagination headers for the client
    response.headers['X-Total'] = @books.total_count
    response.headers['X-Per-Page'] = @books.limit_value
    response.headers['X-Page'] = @books.current_page

    render json: @books
  end
end
