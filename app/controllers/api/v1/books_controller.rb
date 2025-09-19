class Api::V1::BooksController < ActionController::API
  def index
    @books = Book.all
    render json: @books
  end

  def show
    @book = Book.find(params[:id])
    render json: @book
  end

  def search
    @books = Book.where('$text': { '$search': params[:query] })
    render json: @books
  end
end


