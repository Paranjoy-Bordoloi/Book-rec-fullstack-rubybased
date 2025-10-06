class ReadingListsController < ApplicationController
  # For now, show public lists and user's lists if logged in
  def index
    if current_user
      @reading_lists = ReadingList.where(user_id: current_user.id)
    else
      @reading_lists = ReadingList.where(public: true)
    end
  end

  def show
    @reading_list = ReadingList.find(params[:id])
    # allow showing public lists to unauthenticated users
    unless @reading_list.public || (current_user && @reading_list.user_id == current_user.id)
      redirect_to reading_lists_path, alert: 'Reading list not available.'
      return
    end
  end
end
