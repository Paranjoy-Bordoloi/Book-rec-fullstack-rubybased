require 'rails_helper'

RSpec.describe Book, type: :model do
  describe '#as_json' do
    it 'includes string id and fields' do
      book = Book.new(title: 'Dune', author: 'Frank Herbert', isbn: '1234567890')
      json = book.as_json

      expect(json['title']).to eq('Dune')
      expect(json['author']).to eq('Frank Herbert')
      # id should be a string (since as_json converts _id to string)
      expect(json['id']).to be_a(String)
    end
  end
end
