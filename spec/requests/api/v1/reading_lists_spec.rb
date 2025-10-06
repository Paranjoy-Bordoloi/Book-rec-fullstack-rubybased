require 'rails_helper'

RSpec.describe "Api::V1::ReadingLists", type: :request do
  let(:user) { create(:user) }
  let(:headers) { { "Authorization" => "Bearer #{JsonWebToken.encode(user_id: user.id)}" } }

  describe "GET /api/v1/reading_lists" do
    it "returns a user's reading lists" do
      create_list(:reading_list, 3, user: user)
      get "/api/v1/reading_lists", headers: headers
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body).size).to eq(3)
    end
  end

  describe "GET /api/v1/reading_lists/:id" do
    let(:reading_list) { create(:reading_list, user: user) }

    it "returns a reading list" do
      get "/api/v1/reading_lists/#{reading_list.id}", headers: headers
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)["id"]).to eq(reading_list.id.to_s)
    end

    it "returns a 404 for another user's reading list" do
      other_user = create(:user)
      other_reading_list = create(:reading_list, user: other_user)
      get "/api/v1/reading_lists/#{other_reading_list.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/reading_lists" do
    it "creates a reading list" do
      post "/api/v1/reading_lists", headers: headers, params: { reading_list: { name: "My List" } }
      expect(response).to have_http_status(:created)
      expect(user.reading_lists.count).to eq(1)
    end
  end

  describe "PUT /api/v1/reading_lists/:id" do
    let(:reading_list) { create(:reading_list, user: user) }

    it "updates a reading list" do
      put "/api/v1/reading_lists/#{reading_list.id}", headers: headers, params: { reading_list: { name: "New Name" } }
      expect(response).to have_http_status(:success)
      expect(reading_list.reload.name).to eq("New Name")
    end
  end

  describe "DELETE /api/v1/reading_lists/:id" do
    let(:reading_list) { create(:reading_list, user: user) }

    it "deletes a reading list" do
      delete "/api/v1/reading_lists/#{reading_list.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(ReadingList.where(id: reading_list.id).count).to eq(0)
    end
  end

  describe "POST /api/v1/reading_lists/:id/add_book/:book_id" do
    let(:reading_list) { create(:reading_list, user: user) }
    let(:book) { create(:book) }

    it "adds a book to a reading list" do
      post "/api/v1/reading_lists/#{reading_list.id}/add_book/#{book.id}", headers: headers
      expect(response).to have_http_status(:success)
      expect(reading_list.books.count).to eq(1)
    end

    it "returns a 422 if the book is already in the list" do
      reading_list.books << book
      post "/api/v1/reading_lists/#{reading_list.id}/add_book/#{book.id}", headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns a 404 if the book is not found" do
      post "/api/v1/reading_lists/#{reading_list.id}/add_book/123", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/reading_lists/:id/remove_book/:book_id" do
    let(:reading_list) { create(:reading_list, user: user) }
    let(:book) { create(:book) }

    before do
      reading_list.books << book
    end

    it "removes a book from a reading list" do
      delete "/api/v1/reading_lists/#{reading_list.id}/remove_book/#{book.id}", headers: headers
      expect(response).to have_http_status(:success)
      expect(reading_list.books.count).to eq(0)
    end
  end
end