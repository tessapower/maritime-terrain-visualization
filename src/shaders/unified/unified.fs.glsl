/*
 * Unified fragment shader combining terrain (topo) and water shaders.
 * Conditionally renders water or terrain based on height (v_height).
 * - Below seaLevel: water shader with fBm and domain warping
 * - Above seaLevel: terrain shader with topographic contour lines
 */

#ifdef GL_ES
precision mediump float;
#endif

// Common uniforms
uniform vec3 u_cameraPosition;
uniform vec3 u_sunDirection;
uniform float u_time;

// Terrain uniforms
uniform vec3 u_baseColor;
uniform vec3 u_lineColor;
uniform float u_lineSpacing;
uniform float u_lineWidth;
uniform float u_lineIntensity;
uniform float u_fadeStartDistance;
uniform float u_fadeEndDistance;
uniform float u_landCutOff;

// Water uniforms
uniform float u_waterLevel;
uniform vec3 u_deepWater;
uniform vec3 u_midWater;
uniform vec3 u_lightWater;
uniform float u_waveScale;
uniform float u_warpOffset;
uniform float u_timeScalarSlow;
uniform float u_timeScalarFast;
uniform int u_numOctaves;
uniform float u_octaveGain;

// Transition uniforms
uniform float u_transitionWidth;

// Varyings
varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_worldPosition;
varying vec2 v_uv;
varying float v_height;

//===================================================== SIMPLEX NOISE 2D ====//
// Helper functions and implementation of the Simplex noise function.
//
// Author(s): Ian McEwan, Ashima Arts

/**
 * Modulo 289 for vec3
 * @param x A vec3 input
 * @return A vec3 output with each component modulo 289
 */
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

/**
 * Modulo 289 for vec2
 * @param x A vec2 input
 * @return A vec2 output with each component modulo 289
 */
vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

/**
 * Permutation polynomial: (34x^2 + x) mod 289
 * @param x A vec3 input
 * @return A vec3 permuted output
 */
vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
}

/**
 * 2D Simplex Noise
 * Generates smooth, continuous noise values for a 2D input vector.
 * @param v A 2D vector input
 * @return A float noise value in the range [-1, 1]
 */
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

/**
 * Fractional Brownian Motion (fBm)
 * Combines multiple octaves of simplex noise to create complex patterns.
 *
 * @param p A 2D vector input
 * @return A float fBm value
 */
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

//============================================== WATER SHADER FUNCTION ====//
vec3 renderWater(vec2 uv, float time, vec3 normal, vec3 worldPos) {
    vec2 p = uv * u_waveScale;

    //=================================================== DOMAIN WARPING ====//
    // Layer 1:
    // Use FBM to create initial distortion pattern
    // This "q" vector will warp the input space for subsequent noise calls
    vec2 q = vec2(0.0);
    // Slow flowing motion
    // Static-ish X distortion
    q.x = fbm(p + u_warpOffset);
    // Static-ish Y distortion (offset for variation)
    q.y = fbm(p + vec2(1.0) + u_warpOffset);

    // Layer 2:
    // Use the first warp (q) to warp the input AGAIN, creates more complex,
    // organic flowing patterns. Both components animate slowly with time
    vec2 r = vec2(0.0);
    // Warp using q, animate slowly
    r.x = fbm(p + 1.0 * q + u_timeScalarSlow * time);
    // Slightly different speed for variation
    r.y = fbm(p + 1.0 * q + u_timeScalarFast * time);

    // Layer 3:
    // Triple-warped noise for final detail, creates the most complex, flowing
    // organic patterns
    float f = fbm(p + r + u_timeScalarFast * time);

    // Normalize noise to [0, 1] range (softens the color transitions)
    f = f * 0.5 + 0.5;

    //===================================================== COLOR MIXING ====//
    // Only affects high values (creates highlights)
    vec3 color = mix(u_deepWater, u_midWater, f);

    // Add variation based on first warp layer (q) and normalize
    float qInfluence = length(q) * 0.5 + 0.5;
    // Blend based on magnitude of first warp
    color = mix(color, u_lightWater, qInfluence * 0.3);

    // Add subtle highlights based on second warp layer (r) and normalize
    float rInfluence = length(r) * 0.5 + 0.5;
    color = mix(color, u_lightWater, rInfluence * 0.2);

    // Apply lighting to water (for shadows)
    vec3 waterNormal = vec3(0.0, 1.0, 0.0);
    float diffuse = max(dot(waterNormal, u_sunDirection), 0.0) * 0.5 + 0.5;

    return color * diffuse;
}

//============================================= TERRAIN SHADER FUNCTION ====//
vec3 renderTerrain(float height, vec3 normal, vec3 worldPos) {
    float distanceFromCamera = length(u_cameraPosition - worldPos);
    float distanceFade = 1.0 - smoothstep(u_fadeStartDistance, u_fadeEndDistance, distanceFromCamera);

    // Simple lighting
    float diffuse = max(dot(normal, u_sunDirection), 0.0) * 0.5 + 0.5;

    float heightFade = smoothstep(0.5, 2.0, height);

    // Early exit if completely faded, don't render below a certain height
    if (distanceFade <= 0.05 || heightFade <= 0.05) {
        return u_baseColor * diffuse;
    }

    // Calculate contour lines
    float contour = mod(height, u_lineSpacing);
    float lineEdge = u_lineWidth * 0.2;
    float line = smoothstep(lineEdge, lineEdge * 0.5, contour) +
    smoothstep(u_lineSpacing - lineEdge, u_lineSpacing - lineEdge * 0.5, contour);

    float finalLineIntensity = u_lineIntensity * distanceFade * heightFade;
    vec3 color = mix(u_baseColor, u_lineColor, line * finalLineIntensity);

    return color * diffuse;
}

//================================================================= MAIN ====//
void main() {
    vec3 finalColor;

    if (v_height <= u_landCutOff) { // Water (at or very close to sea level)
        // Pass flat normal for water
        vec3 flatNormal = vec3(0.0, 1.0, 0.0);// World space up
        finalColor = renderWater(v_uv, u_time, flatNormal, v_worldPosition);
    } else { // Terrain
        finalColor = renderTerrain(v_height, v_normal, v_worldPosition);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
