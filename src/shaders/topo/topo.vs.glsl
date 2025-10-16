/*
 * Vertex shader for topographic contour lines.
 *
 * Key concepts:
 * - Transforms vertex position and normal to world space
 * - Passes position and normal to fragment shader for contour and lighting
 * - Ensures lighting/shading is correct regardless of mesh orientation
 */

// World-space position for contour calculation
varying vec3 v_position;
// World-space normal for lighting
varying vec3 v_normal;
// World-space position for distance calculation
varying vec3 v_worldPosition;

void main() {
    // Transform vertex position to world space
    v_position = position;

    // Calculate world position for distance-based LOD
    v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    // Transform normal to world space for consistent lighting
    // This ensures lighting/shading is correct regardless of mesh orientation
    v_normal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
