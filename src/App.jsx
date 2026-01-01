import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Cloud, Text3D, Center, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, ChevronLeft, ChevronRight, X, Search, BookOpen, Volume2, Maximize, SkipBack, SkipForward, Info, Calendar, CheckCircle, ArrowLeft, Filter, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scriptura Player v3.1 - Production Fixes
 * - Fixed: Geometry rendering case-sensitivity
 * - Added: Audio Player for AI Voiceovers
 * - Added: Ambient Background Sound Fallback
 */

// --- DATA ---
const BIBLE_STRUCTURE = [
  { category: 'The Pentateuch', color: 'bg-amber-600', theme: 'law', books: [
      { n: 'Genesis', c: 50 }, { n: 'Exodus', c: 40 }, { n: 'Leviticus', c: 27 }, { n: 'Numbers', c: 36 }, { n: 'Deuteronomy', c: 34 }
  ]},
  { category: 'History', color: 'bg-stone-600', theme: 'history', books: [
      { n: 'Joshua', c: 24 }, { n: 'Judges', c: 21 }, { n: 'Ruth', c: 4 }, { n: '1 Samuel', c: 31 }, { n: '2 Samuel', c: 24 },
      { n: '1 Kings', c: 22 }, { n: '2 Kings', c: 25 }, { n: '1 Chronicles', c: 29 }, { n: '2 Chronicles', c: 36 }, { n: 'Ezra', c: 10 }, { n: 'Nehemiah', c: 13 }, { n: 'Esther', c: 10 }
  ]},
  { category: 'Poetry', color: 'bg-teal-700', theme: 'poetry', books: [
      { n: 'Job', c: 42 }, { n: 'Psalms', c: 150 }, { n: 'Proverbs', c: 31 }, { n: 'Ecclesiastes', c: 12 }, { n: 'Song of Solomon', c: 8 }
  ]},
  { category: 'Major Prophets', color: 'bg-red-800', theme: 'prophecy', books: [
      { n: 'Isaiah', c: 66 }, { n: 'Jeremiah', c: 52 }, { n: 'Lamentations', c: 5 }, { n: 'Ezekiel', c: 48 }, { n: 'Daniel', c: 12 }
  ]},
  { category: 'Minor Prophets', color: 'bg-red-900', theme: 'prophecy', books: [
      { n: 'Hosea', c: 14 }, { n: 'Joel', c: 3 }, { n: 'Amos', c: 9 }, { n: 'Obadiah', c: 1 }, { n: 'Jonah', c: 4 }, { n: 'Micah', c: 7 }, { n: 'Nahum', c: 3 }, { n: 'Habakkuk', c: 3 }, { n: 'Zephaniah', c: 3 }, { n: 'Haggai', c: 2 }, { n: 'Zechariah', c: 14 }, { n: 'Malachi', c: 4 }
  ]},
  { category: 'The Gospels', color: 'bg-blue-600', theme: 'gospel', books: [
      { n: 'Matthew', c: 28 }, { n: 'Mark', c: 16 }, { n: 'Luke', c: 24 }, { n: 'John', c: 21 }
  ]},
  { category: 'Early Church', color: 'bg-orange-600', theme: 'gospel', books: [
      { n: 'Acts', c: 28 }
  ]},
  { category: 'Epistles', color: 'bg-emerald-800', theme: 'epistle', books: [
      { n: 'Romans', c: 16 }, { n: '1 Corinthians', c: 16 }, { n: '2 Corinthians', c: 13 }, { n: 'Galatians', c: 6 }, { n: 'Ephesians', c: 6 }, { n: 'Philippians', c: 4 }, { n: 'Colossians', c: 4 }, { n: '1 Thessalonians', c: 5 }, { n: '2 Thessalonians', c: 3 }, { n: '1 Timothy', c: 6 }, { n: '2 Timothy', c: 4 }, { n: 'Titus', c: 3 }, { n: 'Philemon', c: 1 }, { n: 'Hebrews', c: 13 }, { n: 'James', c: 5 }, { n: '1 Peter', c: 5 }, { n: '2 Peter', c: 3 }, { n: '1 John', c: 5 }, { n: '2 John', c: 1 }, { n: '3 John', c: 1 }, { n: 'Jude', c: 1 }
  ]},
  { category: 'Apocalypse', color: 'bg-purple-900', theme: 'revelation', books: [
      { n: 'Revelation', c: 22 }
  ]}
];

