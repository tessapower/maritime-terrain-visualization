/*
 * Vertex shader for the water plane.
 *
 * Key concepts:
 * - Passes UV coordinates to fragment shader for animated water effects
 * - Transforms vertex position for rendering
 */

// UV coordinates for domain warping and animation in fragment shader
varying vec2 v_uv;

void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}