class PagesController < ApplicationController
  skip_before_action :authenticate_request, only: [:search]

  def search
  end
end
