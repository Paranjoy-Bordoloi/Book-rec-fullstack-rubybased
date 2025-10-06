namespace :demo do
  desc 'Create a demo reading list for a user and print the API index response. Provide USER_ID as ENV var.'
  task create_reading_list: :environment do
    require 'json'
    uid = ENV['USER_ID']
    unless uid
      puts "Usage: USER_ID=<BSON id> bin/rake demo:create_reading_list"
      exit 1
    end
    begin
      user = User.find(BSON::ObjectId(uid))
    rescue => e
      puts "User lookup failed: #{e.message}"
      exit 1
    end
    rl = user.reading_lists.create(name: 'Demo List (rake)', public: false)
    puts "Created reading list: #{rl._id.to_s} - #{rl.name}"

    # Generate token
    obj = Object.new
    obj.extend(JsonWebToken)
    token = obj.jwt_encode({ user_id: user.id.to_s }, 1.hour.from_now)
    puts "Generated token (truncated): #{token[0..40]}..."

    # Use internal integration session to call the index
    sess = ActionDispatch::Integration::Session.new(Rails.application)
    sess.header 'Authorization', "Bearer #{token}"
    sess.header 'Accept', 'application/json'
    sess.get '/api/v1/reading_lists'
    puts "Integration response status: #{sess.response.status}"
    if (sess.response.content_type || '').include?('application/json')
      out = JSON.parse(sess.response.body)
      puts JSON.pretty_generate(out)
      File.write(Rails.root.join('tmp','demo_reading_list_result.json'), JSON.pretty_generate(out))
    else
      puts "Response body (len=#{sess.response.body&.length}):"
      puts sess.response.body
      File.write(Rails.root.join('tmp','demo_reading_list_result.json'), sess.response.body || '')
    end
  end
end
