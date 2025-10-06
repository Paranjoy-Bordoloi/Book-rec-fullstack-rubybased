class Api::V1::ReadingListsController < Api::V1::BaseController
  before_action :set_reading_list, only: [:show, :update, :destroy, :add_book, :remove_book]

  def index
    @reading_lists = @current_user.reading_lists.includes(:books)
    render json: @reading_lists.map { |rl|
      {
        id: rl._id.to_s,
        name: rl.name,
        public: rl.public,
        books: rl.books.map { |b|
          # reuse Book#as_json which adds id
          b.as_json
        }
      }
    }
  end

  def show
    render json: {
      id: @reading_list._id.to_s,
      name: @reading_list.name,
      public: @reading_list.public,
      books: @reading_list.books.map { |b| b.as_json }
    }
  end

  def create
    @reading_list = @current_user.reading_lists.new(reading_list_params)
    if @reading_list.save
      render json: { id: @reading_list._id.to_s, name: @reading_list.name, public: @reading_list.public }, status: :created
    else
      render json: { errors: @reading_list.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @reading_list.update(reading_list_params)
      render json: @reading_list
    else
      render json: { errors: @reading_list.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @reading_list.destroy
    head :no_content
  end

  def add_book
    @book = Book.find(params[:book_id])
    if @reading_list.books.include?(@book)
      render json: { message: "Book is already in the reading list" }, status: :unprocessable_entity
    else
      @reading_list.books << @book
      render json: @reading_list
    end
  rescue Mongoid::Errors::DocumentNotFound
    render json: { error: "Book not found" }, status: :not_found
  end

  def remove_book
    @book = Book.find(params[:book_id])
    @reading_list.books.delete(@book)
    render json: @reading_list
  rescue Mongoid::Errors::DocumentNotFound
    render json: { error: "Book not found" }, status: :not_found
  end

  private

  def set_reading_list
    @reading_list = @current_user.reading_lists.find(params[:id])
  rescue Mongoid::Errors::DocumentNotFound
    render json: { error: "Reading list not found" }, status: :not_found
  end

  def reading_list_params
    params.require(:reading_list).permit(:name, :public)
  end
end
