class ReadingList
  include Mongoid::Document
  include Mongoid::Timestamps
  field :name, type: String
  field :public, type: Mongoid::Boolean, default: false

  belongs_to :user
  has_and_belongs_to_many :books
end
