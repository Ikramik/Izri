import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, type ChangeEvent } from 'react';
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
  const [activationScore, setActivationScore] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  //NEW FILE UPLOAD LOGIC
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(`Uploading ${file.name}...`);

    // We pack the file into a special FormData object to send over HTTP
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the video to FastAPI
      const uploadRes = await fetch('http://127.0.0.1:8000/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      setUploadMessage(`${uploadJson.message} (${uploadJson.size_mb} MB)`);

      //Automatically trigger the dummy AI simulation after upload!
      const simRes = await fetch('http://127.0.0.1:8000/api/predict-dummy');
      const simJson = await simRes.json();
      
      const dataArray: number[] = simJson.data;
      const sum = dataArray.reduce((acc, curr) => acc + curr, 0);
      setActivationScore(sum / dataArray.length);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadMessage("Error uploading video.");
    } finally {
      setIsUploading(false);
    }
  };
  return (

    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#111827', position: 'relative' }}>
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Mindora Analysis Hub</h1>   

        {/* Sleek Custom Upload Button */}
        <label style={{ display: 'inline-block',padding: '10px 20px', 
          cursor: isUploading ? 'wait' : 'pointer', 
          backgroundColor: isUploading ? '#6b7280' : '#060159', 
          color: 'white', borderRadius: '5px', fontWeight: 'bold'    }}>
          {isUploading ? 'Processing Media...' : 'Upload Commercial (.mp4)'}
          <input 
            type="file" 
            accept="video/mp4,video/x-m4v,video/*" 
            onChange={handleFileUpload} 
            disabled={isUploading}
            style={{ display: 'none' }} // This hides the ugly default browser input!
          />

        </label>



        {/* Status Messages */}

        {uploadMessage && <p style={{ marginTop: '10px', fontSize: '14px', color: '#9ca3af' }}>{uploadMessage}</p>}

        

        <p style={{ marginTop: '15px', fontSize: '18px' }}>

          Global Activation Level: <strong style={{ color: activationScore > 0.6 ? '#ef4444' : '#3b82f6' }}>{(activationScore * 100).toFixed(1)}%</strong>

        </p>

      </div>



      <div style={{ position: 'absolute', bottom: 10, right: 10, color: 'gray', zIndex: 10, fontFamily: 'sans-serif', fontSize: '12px' }}>

        3D Model: "human-brain" by Yash_Dandavate (CC-BY)

      </div>



      <Canvas camera={{ position: [0, 0, 5] }}>

        <ambientLight intensity={1.5} />

        <directionalLight position={[10, 10, 10]} intensity={2} />

        <directionalLight position={[-10, -10, -10]} intensity={1} />

        

        <Suspense fallback={null}>

          <BrainModel heatLevel={activationScore} />

        </Suspense>

        <OrbitControls enableZoom={true} />

      </Canvas>

    </div>

  );
}

export default App;
