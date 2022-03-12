#ifdef GL_ES
  precision mediump float;
#endif
attribute vec3 position;
attribute vec2 a_uv;
varying vec2 uv;

void main() {
  gl_Position = vec4(position, 1.0);
  uv = a_uv;
}
