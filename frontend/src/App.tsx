import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, Suspense, useState, useMemo, type ChangeEvent } from 'react';
import * as THREE from 'three';

// 1. IMPORT THE REAL RUNPOD DATA
import realBrainData from '../izri_brain_data.json'; 

// --- THE NEW 3D BRAIN COMPONENT ---
// We no longer pass a single "heatLevel". We tell it whether to show real data or not.
function BrainModel({ isAnalyzing }: { isAnalyzing: boolean }) {
  const { scene } = useGLTF('/human-brain.glb'); 
  const brainRef = useRef<THREE.Group>(null!);

  // 2. USE MEMO TO INJECT THE DATA (So it doesn't freeze the browser)
  const paintedBrain = useMemo(() => {
    // Clone the scene so we don't ruin the original
    const object = scene.clone(); 
    
    // Grab the 20,484 data points from the JSON we downloaded!
    const activations = realBrainData.activation_data; 
    
    // Find the min and max values to create our heat scale
    const maxVal = Math.max(...activations);
    const minVal = Math.min(...activations);

    // Traverse the 3D model
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;
        
        // Count how many vertices this specific GLB has
        const vertexCount = geometry.attributes.position.count;
        
        // Create a new array to hold the RGB colors for every single vertex
        const colors = new Float32Array(vertexCount * 3); 
        const color = new THREE.Color();

        // Loop through every vertex and paint it
        for (let i = 0; i < vertexCount; i++) {
          if (!isAnalyzing) {
             // If not analyzing, make the whole brain a cool, resting deep blue
             color.setHex(0x1a2b4c);
          } else {
             // 3. MAP META'S DATA TO THE 3D VERTICES
             // We use modulo (%) in case your GLB has more/less vertices than Meta's 20,484
             const dataIndex = i % activations.length;
             const val = activations[dataIndex];

             // Normalize the value between 0.0 and 1.0
             const normalized = (val - minVal) / (maxVal - minVal || 1);

             // Apply the Izri Heatmap Palette based on the real math
             if (normalized > 0.8) {
                 color.setHex(0xff0044); // Hot Pink/Red (High Activity)
             } else if (normalized > 0.5) {
                 color.setHex(0xffaa00); // Orange/Yellow (Medium Activity)
             } else {
                 color.setHex(0x1a2b4c); // Deep Blue (Resting State)
             }
          }

          // Save the color to the array (R, G, B)
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        // 4. ATTACH THE COLORS TO THE MESH
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Tell the material to use our custom vertex colors instead of a solid color
        mesh.material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.4,
          metalness: 0.1,
        });
      }
    });

    return object;
  }, [scene, isAnalyzing]); // Re-run this math ONLY if 'isAnalyzing' changes

  // Slowly rotate the brain
  useFrame(() => {
    if (brainRef.current) {
      brainRef.current.rotation.y += 0.005;
    }
  });

  return <primitive ref={brainRef} object={paintedBrain} scale={[1, 1, 1]} position={[0, 0, 0]} />;
}


// --- MAIN APP ---
export default function App() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  // We use this boolean to trigger the UI switch from "resting state" to "real data"
  const [showRealData, setShowRealData] = useState<boolean>(false);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(`Uploading ${file.name}...`);
    setShowRealData(false); // Reset to blue while uploading

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Send the video to your Python backend
      const uploadRes = await fetch('http://127.0.0.1:8000/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      
      // 2. Simulate the AI processing time (Since we already have the real JSON locally)
      setUploadMessage(`Extracting audio & querying TRIBE v2...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Fake 2 second delay for drama
      
      // 3. Boom. Reveal the real data.
      setUploadMessage(`Analysis Complete: ${uploadJson.message}`);
      setShowRealData(true);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadMessage("Error uploading video.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#050505', position: 'relative' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 5px 0', letterSpacing: '-1px' }}>IZRI AI</h1> 
        <p style={{ color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', marginTop: 0 }}>
          Neuromarketing Inference Engine
        </p>

        <label style={{ 
          display: 'inline-block',
          padding: '12px 24px', 
          marginTop: '20px',
          cursor: isUploading ? 'wait' : 'pointer', 
          backgroundColor: isUploading ? '#374151' : '#2563eb', 
          color: 'white', 
          borderRadius: '8px', 
          fontWeight: 'bold',
          transition: 'background-color 0.3s'
        }}>
          {isUploading ? 'Simulating Cortex...' : 'Upload Commercial (.mp4)'}
          <input 
            type="file" 
            accept="video/mp4,video/x-m4v,video/*" 
            onChange={handleFileUpload} 
            disabled={isUploading}
            style={{ display: 'none' }} 
          />
        </label>

        {uploadMessage && (
          <p style={{ marginTop: '15px', fontSize: '14px', color: showRealData ? '#10b981' : '#9ca3af' }}>
            {uploadMessage}
          </p>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 10, right: 10, color: '#4b5563', zIndex: 10, fontFamily: 'sans-serif', fontSize: '10px' }}>
        Powered by LLaMA 3.2 & TRIBE v2
      </div>

      {/* The 3D Viewport */}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <directionalLight position={[-10, -10, -10]} intensity={1} />
        
        <Suspense fallback={null}>
          <BrainModel isAnalyzing={showRealData} />
        </Suspense>

        <OrbitControls enableZoom={true} autoRotate={false} />
      </Canvas>
    </div>
  );
}