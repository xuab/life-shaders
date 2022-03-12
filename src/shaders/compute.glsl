#ifdef GL_ES
  precision mediump float;
#endif

varying vec2 uv;
uniform sampler2D sampler;
uniform sampler2D mod_sampler;
uniform float dx;
uniform float dy;
uniform float cool_down_rate;

int f(float x, float y) {
  return texture2D(sampler, uv + vec2(x, y)).a == 1. ? 1 : 0;
}

int count_neighbors(void) {
  return f(0., dy) + f(dx, dy) + f(dx, 0.) + f(dx, -dy) + f(0., -dy) +
         f(-dx, -dy) + f(-dx, 0.) + f(-dx, dy);
}

void main(void) {
  float state = texture2D(sampler, uv).a;
  float cool = state - cool_down_rate;
  float mod_state = texture2D(mod_sampler, uv).a;

  float alpha;
  if (mod_state > 0.) {
    alpha = state == 1. ? cool : 1.;
  } else {
    int neighbors = count_neighbors();
    alpha = state == 1.
      ? neighbors < 2 || neighbors > 3 ? cool : 1.
      : neighbors == 3 ? 1. : cool;
  }
  gl_FragColor = vec4(0., 0., 0., alpha);
}