// --- AWS CONNECTION ---
const fetchSceneData = async (book, chapter) => {
    // UPDATED: Uses the user provided URL
    const API_URL = "https://1alqvhm1da.execute-api.us-east-1.amazonaws.com/prod/scene"; 
    
    try {
        const response = await fetch(`${API_URL}?id=${book}-${chapter}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        
        // --- DATA SANITIZATION ---
        // Ensure geometry is lowercase to prevent rendering failures
        if(data.geometryType) data.geometryType = data.geometryType.toLowerCase();
        
        return data;
    } catch (error) {
        console.error("AI Fetch Failed:", error);
        // Fallback Layout
        return {
            colorPalette: "#223344", 
            lightingColor: "#ffffff", 
            particleColor: "#88ccff",
            geometryType: "sphere", 
            distortion: 0.3,
            summary: "Experiencing network delays. Using offline procedural generation mode.",
            isFallback: true
        };
    }
};

// --- DYNAMIC VISUALIZER ---

const DynamicScene = ({ isPlaying, data }) => {
    const meshRef = useRef();
    
    useFrame((state, delta) => {
        if (isPlaying && meshRef.current) {
            meshRef.current.rotation.x += delta * 0.1;
            meshRef.current.rotation.y += delta * 0.15;
        }
    });

    if (!data) return null;

    // Geometry Selector (Case Insensitive due to sanitization)
    const getGeometry = () => {
        const type = data.geometryType || 'sphere';
        if (type.includes('cube') || type.includes('box')) return <boxGeometry args={[3, 3, 3]} />;
        if (type.includes('torus') || type.includes('ring')) return <torusKnotGeometry args={[1.5, 0.5, 100, 16]} />;
        if (type.includes('cylinder')) return <cylinderGeometry args={[1, 1, 4, 32]} />;
        return <icosahedronGeometry args={[2.5, 4]} />; // Default Sphere
    };

    return (
        <group>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} color={data.lightingColor || "#fff"} />
            <spotLight position={[-10, 0, 0]} intensity={1} color="#ffffff" />
            
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                <mesh ref={meshRef}>
                    {getGeometry()}
                    <MeshDistortMaterial 
                        color={data.colorPalette || "#4488ff"} 
                        emissive={data.colorPalette || "#000"}
                        emissiveIntensity={0.2}
                        distort={data.distortion || 0.4} 
                        speed={2} 
                        wireframe 
                        roughness={0.2}
                    />
                </mesh>
            </Float>
            
            <Sparkles count={400} scale={15} size={4} speed={0.4} opacity={0.5} color={data.particleColor || "#fff"} />
            <Cloud opacity={0.2} speed={0.2} width={10} depth={1.5} segments={20} position={[0, -5, -5]} color={data.lightingColor || "#fff"} />
        </group>
    );
};

// --- UI COMPONENTS ---

const PlayerOverlay = ({ content, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [sceneData, setSceneData] = useState(null);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

    // 1. DATA FETCHING
    useEffect(() => {
        setIsLoading(true);
        fetchSceneData(content.book, content.chapter).then(data => {
            console.log("Scene Data Received:", data); // Debugging
            setSceneData(data);
            setIsLoading(false);
        });
    }, [content]);

    // 2. AUDIO & PROGRESS HANDLING
    useEffect(() => {
        let interval;
        
        // Handle Audio
        if (audioRef.current) {
            if (isPlaying && !isLoading) {
                audioRef.current.play().catch(e => console.warn("Audio Play Error:", e));
            } else {
                audioRef.current.pause();
            }
        }

        // Handle Progress Bar
        if(isPlaying && !isLoading) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) return 100;
                    // Standard length 30s if no audio duration available
                    return p + (100 / (30 * 20)); 
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying, isLoading]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* AUDIO PLAYER (Invisible) */}
            {sceneData && (
                <audio 
                    ref={audioRef}
                    src={sceneData.audioUrl || "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"} 
                    loop 
                    volume={0.5}
                    onError={(e) => console.log("Audio load error (likely S3 permissions), playing fallback.")}
                />
            )}

            <div className="flex-grow relative bg-black overflow-hidden">
                {/* Loading State */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
                        >
                            <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                            <p className="text-gray-400 text-sm font-mono animate-pulse">
                                CONTACTING AWS BEDROCK...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3D Canvas */}
                <div className="absolute inset-0">
                    {!isLoading && sceneData && (
                        <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
                            <OrbitControls autoRotate={!isPlaying} enableZoom={false} />
                            <DynamicScene isPlaying={isPlaying} data={sceneData} />
                        </Canvas>
                    )}
                </div>

                {/* Info Overlay */}
                <div className="absolute top-10 left-6 md:left-10 z-10 pointer-events-none">
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        transition={{ delay: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">{content.book}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">CHAPTER {content.chapter}</span>
                            <span className="text-white/70 text-lg font-light tracking-widest uppercase">AI GENERATED</span>
                        </div>
                        
                        {!isLoading && sceneData && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="mt-4 max-w-md bg-black/40 backdrop-blur-md p-4 rounded-lg border-l-2 border-red-600 shadow-xl"
                            >
                                <p className="text-sm text-gray-200 mb-2 font-medium italic">"{sceneData.summary}"</p>
                                <div className="flex gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded">Palette: {sceneData.colorPalette}</span>
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded">Geo: {sceneData.geometryType}</span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                <button onClick={onClose} className="absolute top-6 right-6 z-20 text-white/50 hover:text-white transition p-2 bg-black/20 rounded-full backdrop-blur pointer-events-auto">
                    <X className="w-8 h-8" />
                </button>
            </div>

            {/* Controls */}
            <div className="h-24 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 w-full px-6 md:px-8 pb-8 flex flex-col justify-end">
                <div className="w-full h-1 bg-white/20 rounded mb-4 cursor-pointer overflow-hidden">
                    <div className="h-full bg-red-600 relative" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:scale-110 transition">
                            {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const BookCard = ({ book, theme, onClick }) => (
    <div onClick={onClick} className="group relative aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer border border-zinc-800 hover:border-red-600/50 transition-all shadow-lg hover:shadow-red-900/20">
        <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${theme === 'law' ? 'from-amber-900 to-black' : theme === 'gospel' ? 'from-blue-900 to-black' : theme === 'prophecy' ? 'from-red-900 to-black' : theme === 'revelation' ? 'from-purple-900 to-black' : 'from-gray-800 to-black'}`}></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
            <h3 className="text-2xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">{book.n}</h3>
            <span className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-widest">{book.c} Chapters</span>
        </div>
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px]">
            <div className="bg-red-600 rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

export default function App() {
  const [view, setView] = useState('browse');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openBook = (book, theme) => {
      setSelectedBook({ ...book, theme });
      setView('bookDetail');
  };

  const filteredBooks = useMemo(() => {
      if (!searchTerm) return BIBLE_STRUCTURE;
      const lower = searchTerm.toLowerCase();
      return BIBLE_STRUCTURE.map(cat => ({
          ...cat,
          books: cat.books.filter(b => b.n.toLowerCase().includes(lower))
      })).filter(cat => cat.books.length > 0);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-900 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('browse')}>
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-lg shadow-lg">S</div>
            <span className="font-bold text-xl tracking-tighter hidden md:block">Scriptura</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Search books..." 
                    className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-red-600 transition w-48"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-purple-600 border border-white/20"></div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="pt-24 px-6 md:px-16 pb-20 min-h-screen">
        
        {/* VIEW: BROWSE (LIBRARY) */}
        {view === 'browse' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                {!searchTerm && (
                    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-12 border border-zinc-800 group cursor-pointer" onClick={() => openBook({ n: 'Revelation', c: 22 }, 'revelation')}>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-black z-0">
                             <Canvas><Stars /><ambientLight /><Float><mesh><torusKnotGeometry args={[1,0.3,100,16]} /><meshStandardMaterial color="purple" wireframe /></mesh></Float></Canvas>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
                        <div className="absolute bottom-0 left-0 p-8 z-20">
                            <span className="text-red-500 text-xs font-bold tracking-widest bg-black/50 px-2 py-1 rounded backdrop-blur border border-red-500/30">FEATURED SERIES</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-2 mb-2 leading-tight">The Apocalypse</h2>
                            <p className="text-gray-300 max-w-lg text-sm md:text-base line-clamp-2">Dive into the vision of Patmos with our new generative visual engine. Experience Revelation like never before.</p>
                        </div>
                    </div>
                )}

                {filteredBooks.map((section, idx) => (
                    <div key={idx}>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${section.color}`}></div>
                            {section.category}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {section.books.map((book) => (
                                <BookCard 
                                    key={book.n} 
                                    book={book} 
                                    theme={section.theme}
                                    onClick={() => openBook(book, section.theme)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </motion.div>
        )}

        {/* VIEW: BOOK DETAIL */}
        {view === 'bookDetail' && selectedBook && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button 
                    onClick={() => setView('browse')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Library
                </button>

                <div className="flex flex-col md:flex-row gap-8 mb-12">
                     <div className="w-full md:w-1/3 aspect-[3/4] bg-zinc-900 rounded-lg relative overflow-hidden shadow-2xl">
                        <div className={`absolute inset-0 bg-gradient-to-br from-black via-transparent to-transparent z-10`}></div>
                        <div className={`absolute inset-0 opacity-60 bg-gradient-to-br ${selectedBook.theme === 'law' ? 'from-amber-900' : 'from-blue-900'} to-black`}></div>
                        <div className="absolute inset-0 flex items-center justify-center p-8 text-center z-20">
                            <h1 className="text-5xl font-black tracking-tighter drop-shadow-xl">{selectedBook.n}</h1>
                        </div>
                     </div>
                     <div className="flex-grow">
                         <h2 className="text-2xl font-bold mb-4">Chapters</h2>
                         <p className="text-gray-400 mb-6">Select a chapter to begin the generated visual experience.</p>
                         <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                             {Array.from({ length: selectedBook.c }).map((_, i) => {
                                 const chapterNum = i + 1;
                                 return (
                                     <button 
                                        key={i}
                                        onClick={() => setSelectedContent({ book: selectedBook.n, chapter: chapterNum, theme: selectedBook.theme })}
                                        className={`aspect-square rounded border flex flex-col items-center justify-center transition hover:scale-105 relative overflow-hidden bg-zinc-900 border-zinc-800 hover:border-white hover:bg-zinc-800`}
                                     >
                                         <span className="font-bold text-lg">{chapterNum}</span>
                                     </button>
                                 )
                             })}
                         </div>
                     </div>
                </div>
            </motion.div>
        )}

      </div>

      {/* FULL SCREEN PLAYER */}
      <AnimatePresence>
          {selectedContent && (
              <PlayerOverlay 
                content={selectedContent}
                onClose={() => setSelectedContent(null)}
              />
          )}
      </AnimatePresence>

    </div>
  );
}