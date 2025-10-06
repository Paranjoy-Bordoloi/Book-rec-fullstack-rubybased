# Debug script to inspect reading lists for a known user id
uid = BSON::ObjectId('68e0088bc598fb6743c64fd5') rescue nil
user = User.where(_id: uid).first
if user.nil?
  puts "User not found for id #{uid.inspect}"
  exit 1
end
puts "Found user: "+(user.email || user.name || user._id.to_s)
lists = user.reading_lists.to_a
puts "reading_lists_count=#{lists.count}"
require 'json'
puts JSON.pretty_generate(lists.map{|rl|
  {
    id: rl._id.to_s,
    name: rl.name,
    public: rl.public,
    book_ids: rl.books.map{ |b| b._id.to_s }
  }
})
