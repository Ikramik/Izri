import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

//Temporary 3D object
//function PlaceholderBrain() {
  //const meshRef = useRef<THREE.Mesh>(null!);

//Component to load and display the 3D brain model
function BrainModel() {
  const {scene} = useGLTF('/human-brain.glb'); // Load the 3D model
  const brainRef = useRef<THREE.Group>(null!);

  //Slowly rotate the brain model for better visualization
  useFrame(() => {
    if (brainRef.current) {
      brainRef.current.rotation.y += 0.005; // Rotate around the Y-axis
    }
  });
  // A .glb file contains a whole scene. We use <primitive> to inject it into our canvas.
  return <primitive ref={brainRef} object={scene} scale={[1, 1, 1]} position={[0, 0, 0]} />;
}


function App() {
  return (
    // The Canvas needs a fixed height to show up on the screen
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#ffffff', position: 'relative' }}>
    {/* Attribution UI Overlay */}
      <div style={{ position: 'absolute', bottom: 10, right: 10, color: 'black', zIndex: 10, fontFamily: 'sans-serif', fontSize: '12px', opacity: 0.7 }}>
        3D Model: "human-brain" by Yash_Dandavate (CC-BY)
      </div>

      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.5} />
        {/* We add multiple directional lights to illuminate all sides of the complex brain folds */}
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <directionalLight position={[-10, -10, -10]} intensity={1} />
        
        {/* React requires Suspense when loading large external files asynchronously */}
        <Suspense fallback={null}>
          <BrainModel />
        </Suspense>

        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}
export default App;