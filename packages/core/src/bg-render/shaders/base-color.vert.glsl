precision highp float;

attribute vec2 a_pos;
attribute vec3 a_color;
varying vec3 v_color;

void main() {
    v_color = a_color;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
