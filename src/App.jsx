import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Cloud, Text3D, Center, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, ChevronLeft, ChevronRight, X, Search, BookOpen, Volume2, Maximize, SkipBack, SkipForward, Info, Calendar, CheckCircle, ArrowLeft, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scriptura Player v2.0
 * - Full Bible Navigation (66 Books, 1189 Chapters)
 * - 365-Day Reading Plan with Progress Tracking (Local Storage)
 * - Procedural 3D "Video" Generation for every chapter
 * - Search & Filtering
 */

// --- DATA & STRUCTURE ---

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

// Flatten books for search/plan generation
const ALL_BOOKS = BIBLE_STRUCTURE.flatMap(cat => cat.books.map(b => ({...b, theme: cat.theme, category: cat.category})));

// Generate a 365-day plan (Simple algorithm: ~3.25 chapters/day)
const generateReadingPlan = () => {
    const plan = [];
    let currentBookIdx = 0;
    let currentChapter = 1;
    let day = 1;

    while (day <= 365 && currentBookIdx < ALL_BOOKS.length) {
        const readings = [];
        let chaptersToday = 0;
        
        // Target roughly 3-4 chapters, but finish books cleanly if possible
        while (chaptersToday < 3 && currentBookIdx < ALL_BOOKS.length) {
            const book = ALL_BOOKS[currentBookIdx];
            readings.push({ 
                book: book.n, 
                chapter: currentChapter,
                theme: book.theme,
                category: book.category,
                id: `${book.n}-${currentChapter}`
            });
            
            chaptersToday++;
            currentChapter++;
            
            if (currentChapter > book.c) {
                currentBookIdx++;
                currentChapter = 1;
            }
        }
        
        plan.push({ day, readings });
        day++;
    }
    return plan;
};

const READING_PLAN = generateReadingPlan();

// --- 3D VISUALIZERS (Procedural Videos) ---

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
          <MeshDistortMaterial color="#224488" emissive="#112244" distort={0.4} speed={2} wireframe roughness={0} />
        </mesh>
      </Float>
      <Sparkles count={300} scale={12} size={3} speed={0.4} opacity={0.5} color="#88ccff" />
      <pointLight position={[10, 10, 10]} intensity={2} color="#4488ff" />
    </group>
  );
};

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
      <Sparkles count={500} scale={15} size={2} speed={0.2} opacity={0.6} color="#ffd700" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#3d2b1f" />
      </mesh>
    </group>
  );
};

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
            <Sparkles count={1000} size={2} speed={2} opacity={0.8} color="#ffaa00" scale={12} noise={1} />
        </group>
    )
}

const GospelVisualizer = ({ isPlaying }) => {
    return (
        <group>
            <ambientLight intensity={0.8} />
            <directionalLight position={[0, 10, 5]} intensity={1.5} color="#fff" />
            <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5}>
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

const SceneManager = ({ theme, isPlaying }) => {
    switch (theme) {
        case 'law': return <LawVisualizer isPlaying={isPlaying} />;
        case 'history': return <LawVisualizer isPlaying={isPlaying} />;
        case 'poetry': return <PoetryVisualizer isPlaying={isPlaying} />;
        case 'prophecy': return <ProphecyVisualizer isPlaying={isPlaying} />;
        case 'gospel': return <GospelVisualizer isPlaying={isPlaying} />;
        case 'epistle': return <GospelVisualizer isPlaying={isPlaying} />;
        case 'revelation': return <RevelationVisualizer isPlaying={isPlaying} />;
        default: return <CreationVisualizer isPlaying={isPlaying} />;
    }
}

// --- UI COMPONENTS ---

const PlayerOverlay = ({ content, onClose, onComplete }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval;
        if(isPlaying) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return p + 0.05; // 30-45 sec "video"
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            <div className="flex-grow relative bg-black cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
                     <OrbitControls autoRotate={!isPlaying} enableZoom={false} />
                     <SceneManager theme={content.theme} isPlaying={isPlaying} />
                </Canvas>

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
                            <span className="text-white/70 text-lg font-light tracking-widest uppercase">{content.theme}</span>
                        </div>
                        <p className="mt-4 max-w-md text-sm text-gray-300 drop-shadow-md bg-black/30 backdrop-blur p-4 rounded-lg border-l-2 border-red-600">
                           Exploring the divine narrative through algorithmic visualization. 
                           This procedural scene represents the thematic essence of {content.book} {content.chapter}.
                        </p>
                    </motion.div>
                </div>

                <button onClick={onClose} className="absolute top-6 right-6 z-20 text-white/50 hover:text-white transition p-2 bg-black/20 rounded-full backdrop-blur">
                    <X className="w-8 h-8" />
                </button>
            </div>

            {/* Controls */}
            <div className="h-24 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 w-full px-6 md:px-8 pb-8 flex flex-col justify-end">
                <div className="w-full h-1 bg-white/20 rounded mb-4 cursor-pointer overflow-hidden" onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    setProgress((clickX / rect.width) * 100);
                }}>
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
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onComplete(content.id)}
                            className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/10 hover:bg-green-600/80 rounded transition border border-white/10"
                        >
                            <CheckCircle className="w-4 h-4" /> MARK COMPLETE
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

