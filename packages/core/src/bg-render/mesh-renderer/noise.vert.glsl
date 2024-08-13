precision highp float;

attribute vec2 a_pos;

void main() {
    gl_Position = vec4(a_pos * 2.0 - vec2(1.0, 1.0), 0.0, 1.0);
}
