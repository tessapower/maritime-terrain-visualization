/// topo.vert.glsl: Vertex shader for topographic contour lines

varying vec3 v_position;
varying vec3 v_normal;

void main() {
    v_position = position;

    // Transform normal to world space for consistent lighting
    v_normal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}