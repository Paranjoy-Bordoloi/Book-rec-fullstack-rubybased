class Api::V1::BooksController < ActionController::API
  def index
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

  def show
    @book = Book.find(params[:id])
    render json: @book
  end

  def genres
    @genres = Book.distinct(:genres).compact.sort
    render json: @genres
  end

  def similar
    @book = Book.find(params[:id])
    if @book.genres.present?
      @similar_books = Book.where(genres: @book.genres.first, :id.ne => @book.id).limit(5)
    else
      @similar_books = []
    end
    render json: @similar_books
  end
end