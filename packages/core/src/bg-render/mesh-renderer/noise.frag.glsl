precision highp float;

/* Gradient noise from Jorge Jimenez's presentation: */
/* http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare */
float gradientNoise(in vec2 uv) {
    return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

void main() {
    float dither = (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy) - (0.5 / 255.0);
    // vec4 color = texture2D(u_tex, v_pos);
    // color += dither;
    gl_FragColor = vec4(0, 0, 0, dither);
}
