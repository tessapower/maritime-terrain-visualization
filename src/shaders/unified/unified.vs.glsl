/*
 * Unified vertex shader for terrain and water.
 * Passes height information to fragment shader for conditional rendering.
 */

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_worldPosition;
varying vec2 v_uv;
varying float v_height;

void main() {
    v_position = position;
    v_normal = normalize(mat3(modelMatrix) * normal);
    v_uv = uv;
    v_height = position.z;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    v_worldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

