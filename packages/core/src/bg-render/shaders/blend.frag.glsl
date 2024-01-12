#version 300 es
precision highp float;

uniform sampler2D src;
uniform float lerp;
uniform float scale;
in vec2 f_v_coord;
out vec4 fragColor;

void main() {
    vec2 tex_coord = f_v_coord;
    if(scale < 1.0f) {
        tex_coord /= scale;
    }
    vec4 srcColor = texture(src, tex_coord);
    fragColor = mix(vec4(srcColor.xyz, 0.0f), srcColor, lerp);
}
