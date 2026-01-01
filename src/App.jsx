import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Cloud, Text3D, Center, MeshDistortMaterial, Image as DreiImage, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, ChevronLeft, ChevronRight, X, Search, BookOpen, Volume2, Maximize, SkipBack, SkipForward, Info, Calendar, CheckCircle, ArrowLeft, Filter, Loader2, AlertCircle, Clapperboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scriptura Player v4.0 - Hollywood Cinematic Edition
 * - Replaced "Geometry" with Photorealistic Cinematic Backdrops
 * - Added "Ken Burns" Camera movement (Slow Pan/Zoom)
 * - Added Film Grain, Vignette, and Letterboxing (2.35:1 Aspect Ratio)
 */

// --- DATA ---
const BIBLE_STRUCTURE = [
  { category: 'The Pentateuch', color: 'bg-amber-600', theme: 'law', keywords: 'desert,sand,dune,ancient,Egypt', books: [
      { n: 'Genesis', c: 50, keywords: 'galaxy,nebula,creation,stars' }, { n: 'Exodus', c: 40, keywords: 'desert,red sea,pyramid,fire' }, { n: 'Leviticus', c: 27 }, { n: 'Numbers', c: 36 }, { n: 'Deuteronomy', c: 34 }
  ]},
  { category: 'History', color: 'bg-stone-600', theme: 'history', keywords: 'fortress,battlefield,crown,shield,ancient ruins', books: [
      { n: 'Joshua', c: 24 }, { n: 'Judges', c: 21 }, { n: 'Ruth', c: 4 }, { n: '1 Samuel', c: 31 }, { n: '2 Samuel', c: 24 },
      { n: '1 Kings', c: 22 }, { n: '2 Kings', c: 25 }, { n: '1 Chronicles', c: 29 }, { n: '2 Chronicles', c: 36 }, { n: 'Ezra', c: 10 }, { n: 'Nehemiah', c: 13 }, { n: 'Esther', c: 10 }
  ]},
  { category: 'Poetry', color: 'bg-teal-700', theme: 'poetry', keywords: 'mountain,river,forest,peaceful,nature,harp', books: [
      { n: 'Job', c: 42 }, { n: 'Psalms', c: 150 }, { n: 'Proverbs', c: 31 }, { n: 'Ecclesiastes', c: 12 }, { n: 'Song of Solomon', c: 8 }
  ]},
  { category: 'Major Prophets', color: 'bg-red-800', theme: 'prophecy', keywords: 'storm,fire,scroll,ruins,throne', books: [
      { n: 'Isaiah', c: 66 }, { n: 'Jeremiah', c: 52 }, { n: 'Lamentations', c: 5 }, { n: 'Ezekiel', c: 48 }, { n: 'Daniel', c: 12 }
  ]},
  { category: 'Minor Prophets', color: 'bg-red-900', theme: 'prophecy', keywords: 'locust,storm,valley,vineyard', books: [
      { n: 'Hosea', c: 14 }, { n: 'Joel', c: 3 }, { n: 'Amos', c: 9 }, { n: 'Obadiah', c: 1 }, { n: 'Jonah', c: 4, keywords: 'ocean,storm,whale,underwater' }, { n: 'Micah', c: 7 }, { n: 'Nahum', c: 3 }, { n: 'Habakkuk', c: 3 }, { n: 'Zephaniah', c: 3 }, { n: 'Haggai', c: 2 }, { n: 'Zechariah', c: 14 }, { n: 'Malachi', c: 4 }
  ]},
  { category: 'The Gospels', color: 'bg-blue-600', theme: 'gospel', keywords: 'light,olive tree,Jerusalem,fishing boat,cross', books: [
      { n: 'Matthew', c: 28 }, { n: 'Mark', c: 16 }, { n: 'Luke', c: 24 }, { n: 'John', c: 21 }
  ]},
  { category: 'Early Church', color: 'bg-orange-600', theme: 'gospel', keywords: 'map,ship,ancient rome,temple', books: [
      { n: 'Acts', c: 28 }
  ]},
  { category: 'Epistles', color: 'bg-emerald-800', theme: 'epistle', keywords: 'parchment,ink,candle,ancient room', books: [
      { n: 'Romans', c: 16 }, { n: '1 Corinthians', c: 16 }, { n: '2 Corinthians', c: 13 }, { n: 'Galatians', c: 6 }, { n: 'Ephesians', c: 6 }, { n: 'Philippians', c: 4 }, { n: 'Colossians', c: 4 }, { n: '1 Thessalonians', c: 5 }, { n: '2 Thessalonians', c: 3 }, { n: '1 Timothy', c: 6 }, { n: '2 Timothy', c: 4 }, { n: 'Titus', c: 3 }, { n: 'Philemon', c: 1 }, { n: 'Hebrews', c: 13 }, { n: 'James', c: 5 }, { n: '1 Peter', c: 5 }, { n: '2 Peter', c: 3 }, { n: '1 John', c: 5 }, { n: '2 John', c: 1 }, { n: '3 John', c: 1 }, { n: 'Jude', c: 1 }
  ]},
  { category: 'Apocalypse', color: 'bg-purple-900', theme: 'revelation', keywords: 'lightning,volcano,space,throne room', books: [
      { n: 'Revelation', c: 22 }
  ]}
];

