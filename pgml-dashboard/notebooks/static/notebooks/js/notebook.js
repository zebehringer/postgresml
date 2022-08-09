import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = [
    'newLineCode',
    'lines',
    'existingLine',
  ];

  connect() {
    this.newLineCodeMirror = CodeMirror.fromTextArea(this.newLineCodeTarget, {
      lineWrapping: true,
      matchBrackets: true,
    })

    this.newLineCodeMirror.setSize('100%', 100)
    this.exitingLinesCodeMirror = {}
    this.deleteTimeouts = {}
  }

  initCodeMirrorOnTarget(target) {
    const codeMirror = CodeMirror.fromTextArea(target, {
      lineWrapping: true,
      matchBrackets: true,
    })

    codeMirror.setSize('100%', 100)
    this.exitingLinesCodeMirror[target.dataset.lineId] = codeMirror
  }

  enableEdit(event) {
    const target = event.currentTarget
    const lineId = target.dataset.lineId

    const line = document.getElementById(`line-${lineId}`)

    // Display the textarea first to get proper dimensions into the DOM
    line.querySelector('.notebook-line-edit').classList.remove('hidden')

    // Initialize CodeMirror after element is rendered
    this.initCodeMirrorOnTarget(line.querySelector('.notebook-line-edit textarea'))

    target.remove()
  }

  editLine(event) {
    event.preventDefault()
    const target = event.currentTarget
    const lineId = target.dataset.lineId

    this.exitingLinesCodeMirror[lineId].save()

    const form = new FormData(target)
    const url = target.action
    const body = new URLSearchParams(form)
    

    fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    })
    .then(res => res.text())
    .then(text => {
      const child = document.getElementById(`line-${lineId}`)

      // Build new line element
      const template = document.createElement('template')
      text = text.trim()
      template.innerHTML = text


      const newChild = template.content.firstChild
      const newLineId = newChild.dataset.lineId

      // Replace old line with new line
      child.parentNode.replaceChild(newChild, child)

      // Don't leak memory
      delete this.exitingLinesCodeMirror[lineId]
    })
  }

  deleteLine(event) {
    event.preventDefault()
    const target = event.currentTarget

    const form = new FormData(target)
    const url = target.action
    const body = new URLSearchParams(form)
    const lineId = target.dataset.lineId

    fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    })
    .then(res => res.text())
    .then(text => {
      const template = document.createElement('template')
      text = text.trim()
      template.innerHTML = text

      const child = document.getElementById(`line-${lineId}`)
      child.parentNode.replaceChild(template.content.firstChild, child)

      // Remove the undo in 5 seconds
      this.deleteTimeouts[lineId] = window.setTimeout(() => {
        document.getElementById(`line-${lineId}`).remove()
        delete this.deleteTimeouts[lineId]
      }, 5000)
    })
  }

  undoDeleteLine(event) {
    event.preventDefault()

    const target = event.currentTarget
    const lineId = target.dataset.lineId

    window.clearTimeout(this.deleteTimeouts[lineId])
    delete this.deleteTimeouts[lineId]

    const form = new FormData(target)
    const url = target.action
    const body = new URLSearchParams(form)

    fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    })
    .then(res => res.text())
    .then(text => {
      const template = document.createElement('template')
      text = text.trim()
      template.innerHTML = text

      const child = document.getElementById(`line-${lineId}`)
      child.parentNode.replaceChild(template.content.firstChild, child)
    })
  }

  // Add a new line to the notebook.
  // Submit via AJAX, add the result to the end of the notebook,
  // and scroll to the bottom of the page.
  addLine(event) {
    event.preventDefault()
    const target = event.currentTarget
    
    const form = new FormData(target)
    const url = target.action
    const entries = []

    for (let entry of form.entries()) {
      if (entry[0] === 'csrfmiddlewaretoken')
        entries.push(`${entry[0]}=${entry[1]}`)
    }

    entries.push(`contents=${encodeURIComponent(this.newLineCodeMirror.getValue())}`)

    fetch(url, {
      method: 'POST',
      body: entries.join('&'),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-CSRFToken': entries['csrfmiddlewaretoken'],
      },
    })
    .then(res => res.text())
    .then(text => {
      this.linesTarget.innerHTML += text
      window.scrollTo(0, document.body.scrollHeight)
      this.newLineCodeMirror.setValue('')
    })
  }
}
