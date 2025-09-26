class Api::V1::BooksController < ActionController::API
  def index
    if params[:query].present?
      puts "Search query: #{params[:query]}"
      query = Regexp.escape(params[:query])
      regex = Regexp.new(query, Regexp::IGNORECASE)
      @books = Book.where('$or': [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { description: regex }
      ])
      puts "Found #{@books.count} books"
    elsif params[:genre].present?
      @books = Book.where(genres: params[:genre])
    else
      @books = Book.all
    end
    render json: @books
  end

  def show
    @book = Book.find(params[:id])
    render json: @book
  end

  def genres
    @genres = Book.distinct(:genres)
    render json: @genres
  end
end


