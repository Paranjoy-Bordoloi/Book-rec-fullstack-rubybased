# Creates a demo reading list for a known user and writes the API index response to tmp/demo_output.json
require 'json'

USER_ID = ENV['USER_ID'] || '68e0088bc598fb6743c64fd5'
begin
  user = User.find(BSON::ObjectId(USER_ID))
rescue => e
  File.write(Rails.root.join('tmp','demo_output.json'),({ error: "user lookup failed: #{e.message}" }.to_json))
  exit 1
end

rl = user.reading_lists.create(name: "Demo List #{Time.now.to_i}", public: false)

# Generate token using JsonWebToken concern
obj = Object.new
obj.extend(JsonWebToken)
token = obj.jwt_encode({ user_id: user.id.to_s }, 1.hour.from_now)

# Use Rails integration session
sess = ActionDispatch::Integration::Session.new(Rails.application)
sess.header 'Authorization', "Bearer #{token}"
sess.header 'Accept', 'application/json'
sess.get '/api/v1/reading_lists'

out = {
  created_reading_list: { id: rl._id.to_s, name: rl.name },
  status: sess.response.status,
  content_type: sess.response.content_type,
  body: begin
    JSON.parse(sess.response.body)
  rescue
    sess.response.body
  end
}

File.write(Rails.root.join('tmp','demo_output.json'), JSON.pretty_generate(out))
puts "Wrote tmp/demo_output.json"
