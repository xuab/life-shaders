#ifdef GL_ES
  precision mediump float;
#endif
varying vec2 uv;
uniform sampler2D sampler;
uniform float r;
uniform float g;
uniform float b;

void main(void) {
  float state = texture2D(sampler, uv).a;
  if (state == 1.) {
    gl_FragColor = vec4(1., 1., 1., 1.);
  } else {
    gl_FragColor = vec4(r * state, g * state, b * state, state);
  }
}
