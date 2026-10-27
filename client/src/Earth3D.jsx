
import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";

const EARTH_TEXTURE =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

const CLOUD_TEXTURE =
  "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";

function EarthSphere() {
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);

  const [earthMap, cloudsMap] = useTexture([
    EARTH_TEXTURE,
    CLOUD_TEXTURE,
  ]);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.12;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group>
      {/* Blue atmospheric glow */}
      <mesh scale={1.09}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#58bfff"
          side={THREE.BackSide}
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Earth surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={earthMap}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Transparent cloud layer */}
      <mesh ref={cloudsRef} scale={1.008}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.23}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Earth3D() {
  return (
    <div className="earth3d-background" aria-label="Rotating 3D Earth">
    <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[4, 2, 5]}
          intensity={2.5}
        />

        <Stars
          radius={8}
          depth={3}
          count={180}
          factor={2}
          fade
          speed={0.3}
        />

        <Suspense fallback={null}>
          <EarthSphere />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.55}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
        />
      </Canvas>
    </div>
  );
}
