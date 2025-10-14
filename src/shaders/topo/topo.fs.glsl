// topo.fs.glsl: Fragment shader for topographic contour lines

uniform vec3 u_baseColor;
uniform vec3 u_lineColor;
uniform float u_lineSpacing;
uniform float u_lineWidth;
uniform float u_lineIntensity;
uniform vec3 u_sunDirection;

varying vec3 v_position;
varying vec3 v_normal;

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

    // Calculate which contour line we're near, creates a
    // repeating pattern based on line spacing
    float contour = mod(height, u_lineSpacing);

    // Create sharp lines using smoothstep
    float lineEdge = u_lineWidth * 0.2;

    // Call smoothstep twice to create a band for the line:
    // - First call creates line when contour is near 0
    // - Secon call creates line when contour is near u_lineSpacing (wraps to 0)
    float line = smoothstep(lineEdge, lineEdge * 0.5, contour) +
    smoothstep(u_lineSpacing - lineEdge, u_lineSpacing - lineEdge * 0.5, contour);

    // Mix base color with line color
    vec3 color = mix(u_baseColor, u_lineColor, line * u_lineIntensity);

    // Simple lighting based on normal and sun direction
    float diffuse = max(dot(v_normal, u_sunDirection), 0.0) * 0.5 + 0.5;

    gl_FragColor = vec4(color * diffuse, 1.0);
}
