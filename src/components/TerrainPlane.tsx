import { useEffect, useRef } from "react";
import * as THREE from "three";

const TerrainPlane = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Store current container reference for clean up later
    const currContainerRef = containerRef.current;

    //---------------------------------------------------- Scene & Camera ----//
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x242a33);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    containerRef.current.appendChild(renderer.domElement);

    //------------------------------------------------------------- Plane ----//
    // Create plane geometry
    const planeGeometry = new THREE.PlaneGeometry(50, 50, 100, 100);

    // Test modifying plane vertices with sine functions
    const vertices = planeGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = i + 2; // height

      // Create waves using sine functions
      vertices[z] =
        Math.sin(x * 0.2) * Math.cos(y * 0.5) * 2 + Math.sin(x * 0.1) * 1.5;
    }

    // Recalculate normals for proper lighting
    planeGeometry.computeVertexNormals();

    // Create material with vertex colors based on height
    const material = new THREE.MeshStandardMaterial({
      color: 0xacff24,
      wireframe: false,
      flatShading: false,
      side: THREE.FrontSide,
    });

    // Combine geometry and material into mesh
    const plane = new THREE.Mesh(planeGeometry, material);

    // Rotate 90 degrees, plane is vertical by default
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    //---------------------------------------------------------- Lighting ----//
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light to simulate sun
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;

    // Shadow camera's frustum
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;

    // Uncomment to see shadow camera rendering volume
    // const shadowCameraHelper = new THREE.CameraHelper(sun.shadow.camera);
    // scene.add(shadowCameraHelper);

    // Uncomment to add cube that casts shadows
    // const cube = new THREE.Mesh(
    //   new THREE.BoxGeometry(2, 2, 2),
    //   new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    // );
    // cube.position.y = 3;
    // cube.castShadow = true;
    // scene.add(cube);

    scene.add(sun);

    // Add point light for dynamic lighting
    const pointLight = new THREE.PointLight(0xffa500, 1, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    //--------------------------------------------------------- Animation ----//
    let time = 0;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Update geometry
      planeGeometry.attributes.position.needsUpdate = true;
      planeGeometry.computeVertexNormals();

      // Rotate camera around scene
      camera.position.x = Math.sin(time * 0.2) * 15;
      camera.position.z = Math.cos(time * 0.2) * 15;
      camera.lookAt(0, 0, 0);

      // Move point light in a circle
      pointLight.position.x = Math.sin(time) * 10;
      pointLight.position.z = Math.cos(time) * 10;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      currContainerRef.removeChild(renderer.domElement);
      planeGeometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "white",
          fontFamily: "monospace",
          background: "rgba(255,255,255,0.2)",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Test Terrain Plane</h3>
        <p style={{ margin: "5px 0" }}>Camera: Orbiting</p>
      </div>
    </div>
  );
};

export default TerrainPlane;
