#ifdef GL_ES
precision mediump float;
#endif

/// A flowing, water-like shader based on Domain Warping and
/// Fractional Brownian Motion.
///
/// Source(s): - https://iquilezles.org/articles/fbm/
///            - https://iquilezles.org/articles/warp/
///            - https://thebookofshaders.com/11/ (Noise)
///            - https://thebookofshaders.com/13/ (fBm)

// Canvas width and height in pixels
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_worldScale;

varying vec2 v_uv;

//===================================================== SIMPLEX NOISE 2D ====//
// Helper functions and implementation of the Simplex noise function.
//
// Author(s): Ian McEwan, Ashima Arts
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
}

// Simplex Noise 2D:
// Returns value in range [-1, 1]
// More organic than value noise, no directional artifacts
float snoise(vec2 v) {
    // Precompute values for a simplex (2D equilateral triangle)
    const vec4 C = vec4(0.211324865405187, // (3.0-sqrt(3.0))/6.0
    0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
    -0.577350269189626, // -1.0 + 2.0 * C.x
    0.024390243902439);// 1.0 / 41.0

    // First corner
    // Skew input space to simplices
    vec2 i  = floor(v + dot(v, C.yy));
    // Unskew back to x,y space
    vec2 x0 = v -   i + dot(i, C.xx);

    // Other corners - determine which simplex we're in
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

    // Offsets for other two corners
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    // Permutations
    // Avoid truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));

    // Gradients from 41 points on a line
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m*m;
    m = m*m;

    // Compute gradient contribution from each corner
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalize gradients implicitly
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

    // Compute final noise value at P
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// ==================================== FRACTIONAL BROWNIAN MOTION (FBM) ====//
// Layers multiple octaves of noise for natural-looking complexity
// Each octave has 2x frequency and 0.5x amplitude of previous
const int numOctaves = 5;
float fbm(in vec2 p) {
    // Gain (a.k.a. Lacunarity): how much each octave
    // contributes (persistence)
    float G = 0.5;
    // Frequency: how "zoomed in" the noise is
    float f = 1.0;
    // Amplitude: height of the noise
    float a = 1.0;
    // Total accumulated value
    float t = 0.0;

    // Add multiple layers of noise at different scales
    for (int i = 0; i < numOctaves; i++) {
        // Add this octave's contribution
        t += a * snoise(f * p);
        // Double frequency (smaller features)
        f *= 2.0;
        // Reduce amplitude (less influence)
        a *= G;
    }

    return t;
}

// Constants
// Larger scale = smaller waves
const float waveScale = 3.0;
const float warpOffset = 0.03;
// Adds subtle variation so everything doesn't flow together
const float timeScalarSlow = 0.01;
const float timeScalarFast = 0.05;

void main() {
    // Normalize pixel coordinates to [0, 1] range
    vec2 p = v_uv;
    p *= waveScale;

    //=================================================== DOMAIN WARPING ====//
    // Layer 1:
    // Use FBM to create initial distortion pattern
    // This "q" vector will warp the input space for subsequent noise calls
    vec2 q = vec2(0.0);
    // Slow flowing motion
    // Static-ish X distortion
    q.x = fbm(p + warpOffset);
    // Static-ish Y distortion (offset for variation)
    q.y = fbm(p + vec2(1.0) + warpOffset);

    // Layer 2:
    // Use the first warp (q) to warp the input AGAIN, creates more complex,
    // organic flowing patterns. Both components animate slowly with time
    vec2 r = vec2(0.0);
    // Warp using q, animate slowly
    r.x = fbm(p + 1.0 * q + timeScalarSlow * u_time);
    // Slightly different speed for variation
    r.y = fbm(p + 1.0 * q + timeScalarFast * u_time);

    // Layer 3:
    // Triple-warped noise for final detail, creates the most complex, flowing
    // organic patterns
    float f = fbm(p + r + timeScalarFast * u_time);

    // Normalize noise to [0, 1] range (softens the color transitions)
    f = f * 0.5 + 0.5;

    //===================================================== COLOR MIXING ====//
    // Start with black
    vec3 color = vec3(0.0);

    // Light gray-blue (darkest)
    vec3 deepWater = vec3(0.70, 0.75, 0.80);
    // Very light gray-blue
    vec3 midWater = vec3(0.80, 0.84, 0.88);
    // Almost white with hint of blue
    vec3 lightWater = vec3(0.88, 0.91, 0.94);

    // Only affects high values (creates highlights)
    color = mix(deepWater, midWater, f);

    // Add variation based on first warp layer (q) and normalize
    float qInfluence = length(q) * 0.5 + 0.5;
    // Blend based on magnitude of first warp
    color = mix(color, lightWater, qInfluence * 0.3);

    // Add subtle highlights based on second warp layer (r) and normalize
    float rInfluence = length(r) * 0.5 + 0.5;
    color = mix(color, lightWater, rInfluence * 0.2);

    gl_FragColor = vec4(color, 1.0);
}
