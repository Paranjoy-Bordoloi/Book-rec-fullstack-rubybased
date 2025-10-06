Rails.application.routes.draw do
  # Return 204 for any requests under /.well-known to silence browser probes (Chrome DevTools, PWAs)
  match '/.well-known/*path', to: proc { |_env| [204, { 'Content-Type' => 'text/plain' }, ['']] }, via: :all

  # Web (MPA) reading lists - public views
  resources :reading_lists, only: [:index, :show]

  namespace :api do
    namespace :v1 do
      post "authentication/login", to: "authentication#login"
      resources :users, only: [:create, :show] do
        get :stats, on: :collection
      end
      resources :books, only: [:index, :show], defaults: { format: :json } do
        member do
          get :similar
          post :generate_tags
        end
        collection do
          get :search
          get 'tags/:tag', to: 'books#search_by_tag', as: :search_by_tag
        end
      end
      resources :reading_lists, except: [:new, :edit] do
        member do
          post 'add_book/:book_id', to: 'reading_lists#add_book', as: :add_book
          delete 'remove_book/:book_id', to: 'reading_lists#remove_book', as: :remove_book
        end
      end
      get 'genres', to: 'books#genres'
      get 'homepage_feed', to: 'books#homepage_feed'
      get 'all_tags', to: 'books#all_tags'
    end
  end

  root to: "pages#search"
  get "search", to: "pages#search"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
end
