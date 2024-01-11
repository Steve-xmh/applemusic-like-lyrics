#version 300 es
precision highp float;

uniform sampler2D src;
uniform sampler2D lastsrc;
uniform vec2 texSize;
in vec2 f_v_coord;
out vec4 fragColor;

vec4 smartDeNoise(sampler2D tex, vec2 uv, float radius, float threshold)
{
    float radQ = radius * radius;

    vec4 centrPx = texture(tex,uv);
    
    float zBuff = 0.0;
    vec4 aBuff = vec4(0.0);
    vec2 size = vec2(textureSize(tex, 0));
    
    for(float x=-radius; x <= radius; x++) {
        float pt = sqrt(radQ-x*x);
        for(float y=-pt; y <= pt; y++) {
            vec2 d = vec2(x,y);

            vec4 walkPx =  texture(tex,uv+d/size);

            vec4 dC = walkPx-centrPx;
            float deltaFactor = exp( -dot(dC, dC) * threshold);
                                 
            zBuff += deltaFactor;
            aBuff += deltaFactor*walkPx;
        }
    }
    return aBuff/zBuff;
}

void main() {
    //fragColor = vec4(smartDeNoise(src, f_v_coord, 2., 500.).rgb, 1.f);
    fragColor = texture(src, f_v_coord);
}

/*
void main() {
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
    vec3 old = texture(lastsrc, f_v_coord).rgb;    
    old = max(minColor, old);
    old = min(maxColor, old);
    
    // interpolate from the clamped old color to the new color.
    // Reject all history when the mouse moves.
    float lerpAmount = 0.1f;
    vec3 pixelColor = mix(old, center, lerpAmount);        
    fragColor = vec4(pixelColor, 1.0f);
}
*/



/*
#define INV_SQRT_OF_2PI 0.39894228040143267793994605993439  // 1.0/SQRT_OF_2PI
#define INV_PI 0.31830988618379067153776752674503

//  smartDeNoise - parameters
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//  sampler2D tex     - sampler image / texture
//  vec2 uv           - actual fragment coord
//  float sigma  >  0 - sigma Standard Deviation
//  float kSigma >= 0 - sigma coefficient 
//      kSigma * sigma  -->  radius of the circular kernel
//  float threshold   - edge sharpening threshold 

vec4 smartDeNoise(sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold)
{
    float radius = round(kSigma*sigma);
    float radQ = radius * radius;

    float invSigmaQx2 = .5 / (sigma * sigma);      // 1.0 / (sigma^2 * 2.0)
    float invSigmaQx2PI = INV_PI * invSigmaQx2;    // 1/(2 * PI * sigma^2)

    float invThresholdSqx2 = .5 / (threshold * threshold);     // 1.0 / (sigma^2 * 2.0)
    float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;   // 1.0 / (sqrt(2*PI) * sigma^2)

    vec4 centrPx = texture(tex,uv); 

    float zBuff = 0.0;
    vec4 aBuff = vec4(0.0);
    vec2 size = vec2(textureSize(tex, 0));

    vec2 d;
    for (d.x=-radius; d.x <= radius; d.x++) {
        float pt = sqrt(radQ-d.x*d.x);       // pt = yRadius: have circular trend
        for (d.y=-pt; d.y <= pt; d.y++) {
            float blurFactor = exp( -dot(d , d) * invSigmaQx2 ) * invSigmaQx2PI;

            vec4 walkPx =  texture(tex,uv+d/size);
            vec4 dC = walkPx-centrPx;
            float deltaFactor = exp( -dot(dC, dC) * invThresholdSqx2) * invThresholdSqrt2PI * blurFactor;

            zBuff += deltaFactor;
            aBuff += deltaFactor*walkPx;
        }
    }
    return aBuff/zBuff;
}

void main() {
	fragColor = smartDeNoise(src, f_v_coord, 5., 2., .005);
	//fragColor = texture(src, f_v_coord);
}
*/