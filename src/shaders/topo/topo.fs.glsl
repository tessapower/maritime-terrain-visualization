/// topo.frag.glsl: Fragment shader for topographic contour lines

uniform vec3 u_baseColor;
uniform vec3 u_lineColor;
uniform float u_lineSpacing;
uniform float u_lineWidth;
uniform float u_lineIntensity;
uniform vec3 u_sunDirection;

varying vec3 v_position;
varying vec3 v_normal;

void main() {
    // Get the height (z-coordinate)
    float height = v_position.z;

    // Calculate which contour line we're near
    float contour = mod(height, u_lineSpacing);

    // Create sharp lines using smoothstep
    float lineEdge = u_lineWidth * 0.2;
    float line = smoothstep(lineEdge, lineEdge * 0.5, contour) +
    smoothstep(u_lineSpacing - lineEdge, u_lineSpacing - lineEdge * 0.5, contour);

    // Mix base color with line color
    vec3 color = mix(u_baseColor, u_lineColor, line * u_lineIntensity);

    // Simple lighting based on normal and sun direction
    float diffuse = max(dot(v_normal, u_sunDirection), 0.0) * 0.5 + 0.5;

    gl_FragColor = vec4(color * diffuse, 1.0);
}
