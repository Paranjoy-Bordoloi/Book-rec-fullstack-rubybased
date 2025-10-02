Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :books, only: [:index, :show], defaults: { format: :json } do
        member do
          get :similar
        end
      end
      get 'genres', to: 'books#genres'
      get 'homepage_feed', to: 'books#homepage_feed'
      get 'search', to: 'books#search'
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
