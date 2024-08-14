precision highp float;

varying vec3 v_color;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_time;
uniform float u_volume;

vec2 rot(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

void main() {
    vec4 result = texture2D(u_texture, rot(v_uv * max(1.0, 1.0 + u_volume), u_time + u_volume));
    result *= vec4(v_color, 1.0);
    result *= vec4(1.0 - u_volume * 0.1);
    gl_FragColor = result;
}
