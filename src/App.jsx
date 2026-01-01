import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Cloud, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, Square, SkipBack, SkipForward, Layers, Settings, Share2, Download, Plus, Wand2, Film, Type, Music, Palette, ChevronRight, ChevronDown, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scriptura Studio - Production Grade Bible Animation Engine
 * Uses React Three Fiber for real-time 3D scene generation.
 */

// --- 3D SCENE COMPONENTS ---

const GenesisScene = ({ isPlaying }) => {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (isPlaying && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[2, 16]} />
          <meshStandardMaterial 
            color="#223355" 
            wireframe 
            emissive="#112244" 
            emissiveIntensity={2} 
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </Float>
      <Sparkles count={200} scale={10} size={4} speed={0.4} opacity={0.5} color="#44aaff" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#4488ff" />
      <ambientLight intensity={0.5} />
    </group>
  );
};

const ExodusScene = ({ isPlaying }) => {
  const wavesRef = useRef();

  useFrame((state, delta) => {
    if (isPlaying && wavesRef.current) {
       wavesRef.current.position.z = Math.sin(state.clock.elapsedTime) * 0.5;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} color="#ffaa00" />
      <fog attach="fog" args={['#202025', 5, 20]} />
      
      {/* Left Wall of Water */}
      <mesh position={[-4, 0, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[2, 10, 20]} />
        <meshStandardMaterial color="#004488" transparent opacity={0.8} roughness={0.1} />
      </mesh>
      
      {/* Right Wall of Water */}
      <mesh position={[4, 0, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[2, 10, 20]} />
        <meshStandardMaterial color="#004488" transparent opacity={0.8} roughness={0.1} />
      </mesh>

      {/* Dry Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[10, 50]} />
        <meshStandardMaterial color="#dcb159" roughness={0.8} />
      </mesh>

      <Sparkles count={50} scale={12} size={6} speed={0.4} opacity={0.2} color="#ffffff" position={[0, 2, 0]} />
    </group>
  );
};

const GospelsScene = ({ isPlaying }) => {
    const crossRef = useRef();
    
    useFrame((state, delta) => {
        if(isPlaying && crossRef.current) {
            // subtle breathing effect
        }
    });

    return (
        <group>
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 5, 10]} intensity={1} color="#ffddaa" />
            <Cloud opacity={0.5} speed={0.4} width={10} depth={1.5} segments={20} position={[0, 5, -5]} />
            
            <mesh ref={crossRef} position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 6, 0.5]} />
                <meshStandardMaterial color="#5c4033" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[4, 0.5, 0.5]} />
                <meshStandardMaterial color="#5c4033" roughness={0.9} />
            </mesh>
            
            <mesh position={[0, -3, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[5, 32]} />
                <meshStandardMaterial color="#334422" roughness={1} />
            </mesh>
        </group>
    )
}

// --- UI COMPONENTS ---

const ToolbarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200 ${active ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-zinc-800 hover:text-white'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
  </button>
);

const TimelineTrack = ({ label, color, width }) => (
  <div className="flex items-center gap-2 mb-2 group cursor-pointer">
    <div className="w-24 text-xs font-medium text-gray-500 text-right pr-2 group-hover:text-white">{label}</div>
    <div className="flex-grow bg-zinc-800 h-8 rounded relative overflow-hidden">
      <div className={`absolute top-1 bottom-1 left-0 rounded ${color} opacity-80`} style={{ width: width }}></div>
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('editor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeScene, setActiveScene] = useState('genesis');
  const [timelineTime, setTimelineTime] = useState(0);
  const [showRenderModal, setShowRenderModal] = useState(false);

  // Timeline simulation
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineTime(prev => (prev + 1) % 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const scenes = [
    { id: 'genesis', label: 'Genesis: Creation', color: 'bg-blue-600' },
    { id: 'exodus', label: 'Exodus: Red Sea', color: 'bg-orange-500' },
    { id: 'gospels', label: 'Gospels: The Cross', color: 'bg-red-600' },
  ];

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-lg shadow-lg shadow-red-900/50">S</div>
          <h1 className="font-bold text-lg tracking-tight">Scriptura <span className="text-zinc-500 font-normal">Studio</span></h1>
          <div className="h-6 w-px bg-zinc-700 mx-2"></div>
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-zinc-800 px-3 py-1 rounded hover:bg-zinc-700 cursor-pointer transition">
            <span>Project:</span>
            <span className="font-medium text-white">The Beginning (Gen 1)</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 mr-2">Auto-saved 2m ago</span>
          <button className="bg-white text-black px-4 py-1.5 rounded-sm font-bold text-sm hover:bg-gray-200 transition flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button 
            onClick={() => setShowRenderModal(true)}
            className="bg-red-600 text-white px-4 py-1.5 rounded-sm font-bold text-sm hover:bg-red-500 transition flex items-center gap-2 shadow-lg shadow-red-900/20"
          >
            <Download className="w-4 h-4" /> Export Video
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT SIDEBAR: TOOLS */}
        <div className="w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-2 z-40">
          <ToolbarItem icon={Wand2} label="Script" active={false} />
          <ToolbarItem icon={Film} label="Scenes" active={true} />
          <ToolbarItem icon={Type} label="Text" active={false} />
          <ToolbarItem icon={Music} label="Audio" active={false} />
          <ToolbarItem icon={Palette} label="Style" active={false} />
        </div>

        {/* MIDDLE: VIEWPORT */}
        <div className="flex-grow flex flex-col relative bg-zinc-950">
           {/* Scene Selector Overlay */}
           <div className="absolute top-4 left-4 z-10 flex gap-2">
              {scenes.map(scene => (
                  <button 
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={`px-3 py-1 text-xs font-bold rounded backdrop-blur-md border border-white/10 transition ${activeScene === scene.id ? 'bg-red-600 text-white' : 'bg-black/50 text-gray-300 hover:bg-black/80'}`}
                  >
                      {scene.label}
                  </button>
              ))}
           </div>

           {/* 3D CANVAS */}
           <div className="flex-grow relative">
             <Canvas shadows camera={{ position: [0, 2, 10], fov: 45 }}>
               <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
               {activeScene === 'genesis' && <GenesisScene isPlaying={isPlaying} />}
               {activeScene === 'exodus' && <ExodusScene isPlaying={isPlaying} />}
               {activeScene === 'gospels' && <GospelsScene isPlaying={isPlaying} />}
             </Canvas>

             {/* Playback Overlay Controls (On Canvas) */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-6 py-2 flex items-center gap-6 shadow-2xl">
                 <button className="text-gray-400 hover:text-white"><SkipBack className="w-5 h-5" /></button>
                 <button 
                    onClick={togglePlay}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition active:scale-95"
                 >
                     {isPlaying ? <Pause className="w-5 h-5 text-black fill-black" /> : <Play className="w-5 h-5 text-black fill-black ml-1" />}
                 </button>
                 <button className="text-gray-400 hover:text-white"><SkipForward className="w-5 h-5" /></button>
             </div>
           </div>

           {/* BOTTOM: TIMELINE */}
           <div className="h-64 bg-zinc-900 border-t border-zinc-800 flex flex-col z-30">
              <div className="h-8 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="hover:text-white cursor-pointer">00:00</span>
                      <span className="hover:text-white cursor-pointer">00:15</span>
                      <span className="hover:text-white cursor-pointer">00:30</span>
                      <span className="hover:text-white cursor-pointer">00:45</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
                  </div>
              </div>
              <div className="flex-grow p-4 overflow-y-auto">
                  <TimelineTrack label="Scene" color="bg-indigo-600" width="100%" />
                  <TimelineTrack label="Camera" color="bg-purple-600" width="45%" />
                  <TimelineTrack label="Text Overlay" color="bg-blue-500" width="30%" />
                  <TimelineTrack label="Voiceover" color="bg-emerald-600" width="80%" />
                  <TimelineTrack label="Music" color="bg-rose-600" width="100%" />
              </div>
           </div>
        </div>

        {/* RIGHT SIDEBAR: PROPERTIES */}
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-y-auto z-40">
           <div className="p-4 border-b border-zinc-800">
               <h2 className="font-bold text-sm text-gray-200">Scene Properties</h2>
           </div>
           
           {/* Generative AI Controls Mockup */}
           <div className="p-4 space-y-6">
               <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Generative Prompt</label>
                   <textarea 
                      className="w-full bg-black/30 border border-zinc-700 rounded p-3 text-sm text-gray-200 focus:outline-none focus:border-red-600 transition h-24 resize-none"
                      placeholder="Describe the scene atmosphere..."
                      defaultValue="A void of deep blue darkness, sparkling with the first light of creation. Ethereal, cinematic, 8k resolution."
                   ></textarea>
                   <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded border border-zinc-700 flex items-center justify-center gap-2">
                       <Wand2 className="w-3 h-3 text-purple-400" /> Generate Variations
                   </button>
               </div>

               <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Style Preset</label>
                   <div className="grid grid-cols-2 gap-2">
                       <div className="bg-zinc-800 p-2 rounded border border-red-600 cursor-pointer">
                           <div className="h-12 bg-gradient-to-br from-blue-900 to-black rounded mb-1"></div>
                           <div className="text-[10px] text-center font-medium">Cinematic</div>
                       </div>
                       <div className="bg-zinc-800 p-2 rounded border border-zinc-700 hover:border-zinc-500 cursor-pointer opacity-50">
                           <div className="h-12 bg-amber-100 rounded mb-1"></div>
                           <div className="text-[10px] text-center font-medium">Watercolor</div>
                       </div>
                   </div>
               </div>

               <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Lighting</label>
                   <input type="range" className="w-full accent-red-600" />
                   <div className="flex justify-between text-[10px] text-gray-500">
                       <span>Dark</span>
                       <span>Bright</span>
                   </div>
               </div>
           </div>
        </div>

      </div>

      {/* RENDER MODAL */}
      <AnimatePresence>
        {showRenderModal && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md w-full shadow-2xl"
                >
                    <h2 className="text-2xl font-bold mb-2">Rendering Video</h2>
                    <p className="text-gray-400 text-sm mb-6">Compiling shaders, baking lighting, and generating MP4 stream...</p>
                    
                    <div className="w-full bg-black rounded-full h-2 mb-2 overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-red-600 to-purple-600"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "easeInOut" }}
                        ></motion.div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-8">
                        <span>Encoding frames...</span>
                        <span>1080p @ 60fps</span>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={() => setShowRenderModal(false)}
                            className="text-gray-400 hover:text-white text-sm font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}