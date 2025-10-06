class Api::V1::UsersController < Api::V1::BaseController
  skip_before_action :authenticate_request, only: [:create]

  def create
    user = User.new(user_params)
    if user.save
      token = jwt_encode(user_id: user.id)
      render json: { token: token, user: UserSerializer.new(user).serializable_hash[:data][:attributes] }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :bad_request
    end
  end

  def show
    render json: UserSerializer.new(@current_user).serializable_hash[:data][:attributes]
  end

  def stats
    total_books_read = @current_user.reading_lists.sum { |list| list.books.count }
    genres = @current_user.reading_lists.map { |list| list.books.map(&:genres) }.flatten.compact
    most_read_genre = genres.group_by(&:itself).transform_values(&:count).max_by { |_, count| count }&.first

    render json: {
      total_books_read: total_books_read,
      most_read_genre: most_read_genre
    }
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end
end