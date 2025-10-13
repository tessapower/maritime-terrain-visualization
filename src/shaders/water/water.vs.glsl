// water.vs.glsl: Vertex shader for the water plane.

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}