// --- AWS CONNECTION (Simulated for this demo to focus on Visuals) ---
const fetchSceneData = async (book, chapter) => {
    // REAL API CONNECTION
    const API_URL = "https://1alqvhm1da.execute-api.us-east-1.amazonaws.com/prod/scene"; 
    
    try {
        const response = await fetch(`${API_URL}?id=${book}-${chapter}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("AI Fetch Failed:", error);
        // Fallback
        return {
            summary: "A cinematic journey through the divine narrative.",
            isFallback: true
        };
    }
};

// --- CINEMATIC VISUALIZER ---

const CinematicBackdrop = ({ isPlaying, bookName, theme }) => {
    const imageRef = useRef();
    
    // 1. Determine Visual Keywords based on Book
    const getKeywords = () => {
        const flatBooks = BIBLE_STRUCTURE.flatMap(c => c.books.map(b => ({...b, parentKeywords: c.keywords})));
        const bookData = flatBooks.find(b => b.n === bookName);
        return bookData?.keywords || bookData?.parentKeywords || "clouds,light";
    };

    const keywords = getKeywords();
    // Using a reliable placeholder service since Unsplash source is often rate limited.
    // In production, this would be your AWS S3 bucket with generated images.
    // We add a random seed to get different images for different chapters
    const imageUrl = `https://image.pollinations.ai/prompt/cinematic%20shot%20of%20${keywords}%20bible%20scene%20epic%20lighting%208k%20ultra%20realistic?width=1920&height=1080&nologo=true&seed=${bookName}${Math.random()}`;

    // 2. Ken Burns Effect (Slow Pan & Zoom)
    useFrame((state, delta) => {
        if (isPlaying && imageRef.current) {
            // Slow zoom in
            imageRef.current.scale.x = THREE.MathUtils.lerp(imageRef.current.scale.x, 1.2, delta * 0.05);
            imageRef.current.scale.y = THREE.MathUtils.lerp(imageRef.current.scale.y, 1.2, delta * 0.05);
            
            // Subtle pan
            imageRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
        }
    });

    return (
        <group>
             <DreiImage 
                ref={imageRef}
                url={imageUrl}
                scale={[12, 7]} // 16:9 Aspect Ratio roughly
                position={[0, 0, -2]}
                transparent
                opacity={0.8}
             />
             
             {/* Atmosphere Overlay */}
             <Sparkles count={200} scale={12} size={2} speed={0.2} opacity={0.3} color="#fff" />
        </group>
    );
};

const CinematicText = ({ text, subtext }) => {
    return (
        <group position={[0, 0, 0]}>
             {/* We use HTML overlay for crisp cinematic text instead of 3D text which can be jagged */}
        </group>
    )
}

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
            setSceneData(data);
            setIsLoading(false);
        });
    }, [content]);

    // 2. AUDIO & PROGRESS
    useEffect(() => {
        let interval;
        if (audioRef.current) {
            isPlaying && !isLoading ? audioRef.current.play().catch(e=>{}) : audioRef.current.pause();
        }
        if(isPlaying && !isLoading) {
            interval = setInterval(() => {
                setProgress(p => (p >= 100 ? 100 : p + 0.1));
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying, isLoading]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* AUDIO PLAYER */}
            {sceneData && (
                <audio 
                    ref={audioRef}
                    src={sceneData.audioUrl || "https://cdn.pixabay.com/download/audio/2022/03/24/audio_03d69903b0.mp3"} // Cinematic Drone Sound
                    loop 
                    volume={0.6}
                />
            )}

            <div className="flex-grow relative bg-black overflow-hidden">
                {/* 3D Canvas - The Movie Screen */}
                <div className="absolute inset-0">
                    <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
                        <CinematicBackdrop isPlaying={isPlaying} bookName={content.book} theme={content.theme} />
                    </Canvas>
                </div>

                {/* CINEMATIC POST-PROCESSING OVERLAYS */}
                
                {/* 1. Letterboxing (The Black Bars) */}
                <div className="absolute top-0 left-0 w-full h-[12%] bg-black z-10"></div>
                <div className="absolute bottom-0 left-0 w-full h-[12%] bg-black z-10"></div>

                {/* 2. Film Grain / Noise */}
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-[5]" style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/7/76/Noise_pattern_with_cross-sections.png")' }}></div>

                {/* 3. Vignette */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none z-[5]"></div>

                {/* TITLE SEQUENCE (Centered) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="text-center"
                     >
                        <h2 className="text-red-600 text-sm md:text-base font-bold tracking-[0.5em] mb-4 uppercase drop-shadow-lg">The Book of</h2>
                        <h1 className="text-6xl md:text-9xl font-serif text-white tracking-tighter drop-shadow-2xl opacity-90">{content.book}</h1>
                        <div className="w-24 h-1 bg-red-600 mx-auto my-6 shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>
                        <h3 className="text-xl md:text-3xl font-light text-gray-200 tracking-[0.2em] uppercase">Chapter {content.chapter}</h3>
                     </motion.div>
                </div>

                {/* SUMMARY SUBTITLES (Bottom) */}
                {!isLoading && sceneData && (
                    <div className="absolute bottom-[15%] w-full flex justify-center z-20 px-10">
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 3, duration: 1 }}
                            className="text-white/90 text-center max-w-3xl font-serif text-lg md:text-xl leading-relaxed drop-shadow-md bg-black/40 backdrop-blur-sm p-4 rounded"
                        >
                            "{sceneData.summary}"
                        </motion.p>
                    </div>
                )}

                {/* CLOSE BUTTON */}
                <button onClick={onClose} className="absolute top-8 right-8 z-30 text-white/50 hover:text-red-500 transition hover:scale-110">
                    <X className="w-8 h-8 drop-shadow-lg" />
                </button>
            </div>

            {/* PROGRESS BAR (Integrated into Letterbox) */}
            <div className="absolute bottom-0 w-full z-30 h-1.5 bg-gray-900 cursor-pointer">
                <div className="h-full bg-red-700 shadow-[0_0_15px_red]" style={{ width: `${progress}%` }}></div>
            </div>
            
            {/* CONTROLS (Minimalist) */}
            <div className="absolute bottom-6 left-6 z-30 flex items-center gap-4">
                 <button onClick={() => setIsPlaying(!isPlaying)} className="text-white/80 hover:text-white hover:scale-110 transition">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                 </button>
                 <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">
                    {isPlaying ? 'Now Playing' : 'Paused'}
                 </span>
            </div>
        </motion.div>
    );
};

