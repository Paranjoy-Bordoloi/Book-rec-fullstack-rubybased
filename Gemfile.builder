source "https://rubygems.org"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.0.2", ">= 8.0.2.1"
# The modern asset pipeline for Rails [https://github.com/rails/propshaft]
gem "propshaft"
# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 6.4"
# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
gem "importmap-rails"
# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem "turbo-rails"
# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem "stimulus-rails"
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder"
gem "rack-cors"
# Use Redis adapter to run Action Cable in production
# gem "redis", ">= 4.0.1"
gem "mongoid", "~> 8.0"
gem "nokogiri"
gem "httparty"
gem "certified"
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[ windows jruby ]
gem "bcrypt", "~> 3.1.7"
gem "jwt"
gem "jsonapi-serializer"
# Add kaminari for pagination
gem "kaminari"
gem "kaminari-mongoid"

group :development, :test do
  gem "dotenv-rails"
  gem "rspec-rails", "~> 6.1"
  gem "factory_bot_rails", "~> 6.4"
  gem "faker", "~> 3.3"
end