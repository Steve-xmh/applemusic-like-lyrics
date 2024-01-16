#version 300 es
precision highp float;

uniform sampler2D src;
uniform sampler2D historyFrame0;
uniform vec2 texSize;
in vec2 f_v_coord;
out vec4 fragColor;

void main() {
    fragColor = texture(src, f_v_coord);
    return;
    // get the neighborhood min / max from this frame's render
    vec3 center = texture(src, f_v_coord).rgb;
    vec3 minColor = center;
    vec3 maxColor = center;
    for (int iy = -1; iy <= 1; ++iy)
    {
        for (int ix = -1; ix <= 1; ++ix)
        {
            if (ix == 0 && iy == 0)
                continue;
            
           
            vec2 offsetUV = ((f_v_coord * texSize + vec2(ix, iy))) / texSize;
            vec3 color = texture(src, offsetUV).rgb;
            minColor = min(minColor, color);
            maxColor = max(maxColor, color);
        }
    }
    
    // get last frame's pixel and clamp it to the neighborhood of this frame
    vec3 old = texture(historyFrame0, f_v_coord).rgb;    
    old = max(minColor, old);
    old = min(maxColor, old);
    
    // interpolate from the clamped old color to the new color.
    // Reject all history when the mouse moves.
    float lerpAmount = 0.1f;
    vec3 pixelColor = mix(old, center, lerpAmount);        
    fragColor = vec4(pixelColor, 1.0f);
}