precision highp float;

varying vec3 v_color;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_time;

vec2 rot(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

void main() {
    gl_FragColor = vec4(v_color, 1.0) * texture2D(u_texture, rot(v_uv, u_time));
}
