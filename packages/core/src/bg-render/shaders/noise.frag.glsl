#version 300 es
precision highp float;

uniform sampler2D src;
in vec2 f_v_coord;
out vec4 fragColor;

/* Gradient noise from Jorge Jimenez's presentation: */
/* http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare */
float gradientNoise(in vec2 uv)
{
	return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

void main() {
    vec2 tex_coord = f_v_coord;
    vec4 color = texture(src, tex_coord);
    color += (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy) - (0.5 / 255.0);
    fragColor = color;
}
