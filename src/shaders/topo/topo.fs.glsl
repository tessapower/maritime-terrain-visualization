/*
 * Fragment shader for topographic contour lines.
 *
 * Key concepts:
 * - Contour lines are created by wrapping the fragment's height (z) using mod
 * - Line intensity and width are controlled by uniforms
 * - Color blending between base terrain and contour lines
 * - Lighting is calculated using the sun direction and surface normal
 *
 * See diagram and comments below for how contour wrapping works.
 */

uniform vec3 u_baseColor;
uniform vec3 u_lineColor;
uniform float u_lineSpacing;
uniform float u_lineWidth;
uniform float u_lineIntensity;
uniform vec3 u_sunDirection;
uniform vec3 u_cameraPosition;
uniform float u_fadeStartDistance;
uniform float u_fadeEndDistance;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_worldPosition;

/**
 * This shader creates topo contour lines based on the height of the current fragment.
 *
 * Height axis (z)
 * │
 * 15 ├─┐           ┌─┐           ┌─
 *    │ │           │ │           │
 * 10 ├─┤           ├─┤           ├─
 *    │ │           │ │           │
 * 5  ├─┤           ├─┤           ├─
 *    │ │           │ │           │
 * 0  └─┴───────────┴─┴───────────┴─
 *     0  1  2  3  4  5  6  7  8  9  10
 *      contour value (mod result)
 *
 * If u_lineSpacing = 5:
 * z = 0  → result = 0
 * z = 2  → result = 2
 * z = 5  → result = 0  (wrapped)
 * z = 7  → result = 2
 * z = 10 → result = 0  (wrapped)
 *
 *---------------------------------------------------------
 * Example: u_lineSpacing = 5, u_lineWidth = 0.1
 *---------------------------------------------------------
 * FIRST CALL
 *
 * mod result:  0.0 0.05 0.1  ...   1.0    2.0    3.0    4.0    5.0
 *               │   │    │          │      │      │      │      │
 *               ▼   ▼    ▼          ▼      ▼      ▼      ▼      ▼
 * Line value:    1.0          0.0
 *              ▔▔▔▔▔▔▔╲___________________________________
 *                    └┬┘
 *                     │
 *              smooth transition
 *               (0.05 → 0.1)
 *
 * When result < 0.05: returns 1.0 => line
 * When result > 0.1:  returns 0.0 => no line
 * In between:         smooth fade
 *
 * SECOND CALL
 *
 * mod result:  0.0   1.0    2.0    3.0    4.0  4.9 4.95 5.0
 *               │     │      │      │      │    │   │   │
 *               ▼     ▼      ▼      ▼      ▼    ▼   ▼   ▼
 *  Line value: 0.0                                1.0
 *              __________________________________╱▔▔▲▔▔▔▔
 *                                               └┬┘ (already wraps)
 *                                                │
 *                                         smooth transition
 *                                           (4.9 → 4.95)
 *
 * When result < 4.9:  returns 0.0 => no line
 * When result > 4.95: returns 1.0 => line
 *
 * SUMMED RESULT
 *
 * mod result:  0.0   0.1  ...   4.9   5.0
 *               │     │          │     │
 *               ▼     ▼          ▼     ▼
 * Line value:    1.0      0.0      1.0
 *             ▔▔▔▔▔▔▔╲___ ... ___╱▔▔▔▔▔▔▔
 *             └─┬─┘                  └─┬─┘
 *          line at start         line at end
 */
void main() {
    // Get the height
    float height = v_position.z;

    // Calculate distance from camera for LOD
    float distanceFromCamera = length(u_cameraPosition - v_worldPosition);

    // Fade out contour lines based on distance
    // Lines are fully visible before fadeStartDistance,
    // then gradually fade out until fadeEndDistance
    float distanceFade = 1.0 - smoothstep(u_fadeStartDistance, u_fadeEndDistance, distanceFromCamera);

    // Early exit if completely faded - skip line calculations
    if (distanceFade <= 0.01) {
        // Just render base color with lighting
        float diffuse = max(dot(v_normal, u_sunDirection), 0.0) * 0.5 + 0.5;
        gl_FragColor = vec4(u_baseColor * diffuse, 1.0);
        return;
    }

    // Calculate which contour line we're near, creates a
    // repeating pattern based on line spacing
    float contour = mod(height, u_lineSpacing);

    // Create sharp lines using smoothstep
    float lineEdge = u_lineWidth * 0.2;

    // Call smoothstep twice to create a band for the line:
    // - First call creates line when contour is near 0
    // - Second call creates line when contour is near u_lineSpacing (wraps to 0)
    float line = smoothstep(lineEdge, lineEdge * 0.5, contour) +
    smoothstep(u_lineSpacing - lineEdge, u_lineSpacing - lineEdge * 0.5, contour);

    // Apply distance-based fade to line intensity
    float finalLineIntensity = u_lineIntensity * distanceFade;

    // Mix base color with line color
    vec3 color = mix(u_baseColor, u_lineColor, line * finalLineIntensity);

    // Simple lighting based on normal and sun direction
    float diffuse = max(dot(v_normal, u_sunDirection), 0.0) * 0.5 + 0.5;

    gl_FragColor = vec4(color * diffuse, 1.0);
}
