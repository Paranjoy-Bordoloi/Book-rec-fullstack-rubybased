class Api::V1::BooksController < ActionController::API
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
    if @book.genres.present?
      @similar_books = Book.where(genres: @book.genres.first, :id.ne => @book.id).limit(5)
    else
      @similar_books = []
    end
    render json: @similar_books
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

    render json: @books
  end
end
