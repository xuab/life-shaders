import state from './state'

import vertexSource from './shaders/vertex.glsl'
import computeSource from './shaders/compute.glsl'
import displaySource from './shaders/display.glsl'

let gl = null

let computeProgram = null
let displayProgram = null
let vertexBuffer = null
let textureCoordBuffer = null

let textures = []
let framebuffers = []
let activeIndex = 0
const activeTexture = () => textures[activeIndex]
const modTexture = () => textures[2]
const inactiveFramebuffer = () => framebuffers[1 - activeIndex]
const flipFlop = () => (activeIndex = 1 - activeIndex)

let zeroPixels = null
let modPixels = null
let modPixelsDirty = false
let modPixelsUploaded = false

export function init (canvas) {
  gl = canvas.getContext('webgl')

  computeProgram = createComputeProgram()
  if (!computeProgram) return false

  displayProgram = createDisplayProgram()
  if (!displayProgram) return false

  vertexBuffer = createBuffer([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)
  textureCoordBuffer = createBuffer([0, 0, 1, 0, 0, 1, 1, 1], 2)

  createTextures({ random: false })
}

function createComputeProgram () {
  const prog = createProgram(vertexSource, computeSource)
  if (!prog) return false
  gl.useProgram(prog)

  prog.position = gl.getAttribLocation(prog, 'position')
  prog.a_uv = gl.getAttribLocation(prog, 'a_uv')
  prog.sampler = gl.getUniformLocation(prog, 'sampler')
  prog.mod_sampler = gl.getUniformLocation(prog, 'mod_sampler')
  prog.dx = gl.getUniformLocation(prog, 'dx')
  prog.dy = gl.getUniformLocation(prog, 'dy')
  prog.cool_down_rate = gl.getUniformLocation(prog, 'cool_down_rate')

  gl.enableVertexAttribArray(prog.position)
  gl.enableVertexAttribArray(prog.a_uv)
  gl.uniform1f(prog.cool_down_rate, state.coolDownRate)

  return prog
}

function createDisplayProgram () {
  const prog = createProgram(vertexSource, displaySource)
  if (!prog) return false
  gl.useProgram(prog)

  prog.position = gl.getAttribLocation(prog, 'position')
  prog.a_uv = gl.getAttribLocation(prog, 'a_uv')
  prog.sampler = gl.getUniformLocation(prog, 'sampler')
  prog.r = gl.getUniformLocation(prog, 'r')
  prog.g = gl.getUniformLocation(prog, 'g')
  prog.b = gl.getUniformLocation(prog, 'b')

  gl.enableVertexAttribArray(prog.position)
  gl.enableVertexAttribArray(prog.a_uv)
  gl.uniform1f(prog.r, 0.8)
  gl.uniform1f(prog.g, 0.0)
  gl.uniform1f(prog.b, 0.3)

  return prog
}

function createProgram (vertexSource, fragmentSource) {
  const vertexShader = createShader(vertexSource, gl.VERTEX_SHADER)
  if (!vertexShader) return false

  const fragmentShader = createShader(fragmentSource, gl.FRAGMENT_SHADER)
  if (!fragmentShader) return false

  const program = gl.createProgram()

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getError())
    return false
  }

  return program
}

function createShader (source, type) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const shaderType = gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'
    console.error(`Error with ${shaderType} SHADER:`, gl.getShaderInfoLog(shader))
    return false
  }
  return shader
}

function createBuffer (coords, elementSize) {
  const buff = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buff)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW)
  buff.element_size = elementSize
  buff.count = 4
  return buff
}

function createDeadPopulation () {
  return new Uint8Array(state.width * state.height * 4).fill(0)
}

function setPixel (pixels, x, y, value) {
  if (x < 0 || y < 0 || x > state.width || y > state.height) return false
  const offset = (y * state.width + x) * 4
  pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = pixels[offset + 3] = value
}

export function setPixels (x, y, deltas) {
  deltas.forEach(([dx, dy]) => setPixel(modPixels, x + dx, y + dy, 0xff))
  modPixelsDirty = true
}

export function setRandom () {
  gl.uniform1f(displayProgram.r, Math.random())
  gl.uniform1f(displayProgram.g, Math.random())
  gl.uniform1f(displayProgram.b, Math.random())
  modPixels = createRandomPopulation()
  modPixelsDirty = true
}

function createRandomPopulation (density = 0.05) {
  const cells = new Uint8Array(state.width * state.height * 4)
  for (let i = 0; i < cells.length; i += 4) {
    const c = Math.random() > density ? 0 : 0xff
    cells[i] = cells[i + 1] = cells[i + 2] = cells[i + 3] = c
  }
  return cells
}

function createTexture (pixels) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

  // TODO: use a simpler texture format than RGBA UNSIGNED_BYTE
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, state.width, state.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixels))

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

  return texture
}

function createFramebuffer (texture) {
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  return framebuffer
}

function createTextures ({ random = false } = {}) {
  const pixels = random ? createRandomPopulation() : createDeadPopulation()
  modPixels = createDeadPopulation()
  zeroPixels = createDeadPopulation()
  textures = [pixels, pixels, modPixels].map(createTexture)
  framebuffers = textures.slice(0, 2).map(createFramebuffer)
  modPixelsDirty = true
}

function uploadModTexture () {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, state.width, state.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(modPixels))
  if (modPixelsDirty) {
    modPixels = zeroPixels.slice()
    modPixelsUploaded = true
    modPixelsDirty = false
  } else if (modPixelsUploaded) {
    modPixelsUploaded = false
  }
}

export function compute () {
  gl.viewport(0, 0, state.width, state.height)
  gl.useProgram(computeProgram)
  gl.bindFramebuffer(gl.FRAMEBUFFER, inactiveFramebuffer())
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.vertexAttribPointer(computeProgram.a_uv, textureCoordBuffer.element_size, gl.FLOAT, false, 0, 0)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, activeTexture())
  gl.uniform1i(computeProgram.sampler, 0)
  gl.uniform1f(computeProgram.dx, 1 / state.width)
  gl.uniform1f(computeProgram.dy, 1 / state.height)

  flipFlop()

  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, modTexture())
  uploadModTexture()
  gl.uniform1i(computeProgram.mod_sampler, 1)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.vertexAttribPointer(computeProgram.position, vertexBuffer.element_size, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.count)
  gl.flush()
}

export function display () {
  gl.viewport(0, 0, state.width, state.height)
  gl.useProgram(displayProgram)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.vertexAttribPointer(displayProgram.a_uv, textureCoordBuffer.element_size, gl.FLOAT, false, 0, 0)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, activeTexture())
  gl.uniform1i(displayProgram.sampler, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.vertexAttribPointer(displayProgram.position, vertexBuffer.element_size, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.count)
  gl.flush()
}
