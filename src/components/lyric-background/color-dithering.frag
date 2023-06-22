precision highp float;
varying vec2 vTextureCoord;
uniform vec2 inputPixel;
uniform sampler2D uSampler;

const float NOISE_GRANULARITY = 0.5 / 255.0;

float random(vec2 coords) {
    return fract(sin(dot(coords.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 coordinates = vTextureCoord;
    vec4 fragmentColor = texture2D(uSampler, coordinates);
    fragmentColor += mix(-NOISE_GRANULARITY, NOISE_GRANULARITY, random(coordinates));
    gl_FragColor = fragmentColor;
}