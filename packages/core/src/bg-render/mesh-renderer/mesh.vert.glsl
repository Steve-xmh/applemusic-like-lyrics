precision highp float;

attribute vec2 a_pos;
attribute vec3 a_color;
attribute vec2 a_uv;
varying vec3 v_color;
varying vec2 v_uv;

void main() {
    v_color = a_color;
    v_uv = a_uv;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
