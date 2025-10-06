import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "query", "results" ]

  search(event) {
    event.preventDefault()
    const query = this.queryTarget.value

    fetch(`/api/v1/search?query=${query}`)
      .then(response => response.json())
      .then(data => {
        this.resultsTarget.innerHTML = ""
        data.forEach(book => {
          const bookElement = document.createElement("div")
          bookElement.innerHTML = `
            <h2>${book.title}</h2>
            <p>${book.author}</p>
            <p>${book.description}</p>
          `
          this.resultsTarget.appendChild(bookElement)
        })
      })
  }
}
