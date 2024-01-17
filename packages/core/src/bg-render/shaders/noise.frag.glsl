#version 300 es
precision highp float;

uniform sampler2D src;
uniform float frameTime;
uniform vec2 renderSize;
in vec2 f_v_coord;
out vec4 fragColor;

float nrand(vec2 n) {
    return fract(sin(dot(n.xy, vec2(12.9898f, 78.233f))) * 43758.5453f);
}

vec3 nrand3(vec2 n) {
    return vec3(nrand(n), nrand(n + vec2(0.15f)), nrand(n + vec2(0.3f)));
}

float blur_radius = 0.01f; //Blur radius, tweak it ;)

/* Gradient noise from Jorge Jimenez's presentation: */
/* http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare */
float gradientNoise(in vec2 uv)
{
	return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

void main() {
    vec2 tex_coord = f_v_coord;

    float dither = (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy) - (0.5 / 255.0);

    vec4 color = texture(src, tex_coord);
    #if 1
    int count = 0;
    vec3 sampled_color = vec3(0.0f);
    for(float i = -2.f; i <= 2.f; i += 1.f) {
        for(float j = -2.f; j <= 2.f; j += 1.f) {
            vec2 offset = blur_radius * (fract(vec2(0.61803398875f, 0.38196601125f) * 1.f) - 0.5f + vec2(sin(i), cos(j)) / 32.f) + dither * .1;
            sampled_color += textureLod(src, offset + tex_coord, 3.0f).xyz;
            count++;
        }
    }
    sampled_color /= vec3(count);
    #else
    vec2 offset = blur_radius * (fract(vec2(0.61803398875f, 0.38196601125f) * 1.f) - 0.5f) + dither * .5;
    vec3 sampled_color = textureLod(src, offset - tex_coord, 3.0f).xyz;
    #endif

    vec3 deviation = sampled_color - color.rgb;

    vec3 blend_factor = vec3(lessThan(deviation, vec3(0.02f)));

    color.rgb = mix(color.rgb, sampled_color, blend_factor);

    color += dither;
    fragColor = color;
}
