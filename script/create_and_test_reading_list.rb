# Create a demo reading list for a user and call the API with JWT
require 'net/http'
require 'uri'
require 'json'

uid = BSON::ObjectId('68e0088bc598fb6743c64fd5') rescue (puts 'Invalid user id'; exit 1)
user = User.where(_id: uid).first
if user.nil?
  puts "User not found for id #{uid}"
  exit 1
end
puts "Found user: #{user.email || user.name || user._id.to_s}"

# Create demo reading list
rl = user.reading_lists.create(name: 'Demo List from script', public: false)
puts "Created reading list: #{rl._id.to_s} - #{rl.name}"

# Generate JWT for user
include JsonWebToken
# We need an instance to call jwt_encode --- use a basic object that includes the concern
obj = Object.new
obj.extend(JsonWebToken)
token = obj.jwt_encode({ user_id: user.id.to_s }, 1.hour.from_now)
puts "Generated token: #{token[0..40]}..."

# Call the controller action internally using Rails integration session (no external server needed)
session = ActionDispatch::Integration::Session.new(Rails.application)
session.header 'Authorization', "Bearer #{token}"
session.header 'Accept', 'application/json'
session.get '/api/v1/reading_lists'
puts "Integration response status: #{session.response.status}"
ct = session.response.headers['Content-Type'] || ''
if ct.include?('application/json')
  begin
    puts JSON.pretty_generate(JSON.parse(session.response.body))
  rescue => e
    puts "Failed to parse JSON: #{e.message}"
    puts session.response.body
  end
else
  puts "Response body (len=#{session.response.body&.length}):"
  puts session.response.body
end
