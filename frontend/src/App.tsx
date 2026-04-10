import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useRef, Suspense, useState, useMemo, type ChangeEvent } from 'react';
import * as THREE from 'three';
import { Activity, Brain, UploadCloud } from 'lucide-react';

import realBrainData from '../izri_brain_data.json';

const BRAIN_REGIONS = {
  vmPFC: { start: 1000, end: 1500, name: "vmPFC" },
  amygdala: { start: 5000, end: 5500, name: "Amygdala/Insula" },
  hippocampus: { start: 12000, end: 12500, name: "Hippocampus" }
};

function getRegionAverage(data: number[], start: number, end: number) {
  const slice = data.slice(start, end);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function getInsightText(average: number) {
  if (average > 0.75) return { level: "PEAK ACTIVATION", color: "#e11d48", desc: "High emotional resonance and brand reward calculated." };
  else if (average > 0.55) return { level: "ELEVATED", color: "#ea580c", desc: "Steady cognitive encoding and attention maintained." };
  else return { level: "BASELINE", color: "#94a3b8", desc: "Standard neural resting state. No significant spikes." };
}

// --- 3D CLINICAL BRAIN ---
function BrainModel({ isAnalyzing, insights }: { isAnalyzing: boolean, insights: any }) {
  const { scene } = useGLTF('/human-brain.glb');
  const brainRef = useRef<THREE.Group>(null!);

  const paintedBrain = useMemo(() => {
    const object = scene.clone();
    const activations = realBrainData.activation_data;
    const maxVal = Math.max(...activations);
    const minVal = Math.min(...activations);

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry;
        const vertexCount = geometry.attributes.position.count;
        const colors = new Float32Array(vertexCount * 3);
        const color = new THREE.Color();

        for (let i = 0; i < vertexCount; i++) {
          if (!isAnalyzing) {
            color.setHex(0x334155);
          } else {
            const val = activations[i % activations.length];
            const normalized = (val - minVal) / (maxVal - minVal || 1);

            if (normalized > 0.8) color.setHex(0xf43f5e); 
            else if (normalized > 0.55) color.setHex(0xf59e0b); 
            else color.setHex(0x334155); 
          }
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        mesh.material = new THREE.MeshPhysicalMaterial({
          vertexColors: true,
          roughness: 0.2,
          metalness: 0.3,
          clearcoat: 1.0, 
          clearcoatRoughness: 0.1,
          envMapIntensity: 1.5,
        });
      }
    });
    return object;
  }, [scene, isAnalyzing]);

  useFrame((state) => {
    if (brainRef.current) {
      brainRef.current.rotation.y += 0.002;
      brainRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  const glassBoxStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 1)',
    borderRadius: '12px',
    padding: '16px',
    width: '240px',
    color: '#0f172a',
    fontFamily: '"Inter", system-ui, sans-serif',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
    transition: 'opacity 0.5s',
    opacity: isAnalyzing ? 1 : 0,
    pointerEvents: 'none'
  };

  return (
    <group>
      <primitive ref={brainRef} object={paintedBrain} scale={[1.2, 1.2, 1.2]} position={[0, 0, 0]} />
      
      <Html position={[-2, 1.5, 0]} center>
        <div style={{ ...glassBoxStyle, borderLeft: `4px solid ${insights.vmPFC.color}` }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Ventromedial PFC</h3>
          <p style={{ margin: '0 0 6px 0', color: insights.vmPFC.color, fontWeight: '700', fontSize: '14px' }}>{insights.vmPFC.level}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{insights.vmPFC.desc}</p>
        </div>
      </Html>

      <Html position={[2.5, 0, 0]} center>
        <div style={{ ...glassBoxStyle, borderLeft: `4px solid ${insights.amygdala.color}` }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Amygdala & Insula</h3>
          <p style={{ margin: '0 0 6px 0', color: insights.amygdala.color, fontWeight: '700', fontSize: '14px' }}>{insights.amygdala.level}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{insights.amygdala.desc}</p>
        </div>
      </Html>

      <Html position={[-2, -1.5, 0]} center>
        <div style={{ ...glassBoxStyle, borderLeft: `4px solid ${insights.hippocampus.color}` }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Hippocampus</h3>
          <p style={{ margin: '0 0 6px 0', color: insights.hippocampus.color, fontWeight: '700', fontSize: '14px' }}>{insights.hippocampus.level}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{insights.hippocampus.desc}</p>
        </div>
      </Html>
    </group>
  );
}

// --- MAIN DASHBOARD APP ---
export default function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [showRealData, setShowRealData] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("System idle. Ready for media ingestion.");
  
  // CORRECTED: The state is properly defined inside the component with globalScore included!
  const [insights, setInsights] = useState({
    globalScore: 0, 
    vmPFC: { level: "---", color: "#cbd5e1", desc: "---" },
    amygdala: { level: "---", color: "#cbd5e1", desc: "---" },
    hippocampus: { level: "---", color: "#cbd5e1", desc: "---" }
  });

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowRealData(false);
    setUploadMessage(`Analyzing ${file.name}...`);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      const rawData = realBrainData.activation_data;
      const maxVal = Math.max(...rawData);
      const minVal = Math.min(...rawData);
      const normalize = (val: number) => (val - minVal) / (maxVal - minVal || 1);

      // Calculate the global Izri Score (0-100)
      const globalAverage = rawData.reduce((a, b) => a + b, 0) / rawData.length;
      const izriScore = Math.round(normalize(globalAverage) * 100);

      setInsights({
        globalScore: izriScore,
        vmPFC: getInsightText(normalize(getRegionAverage(rawData, BRAIN_REGIONS.vmPFC.start, BRAIN_REGIONS.vmPFC.end))),
        amygdala: getInsightText(normalize(getRegionAverage(rawData, BRAIN_REGIONS.amygdala.start, BRAIN_REGIONS.amygdala.end))),
        hippocampus: getInsightText(normalize(getRegionAverage(rawData, BRAIN_REGIONS.hippocampus.start, BRAIN_REGIONS.hippocampus.end)))
      });

      setUploadMessage("Cortical map successfully generated.");
      setShowRealData(true);
    } catch (error) {
      setUploadMessage("Connection Error.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', 
      backgroundColor: '#f8fafc',
      backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      color: '#0f172a', fontFamily: '"Inter", system-ui, sans-serif',
      overflow: 'hidden', position: 'relative'
    }}>
      
      {/* TOP NAVIGATION BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        zIndex: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        {/* Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={28} color="#2563eb" />
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: '#0f172a' }}>
              IZRI AI
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Enterprise Inference Engine
            </p>
          </div>
        </div>

        {/* Upload Button Section */}
        <label style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
          background: isUploading ? '#e2e8f0' : '#2563eb', 
          color: isUploading ? '#64748b' : '#ffffff',
          borderRadius: '8px', cursor: isUploading ? 'wait' : 'pointer',
          fontWeight: '600', fontSize: '14px',
          boxShadow: isUploading ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.25)',
          transition: 'all 0.2s ease-in-out'
        }}>
          <UploadCloud size={18} />
          {isUploading ? 'Processing...' : 'Upload Commercial'}
          <input type="file" accept="video/mp4" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
        </label>
      </div>

      {/* THE NEW IZRI SCORE GAUGE - FLOATING LEFT */}
      <div style={{ 
        position: 'absolute',
        top: '100px',
        left: '40px',
        padding: '24px', 
        background: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 1)', 
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)', 
        textAlign: 'center',
        zIndex: 10,
        width: '180px',
        opacity: showRealData ? 1 : 0.3, 
        transition: 'opacity 0.5s'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Global Izri Score</h3>
        <div style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', letterSpacing: '-2px' }}>
          {insights.globalScore}<span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600' }}>/100</span>
        </div>
        <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
          {showRealData ? 'Optimal Engagement' : 'Awaiting Data'}
        </p>
      </div>

      {/* 3D VIEWPORT */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
          <ambientLight intensity={1.5} color="#ffffff" />
          <directionalLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={1} color="#f8fafc" />
          
          <Suspense fallback={null}>
            <BrainModel isAnalyzing={showRealData} insights={insights} />
            <Environment preset="studio" />
            <Grid infiniteGrid fadeDistance={25} sectionColor="#cbd5e1" cellColor="#f1f5f9" position={[0, -2.5, 0]} sectionThickness={1.0} />
            <EffectComposer>
              <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.4} />
            </EffectComposer>
          </Suspense>
          <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.1} />
        </Canvas>
      </div>

      {/* FLOATING STATUS PILL (Underneath the Brain) */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '30px',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        zIndex: 20
      }}>
        <Activity size={16} color={isUploading ? '#f59e0b' : '#2563eb'} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>
          {uploadMessage}
        </span>
      </div>

    </div>
  );
}