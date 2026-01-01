import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Cloud, Text3D, Center, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, ChevronLeft, ChevronRight, X, Search, BookOpen, Volume2, Maximize, SkipBack, SkipForward, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scriptura Player - The "Hands-Off" Procedural Bible Experience
 * * CONCEPT: 
 * A streaming service where "videos" are generated in real-time using Three.js.
 * Users simply browse books/chapters and "watch" the generated animated visualization.
 * * THEMES:
 * - Creation (Blue/Space)
 * - Law/History (Gold/Sand/Stone)
 * - Poetry (Green/Nature/Water)
 * - Prophets (Red/Fire/Particle)
 * - Gospels (White/Light/Ethereal)
 * - Epistles (Paper/Ink/Structure)
 * - Revelation (Purple/Cosmic/Jewel)
 */

// --- DATA ---

const BIBLE_STRUCTURE = [
  { category: 'The Pentateuch', color: 'bg-amber-600', theme: 'law', books: [
      { n: 'Genesis', c: 50 }, { n: 'Exodus', c: 40 }, { n: 'Leviticus', c: 27 }, { n: 'Numbers', c: 36 }, { n: 'Deuteronomy', c: 34 }
  ]},
  { category: 'History', color: 'bg-stone-600', theme: 'history', books: [
      { n: 'Joshua', c: 24 }, { n: 'Judges', c: 21 }, { n: 'Ruth', c: 4 }, { n: '1 Samuel', c: 31 }, { n: '2 Samuel', c: 24 },
      { n: '1 Kings', c: 22 }, { n: '2 Kings', c: 25 }, { n: 'Ezra', c: 10 }, { n: 'Nehemiah', c: 13 }, { n: 'Esther', c: 10 }
  ]},
  { category: 'Poetry', color: 'bg-teal-700', theme: 'poetry', books: [
      { n: 'Job', c: 42 }, { n: 'Psalms', c: 150 }, { n: 'Proverbs', c: 31 }, { n: 'Ecclesiastes', c: 12 }, { n: 'Song of Solomon', c: 8 }
  ]},
  { category: 'Major Prophets', color: 'bg-red-800', theme: 'prophecy', books: [
      { n: 'Isaiah', c: 66 }, { n: 'Jeremiah', c: 52 }, { n: 'Lamentations', c: 5 }, { n: 'Ezekiel', c: 48 }, { n: 'Daniel', c: 12 }
  ]},
  { category: 'The Gospels', color: 'bg-blue-600', theme: 'gospel', books: [
      { n: 'Matthew', c: 28 }, { n: 'Mark', c: 16 }, { n: 'Luke', c: 24 }, { n: 'John', c: 21 }
  ]},
  { category: 'Early Church', color: 'bg-orange-600', theme: 'gospel', books: [
      { n: 'Acts', c: 28 }
  ]},
  { category: 'Epistles', color: 'bg-emerald-800', theme: 'epistle', books: [
      { n: 'Romans', c: 16 }, { n: '1 Corinthians', c: 16 }, { n: 'Galatians', c: 6 }, { n: 'Ephesians', c: 6 }
  ]},
  { category: 'Apocalypse', color: 'bg-purple-900', theme: 'revelation', books: [
      { n: 'Revelation', c: 22 }
  ]}
];

// --- 3D VISUALIZERS ---