const BookCard = ({ book, theme, onClick }) => (
    <div onClick={onClick} className="group relative aspect-[2/3] bg-zinc-900 rounded-sm overflow-hidden cursor-pointer border border-zinc-900 hover:border-zinc-700 transition-all shadow-xl">
        <div className={`absolute inset-0 opacity-60 bg-gradient-to-t ${theme === 'law' ? 'from-amber-900' : theme === 'gospel' ? 'from-blue-900' : theme === 'prophecy' ? 'from-red-900' : theme === 'revelation' ? 'from-purple-900' : 'from-gray-800'} to-black via-black/50`}></div>
        
        {/* Cinematic Poster Design */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
            <h3 className="text-2xl font-serif text-white tracking-tight group-hover:text-red-500 transition-colors duration-500">{book.n}</h3>
            <div className="w-8 h-px bg-white/30 my-2 group-hover:w-full transition-all duration-500"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{book.c} Chapters</span>
        </div>

        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition duration-500"></div>
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-900 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-40 bg-gradient-to-b from-black to-transparent px-6 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto cursor-pointer" onClick={() => setView('browse')}>
            <Clapperboard className="w-6 h-6 text-red-600" />
            <span className="font-serif font-bold text-xl tracking-tight hidden md:block">SCRIPTURA</span>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
            <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Search Series..." 
                    className="bg-black/50 backdrop-blur border border-white/10 rounded px-9 py-2 text-sm focus:outline-none focus:border-red-600 transition w-64 font-serif text-gray-300 placeholder:text-gray-600"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                />
            </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="pt-28 px-6 md:px-16 pb-20 min-h-screen">
        
        {/* VIEW: BROWSE (LIBRARY) */}
        {view === 'browse' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                {!searchTerm && (
                    <div className="relative h-[60vh] rounded-xl overflow-hidden mb-16 border border-white/5 group cursor-pointer shadow-2xl" onClick={() => openBook({ n: 'Revelation', c: 22 }, 'revelation')}>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop')] bg-cover bg-center opacity-60 transition duration-700 group-hover:scale-105"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                        
                        <div className="absolute bottom-0 left-0 p-10 md:p-16 z-20 max-w-4xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-red-600 text-[10px] font-bold tracking-[0.3em] uppercase border border-red-600 px-3 py-1">Featured Series</span>
                            </div>
                            <h2 className="text-5xl md:text-8xl font-serif text-white mb-6 leading-[0.9] tracking-tighter">The<br/>Apocalypse</h2>
                            <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed max-w-xl">
                                A cinematic visual exploration of the Apostle John's vision. Experience the end of days through our new AI-driven render engine.
                            </p>
                            
                            <div className="mt-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Click to Explore</span>
                                <ArrowLeft className="w-4 h-4 text-white rotate-180" />
                            </div>
                        </div>
                    </div>
                )}

                {filteredBooks.map((section, idx) => (
                    <div key={idx}>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                            <div className={`w-8 h-px ${section.color}`}></div>
                            {section.category}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
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
                    className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition uppercase text-xs font-bold tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" /> Return to Library
                </button>

                <div className="flex flex-col lg:flex-row gap-12 mb-12">
                     <div className="w-full lg:w-1/3">
                        <div className="aspect-[2/3] bg-zinc-900 rounded relative overflow-hidden shadow-2xl border border-white/5">
                            <div className={`absolute inset-0 bg-gradient-to-br from-black via-transparent to-transparent z-10`}></div>
                            <div className={`absolute inset-0 opacity-40 bg-gradient-to-t ${selectedBook.theme === 'law' ? 'from-amber-900' : 'from-blue-900'} to-gray-900`}></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20">
                                <h1 className="text-6xl font-serif tracking-tighter drop-shadow-2xl mb-2">{selectedBook.n}</h1>
                                <div className="w-12 h-1 bg-red-600"></div>
                            </div>
                        </div>
                     </div>
                     
                     <div className="flex-grow">
                         <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-3xl font-serif text-white">Select a Chapter</h2>
                                <p className="text-gray-500 mt-2 font-light">Begin the cinematic visualizer.</p>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
                             {Array.from({ length: selectedBook.c }).map((_, i) => {
                                 const chapterNum = i + 1;
                                 return (
                                     <button 
                                        key={i}
                                        onClick={() => setSelectedContent({ book: selectedBook.n, chapter: chapterNum, theme: selectedBook.theme })}
                                        className="aspect-square bg-white/5 hover:bg-red-900/40 border border-white/5 hover:border-red-600/50 transition-all duration-300 flex flex-col items-center justify-center group"
                                     >
                                         <span className="font-serif text-2xl text-gray-400 group-hover:text-white transition-colors">{chapterNum}</span>
                                     </button>
                                 )
                             })}
                         </div>
                     </div>
                </div>
            </motion.div>
        )}

      </div>

      {/* FULL SCREEN CINEMATIC PLAYER */}
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