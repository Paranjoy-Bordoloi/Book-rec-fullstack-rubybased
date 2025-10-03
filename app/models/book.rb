class Book
  include Mongoid::Document
  include Mongoid::Timestamps
  field :title, type: String
  field :author, type: String
  field :isbn, type: String
  field :description, type: String
  field :cover_image_url, type: String
  field :genres, type: Array
  field :average_rating, type: Float
  field :ratings_count, type: Integer
  field :tags, type: Array

  index({ title: 1 })
  index({ author: 1 })
  index({ tags: 1 })
  index({ title: 'text', author: 'text', description: 'text' })

  def as_json(options={})
    super(options).merge({
      id: self._id.to_s
    })
  end
end