// 1. COSMIC / CREATION THEME (Genesis)
const CreationVisualizer = ({ isPlaying }) => {
  const meshRef = useRef();
  useFrame((state, delta) => {
    if (isPlaying && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.z += delta * 0.02;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[2.5, 4]} />
          <MeshDistortMaterial 
            color="#224488" 
            emissive="#112244"
            distort={0.4} 
            speed={2} 
            wireframe 
            roughness={0}
          />
        </mesh>
      </Float>
      <Sparkles count={300} scale={12} size={3} speed={0.4} opacity={0.5} color="#88ccff" />
      <pointLight position={[10, 10, 10]} intensity={2} color="#4488ff" />
    </group>
  );
};

// 2. LAW / DESERT THEME (Exodus, Numbers)
const LawVisualizer = ({ isPlaying }) => {
  const groupRef = useRef();
  useFrame((state) => {
    if (isPlaying && groupRef.current) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <fog attach="fog" args={['#2a1b0a', 5, 30]} />
      <ambientLight intensity={0.4} />
      <spotLight position={[5, 10, 5]} intensity={2} color="#ffaa00" castShadow />
      
      {/* Golden Tablets Abstract */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group>
            <mesh position={[-0.8, 0, 0]}>
                <boxGeometry args={[1.2, 2, 0.2]} />
                <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0.8, 0, 0]}>
                <boxGeometry args={[1.2, 2, 0.2]} />
                <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
            </mesh>
        </group>
      </Float>
      
      {/* Floating Sand/Dust */}
      <Sparkles count={500} scale={15} size={2} speed={0.2} opacity={0.6} color="#ffd700" />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#3d2b1f" />
      </mesh>
    </group>
  );
};

// 3. POETRY / NATURE THEME (Psalms, Song of Solomon)
const PoetryVisualizer = ({ isPlaying }) => {
    return (
        <group>
            <ambientLight intensity={0.5} />
            <pointLight position={[-5, 5, -5]} color="#00ff88" intensity={2} />
            <fog attach="fog" args={['#051510', 0, 20]} />
            
            <Cloud opacity={0.3} speed={0.2} width={10} depth={1.5} segments={20} position={[0, 0, -5]} color="#aaddcc" />
            
            <Float speed={1} rotationIntensity={1} floatIntensity={2}>
                <mesh>
                    <torusKnotGeometry args={[1.5, 0.4, 100, 16]} />
                    <MeshDistortMaterial color="#00aa88" distort={0.6} speed={1} roughness={0.1} metalness={0.5} />
                </mesh>
            </Float>
            
            <Sparkles count={200} size={5} speed={0.5} opacity={0.4} color="#ccffdd" scale={10} />
        </group>
    )
}

// 4. PROPHETIC / FIRE THEME (Isaiah, Ezekiel)
const ProphecyVisualizer = ({ isPlaying }) => {
    return (
        <group>
            <ambientLight intensity={0.1} />
            <pointLight position={[0, 0, 0]} color="#ff4400" intensity={3} distance={10} />
            
            <Float speed={5} rotationIntensity={2} floatIntensity={0}>
                <mesh>
                    <dodecahedronGeometry args={[1.5, 0]} />
                    <meshStandardMaterial color="#550000" emissive="#ff2200" emissiveIntensity={2} wireframe />
                </mesh>
            </Float>
            
            {/* Chaotic Particles */}
            <Sparkles count={1000} size={2} speed={2} opacity={0.8} color="#ffaa00" scale={12} noise={1} />
        </group>
    )
}

// 5. GOSPEL / LIGHT THEME (Matthew, John)
const GospelVisualizer = ({ isPlaying }) => {
    return (
        <group>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 10, 5]} intensity={1.5} color="#fff" />
            
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5}>
                {/* The Cross Abstract */}
                <group>
                     <mesh position={[0, 0.5, 0]}>
                         <boxGeometry args={[0.5, 4, 0.5]} />
                         <meshStandardMaterial color="#f0f0f0" emissive="#ffffff" emissiveIntensity={0.2} />
                     </mesh>
                     <mesh position={[0, 1.5, 0]}>
                         <boxGeometry args={[2.5, 0.5, 0.5]} />
                         <meshStandardMaterial color="#f0f0f0" emissive="#ffffff" emissiveIntensity={0.2} />
                     </mesh>
                </group>
            </Float>
            
            <Cloud opacity={0.6} speed={0.1} width={20} depth={5} segments={10} position={[0, -2, -5]} color="#ffffff" />
            <Sparkles count={100} size={5} speed={0.2} opacity={0.5} color="#ffffff" scale={15} />
        </group>
    )
}

// 6. REVELATION / COSMIC THEME
const RevelationVisualizer = ({ isPlaying }) => {
    return (
        <group>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={3} />
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 0]} color="#aa00ff" intensity={5} />
            
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh>
                    <octahedronGeometry args={[2, 0]} />
                    <MeshDistortMaterial color="#440088" emissive="#8800ff" distort={1} speed={3} wireframe />
                </mesh>
            </Float>
             <Sparkles count={500} size={4} speed={1} opacity={0.8} color="#ff00ff" scale={15} />
        </group>
    )
}

// --- MAIN COMPONENTS ---

const SceneManager = ({ theme, isPlaying }) => {
    switch (theme) {
        case 'law': return <LawVisualizer isPlaying={isPlaying} />;
        case 'history': return <LawVisualizer isPlaying={isPlaying} />; // Reuse Law for now
        case 'poetry': return <PoetryVisualizer isPlaying={isPlaying} />;
        case 'prophecy': return <ProphecyVisualizer isPlaying={isPlaying} />;
        case 'gospel': return <GospelVisualizer isPlaying={isPlaying} />;
        case 'epistle': return <GospelVisualizer isPlaying={isPlaying} />; // Reuse Gospel
        case 'revelation': return <RevelationVisualizer isPlaying={isPlaying} />;
        default: return <CreationVisualizer isPlaying={isPlaying} />; // Default to creation
    }
}

