import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState } from 'react';
import * as THREE from 'three';

//Temporary 3D object
//function PlaceholderBrain() {
  //const meshRef = useRef<THREE.Mesh>(null!);

//Component to load and display the 3D brain model
function BrainModel({ heatLevel }: { heatLevel: number }){
  const {scene} = useGLTF('/human-brain.glb'); // Load the 3D model
  const brainRef = useRef<THREE.Group>(null!);
  // Loop through every tiny piece of the 3D model to change its color
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;
      
      // We create a color based on the heatLevel (0 = cool blue, 1 = hot red)
      // The hue value 0.6 is blue, and 0.0 is red.
      const hue = 0.6 - (heatLevel * 0.6); 
      material.color.setHSL(hue, 1, 0.5);
    }
  });

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
  //React State to hold our calculated brain activity level
  const [activationScore, setActivationScore] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // The function that talks to the Python FastAPI server!
  const fetchBrainData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/predict-dummy');
      const json = await response.json();
      
      // json.data is our array of 100 random numbers. Let's calculate the average
      const dataArray: number[] = json.data;
      const sum = dataArray.reduce((acc, curr) => acc + curr, 0);
      const average = sum / dataArray.length; // Will be a number between 0 and 1
      
      setActivationScore(average);
    } catch (error) {
      console.error("Failed to fetch from backend:", error);
    } finally {
      setIsFetching(false);
    }
  };
  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#111827', position: 'relative' }}>
      
      {/* UI Overlay for our Button and Data */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Mindora Analysis Hub</h1>
        <button 
          onClick={fetchBrainData}
          disabled={isFetching}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {isFetching ? 'Running AI Model...' : 'Run Simulation'}
        </button>
        <p style={{ marginTop: '15px', fontSize: '18px' }}>
          Global Activation Level: <strong style={{ color: activationScore > 0.6 ? '#ef4444' : '#3b82f6' }}>{(activationScore * 100).toFixed(1)}%</strong>
        </p>
      </div>

      {/* Attribution */}
      <div style={{ position: 'absolute', bottom: 10, right: 10, color: 'gray', zIndex: 10, fontFamily: 'sans-serif', fontSize: '12px' }}>
        3D Model: "human-brain" by Yash_Dandavate (CC-BY)
      </div>

      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <directionalLight position={[-10, -10, -10]} intensity={1} />
        
        <Suspense fallback={null}>
          {/* We pass the state down to the 3D model! */}
          <BrainModel heatLevel={activationScore} />
        </Suspense>

        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}
export default App;