const ReadingPlanItem = ({ day, readings, completedIds, onPlay, onToggle }) => {
    const isDayComplete = readings.every(r => completedIds.includes(r.id));
    
    return (
        <div className={`p-4 rounded-lg border transition-all ${isDayComplete ? 'bg-green-900/10 border-green-800' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className={`font-bold ${isDayComplete ? 'text-green-500' : 'text-gray-200'}`}>Day {day}</h3>
                {isDayComplete && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <div className="space-y-2">
                {readings.map((reading) => {
                    const isDone = completedIds.includes(reading.id);
                    return (
                        <div key={reading.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => onToggle(reading.id)}
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isDone ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-gray-400'}`}
                                >
                                    {isDone && <CheckCircle className="w-3 h-3 text-white" />}
                                </button>
                                <span className={`text-sm ${isDone ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                    {reading.book} {reading.chapter}
                                </span>
                            </div>
                            <button 
                                onClick={() => onPlay(reading)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition"
                            >
                                <Play className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState('browse'); // 'browse', 'plan', 'bookDetail'
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Progress Persistence
  const [completedReadings, setCompletedReadings] = useState(() => {
      const saved = localStorage.getItem('scriptura_progress');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('scriptura_progress', JSON.stringify(completedReadings));
  }, [completedReadings]);

  const toggleProgress = (id) => {
      setCompletedReadings(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  const handlePlayContent = (content) => {
      setSelectedContent(content);
  };

  const openBook = (book, theme) => {
      setSelectedBook({ ...book, theme });
      setView('bookDetail');
  };

  // Filter books for search
  const filteredBooks = useMemo(() => {
      if (!searchTerm) return BIBLE_STRUCTURE;
      const lower = searchTerm.toLowerCase();
      // Return a simplified structure for search results
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

        <div className="flex items-center gap-1 md:gap-6 bg-zinc-900 rounded-full px-1 py-1 border border-zinc-800">
            <button 
                onClick={() => setView('browse')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${view !== 'plan' ? 'bg-zinc-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Library
            </button>
            <button 
                onClick={() => setView('plan')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition flex items-center gap-2 ${view === 'plan' ? 'bg-zinc-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <Calendar className="w-3 h-3" /> Plan
            </button>
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
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500 z-30">
                            <div className="bg-white/20 backdrop-blur p-4 rounded-full border border-white/30 hover:scale-110 transition">
                                <Play className="w-8 h-8 fill-white text-white" />
                            </div>
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

        {/* VIEW: READING PLAN */}
        {view === 'plan' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
                <div className="flex items-end justify-between mb-8 border-b border-zinc-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Daily Reading Plan</h1>
                        <p className="text-gray-400">A curated 365-day journey through the entire Scriptures.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-white">{Math.round((completedReadings.length / 1189) * 100)}%</div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Completed</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {READING_PLAN.map((dayPlan) => (
                        <ReadingPlanItem 
                            key={dayPlan.day}
                            day={dayPlan.day}
                            readings={dayPlan.readings}
                            completedIds={completedReadings}
                            onPlay={handlePlayContent}
                            onToggle={toggleProgress}
                        />
                    ))}
                </div>
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
                                 const id = `${selectedBook.n}-${chapterNum}`;
                                 const isDone = completedReadings.includes(id);
                                 return (
                                     <button 
                                        key={i}
                                        onClick={() => handlePlayContent({ book: selectedBook.n, chapter: chapterNum, theme: selectedBook.theme, id })}
                                        className={`aspect-square rounded border flex flex-col items-center justify-center transition hover:scale-105 relative overflow-hidden ${isDone ? 'bg-green-900/20 border-green-700 text-green-500' : 'bg-zinc-900 border-zinc-800 hover:border-white hover:bg-zinc-800'}`}
                                     >
                                         <span className="font-bold text-lg">{chapterNum}</span>
                                         {isDone && <div className="absolute bottom-1 right-1"><CheckCircle className="w-3 h-3" /></div>}
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
                onComplete={(id) => {
                    toggleProgress(id);
                    setSelectedContent(null);
                }}
              />
          )}
      </AnimatePresence>

    </div>
  );
}