const PlayerOverlay = ({ book, chapter, theme, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    // Simulated progress
    useEffect(() => {
        let interval;
        if(isPlaying) {
            interval = setInterval(() => {
                setProgress(p => (p >= 100 ? 0 : p + 0.1));
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* 3D Viewport - The "Video" */}
            <div className="flex-grow relative bg-black">
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
                     <OrbitControls autoRotate={false} enableZoom={false} />
                     <SceneManager theme={theme} isPlaying={isPlaying} />
                </Canvas>

                {/* Overlay Text */}
                <div className="absolute top-10 left-10 z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">{book.n}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">CHAPTER {chapter}</span>
                        <span className="text-white/70 text-lg font-light tracking-widest uppercase">{theme}</span>
                    </div>
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-20 text-white/50 hover:text-white transition">
                    <X className="w-10 h-10" />
                </button>
            </div>

            {/* Controls Bar */}
            <div className="h-24 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 w-full px-8 pb-8 flex flex-col justify-end">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/20 rounded mb-4 cursor-pointer overflow-hidden">
                    <div className="h-full bg-red-600 relative" style={{ width: `${progress}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:scale-110 transition">
                            {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                        </button>
                        <button className="text-white/70 hover:text-white"><SkipBack className="w-6 h-6" /></button>
                        <button className="text-white/70 hover:text-white"><SkipForward className="w-6 h-6" /></button>
                        <Volume2 className="w-6 h-6 text-white/70" />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-white/50 font-mono">PROCESSED IN REAL-TIME</span>
                        <Maximize className="w-5 h-5 text-white/70 hover:text-white cursor-pointer" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const BookCard = ({ book, theme, onClick }) => (
    <div onClick={onClick} className="group relative aspect-[3/4] bg-zinc-900 rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-white transition-all">
        {/* Dynamic Abstract Cover based on theme */}
        <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${theme === 'law' ? 'from-amber-900 to-black' : theme === 'gospel' ? 'from-blue-900 to-black' : theme === 'prophecy' ? 'from-red-900 to-black' : 'from-gray-800 to-black'}`}></div>
        
        {/* Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <h3 className="text-xl font-black text-white tracking-tight group-hover:scale-110 transition-transform duration-300">{book.n}</h3>
            <span className="text-xs text-gray-400 mt-1">{book.c} Chapters</span>
        </div>
        
        {/* Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-red-600 rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-white text-white ml-1" />
            </div>
        </div>
    </div>
);

export default function App() {
  const [selectedContent, setSelectedContent] = useState(null); // { book, chapter, theme }
  const [searchTerm, setSearchTerm] = useState('');

  const handleBookClick = (book, theme) => {
      // For simplicity, automatically starts Chapter 1. 
      // In a full app, this would open a chapter select screen.
      setSelectedContent({ book, chapter: 1, theme });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-gradient-to-b from-black/90 to-transparent px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-lg shadow-red-900/50 shadow-lg">S</div>
            <span className="font-bold text-xl tracking-tighter">Scriptura</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-300">
            <span className="text-white">Browse</span>
            <span className="hover:text-white cursor-pointer">Series</span>
            <span className="hover:text-white cursor-pointer">Themes</span>
        </div>
        <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-gray-400" />
            <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700"></div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[60vh] w-full flex items-center justify-start px-6 md:px-16 overflow-hidden">
          <div className="absolute inset-0 z-0">
             {/* Background Canvas (Live) */}
             <Canvas camera={{position: [0,0,5]}}>
                 <Stars />
                 <ambientLight intensity={0.5} />
                 <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh rotation={[0.5, 0.5, 0]}>
                        <torusGeometry args={[3, 0.02, 16, 100]} />
                        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
                    </mesh>
                 </Float>
             </Canvas>
             <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 max-w-2xl mt-10">
              <div className="flex items-center gap-2 text-red-500 font-bold text-xs tracking-widest mb-4">
                  <span className="bg-white/10 px-2 py-1 rounded backdrop-blur">FEATURED</span>
                  <span>THE BOOK OF REVELATION</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-none">The Alpha <br/>& The Omega.</h1>
              <p className="text-lg text-gray-300 mb-8 max-w-lg">Experience the apocalyptic vision of John in a stunning, procedurally generated visual journey.</p>
              <div className="flex gap-4">
                  <button 
                    onClick={() => handleBookClick({ n: 'Revelation', c: 22 }, 'revelation')}
                    className="bg-white text-black px-8 py-3 rounded font-bold flex items-center gap-2 hover:bg-gray-200 transition"
                  >
                      <Play className="w-5 h-5 fill-black" /> Watch Now
                  </button>
                  <button className="bg-white/10 backdrop-blur text-white px-6 py-3 rounded font-bold flex items-center gap-2 hover:bg-white/20 transition">
                      <Info className="w-5 h-5" /> More Info
                  </button>
              </div>
          </div>
      </div>

      {/* Content Rows */}
      <div className="pb-20 px-6 md:px-16 space-y-12 relative z-20 -mt-10">
          {BIBLE_STRUCTURE.map((section, idx) => (
              <div key={idx}>
                  <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                      {section.category}
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {section.books.map((book) => (
                          <BookCard 
                            key={book.n} 
                            book={book} 
                            theme={section.theme}
                            onClick={() => handleBookClick(book, section.theme)}
                          />
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {/* Full Screen Player Modal */}
      <AnimatePresence>
          {selectedContent && (
              <PlayerOverlay 
                book={selectedContent.book}
                chapter={selectedContent.chapter}
                theme={selectedContent.theme}
                onClose={() => setSelectedContent(null)}
              />
          )}
      </AnimatePresence>

    </div>
  );
}