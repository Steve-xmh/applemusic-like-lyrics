precision highp float;

uniform sampler2D u_texture;

/* Gradient noise from Jorge Jimenez's presentation: */
/* http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare */
float gradientNoise(in vec2 uv) {
    const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
}

void main() {
    gl_FragColor = texture2D(u_texture, gl_FragCoord.xy) + gradientNoise(gl_FragCoord.xy) * (0.5 / 255.0);
}