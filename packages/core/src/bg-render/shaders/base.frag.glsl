#version 300 es
precision highp float;

uniform sampler2D src;
uniform float frameTime;
in vec2 f_v_coord;
out vec4 fragColor;

float nrand( vec2 n )
{
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

vec3 nrand3( vec2 n )
{
  return vec3(nrand(n),nrand(n+vec2(0.15f)),nrand(n+vec2(0.3f)));
}

float blur_radius = 0.035; //Blur radius, tweak it ;)

void main() {
    #if 1
    	float nrnd = (nrand( f_v_coord )-0.5f)/256.0f; //normalised noise of 1 pixel 1/256 power, mean 0
    	vec3 nrnd3 = (nrand3( f_v_coord )-vec3(0.5f))/256.0f; //normalised noise of 1 pixel 1/256 power, mean 0

    	vec4 color = texture(src, f_v_coord);

        int count = 0;
        vec3 sampled_color = vec3(0.0);
        for (float i = -2.f; i <= 2.f; i += 1.f) {
            for (float j = -2.f; j <= 2.f; j += 1.f) {
                vec2 offset = fract(vec2(0.61803398875, 0.38196601125) * 1. + nrand3( f_v_coord + frameTime ).xy) + vec2(sin(i), cos(j)) / 256.f - 0.5;
                sampled_color += textureLod(src, blur_radius * offset + f_v_coord, 3.0).xyz;
                count++;
            }
        }
        sampled_color /= vec3(count);
        vec3 deviation = sampled_color - color.rgb;
        deviation = max(vec3(0.0), sqrt(deviation * deviation));

        bvec3 blend_factor = lessThan(deviation, vec3(0.02945917622));

        color.rgb = mix(color.rgb, sampled_color, vec3(blend_factor));
    	//color.rgb += nrnd3;
        fragColor = color;
    #else
        float nrnd = (nrand( f_v_coord )-0.5f)/256.0f; //normalised noise of 1 pixel 1/256 power, mean 0
    	vec3 nrnd3 = (nrand3( f_v_coord )-vec3(0.5f))/256.0f; //normalised noise of 1 pixel 1/256 power, mean 0

    	vec4 color = texture(src, f_v_coord);

        vec2 offset = fract(vec2(0.61803398875, 0.38196601125) * 1. + nrand3( f_v_coord + frameTime ).xy) - 0.5;
        vec3 sampled_color = textureLod(src, blur_radius * offset + f_v_coord, 3.0).xyz;

        vec3 deviation = sampled_color - color.rgb;
        deviation = max(vec3(0.0), sqrt(deviation * deviation));

        bvec3 blend_factor = lessThan(deviation, vec3(0.02945917622));

        color.rgb = mix(color.rgb, sampled_color, vec3(blend_factor));
        fragColor = color;

        // fragColor = texture(src, f_v_coord);
    #endif
}
