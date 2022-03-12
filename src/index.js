import Stats from 'stats.js'

import state from './state'
import * as patterns from './patterns'
import * as gl from './gl'

const ZOOM_FACTOR = 0.01
const CURSOR_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAAXRSTlMAQObYZgAAAA5JREFUCNdj+M+AFeECACMbB/keX8eiAAAAAElFTkSuQmCC'

const stats = new Stats()
document.body.appendChild(stats.dom)

const canvas = document.querySelector('#life')
canvas.width = state.width
canvas.height = state.height
zoom(state.zoom)

gl.init(canvas)

animate()

canvas.addEventListener('mousedown', onMousedown)
canvas.addEventListener('mouseover', onMouseover)
canvas.addEventListener('wheel', onWheel, {passive: true})

function animate () {
  requestAnimationFrame(animate)
  gl.compute()
  gl.display()
  stats.update()
}

function onWheel (e) {
  state.zoom *= 1 + ZOOM_FACTOR * (e.deltaY > 0 ? 1 : -1)
  zoom(state.zoom)
}

function onMouseover () {
  canvas.style.cursor = `url(${CURSOR_PNG}), auto`
}

function onMousedown (e) {
  e.preventDefault()
  bufferPosition(e.clientX, e.clientY)
  canvas.addEventListener('mousemove', onMousemove)
  canvas.addEventListener('mouseup', onMouseup)
}

function onMousemove (e) {
  e.preventDefault()
  bufferPosition(e.clientX, e.clientY)
}

function onMouseup () {
  canvas.removeEventListener('mousemove', onMousemove)
  canvas.removeEventListener('mouseup', onMouseup)
}

function zoom (x) {
  canvas.style.transform = `scale(${x})`
}

function bufferPosition (mouseX, mouseY) {
  const rect = canvas.getBoundingClientRect()
  const x = (mouseX - rect.left) / state.zoom >> 0
  const y = (mouseY - rect.top) / state.zoom >> 0
  gl.setPixels(x, y, patterns.random())
}

document.onkeydown = e => {
  switch (e.keyCode) {
    case 82: gl.setRandom(); break
  }
}
