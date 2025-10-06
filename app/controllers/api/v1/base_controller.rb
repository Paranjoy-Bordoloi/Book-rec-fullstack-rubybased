class Api::V1::BaseController < ActionController::API
  include JsonWebToken

  before_action :authenticate_request
  before_action :disable_response_caching

  private

  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    begin
      decoded = jwt_decode(header)
      @current_user = User.find_by(id: decoded[:user_id])
    rescue Mongoid::Errors::DocumentNotFound => e
      render json: { errors: e.message }, status: :unauthorized
    rescue JWT::DecodeError => e
      render json: { errors: e.message }, status: :unauthorized
    end
  end

  def disable_response_caching
    # Ensure API responses are not cached by browsers or intermediate proxies
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
  end
end
