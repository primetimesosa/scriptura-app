import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Cloud, Text3D, Center, MeshDistortMaterial, Image as DreiImage, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, ChevronLeft, ChevronRight, X, Search, BookOpen, Volume2, Maximize, SkipBack, SkipForward, Info, Calendar, CheckCircle, ArrowLeft, Filter, Loader2, AlertCircle, Clapperboard, Film, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Scriptura Player v7.0 - Hybrid Engine (Runway ML Ready)
 * - Feature: Hybrid Playback System (Supports MP4 Video OR Procedural 3D)
 * - Integration: Ready for Runway ML / Sora generated video files
 * - Fallback: Defaults to Real-time 3D engine if no video file is found
 */

// --- DATA ---
const BIBLE_STRUCTURE = [
  { category: 'The Pentateuch', color: 'bg-amber-600', theme: 'law', keywords: 'desert dunes, ancient egypt, mount sinai, golden tabernacle', books: [
      { n: 'Genesis', c: 50, keywords: 'cosmic nebula, garden of eden, noahs ark in storm, tower of babel' }, { n: 'Exodus', c: 40, keywords: 'red sea parting, burning bush, pharaohs palace, pillar of fire' }, { n: 'Leviticus', c: 27 }, { n: 'Numbers', c: 36 }, { n: 'Deuteronomy', c: 34 }
  ]},
  { category: 'History', color: 'bg-stone-600', theme: 'history', keywords: 'ancient stone fortress, battlefield, iron throne, jerusalem walls', books: [
      { n: 'Joshua', c: 24 }, { n: 'Judges', c: 21 }, { n: 'Ruth', c: 4 }, { n: '1 Samuel', c: 31 }, { n: '2 Samuel', c: 24 },
      { n: '1 Kings', c: 22 }, { n: '2 Kings', c: 25 }, { n: '1 Chronicles', c: 29 }, { n: '2 Chronicles', c: 36 }, { n: 'Ezra', c: 10 }, { n: 'Nehemiah', c: 13 }, { n: 'Esther', c: 10 }
  ]},
  { category: 'Poetry', color: 'bg-teal-700', theme: 'poetry', keywords: 'misty mountains, still waters, green pastures, starry night sky', books: [
      { n: 'Job', c: 42 }, { n: 'Psalms', c: 150 }, { n: 'Proverbs', c: 31 }, { n: 'Ecclesiastes', c: 12 }, { n: 'Song of Solomon', c: 8 }
  ]},
  { category: 'Major Prophets', color: 'bg-red-800', theme: 'prophecy', keywords: 'burning coals, destroyed city, valley of dry bones, heavenly throne room', books: [
      { n: 'Isaiah', c: 66 }, { n: 'Jeremiah', c: 52 }, { n: 'Lamentations', c: 5 }, { n: 'Ezekiel', c: 48 }, { n: 'Daniel', c: 12 }
  ]},
  { category: 'Minor Prophets', color: 'bg-red-900', theme: 'prophecy', keywords: 'swarm of locusts, dark storm clouds, mountain peak, ancient scroll', books: [
      { n: 'Hosea', c: 14 }, { n: 'Joel', c: 3 }, { n: 'Amos', c: 9 }, { n: 'Obadiah', c: 1 }, { n: 'Jonah', c: 4, keywords: 'raging ocean, giant whale underwater, storm lightning, niniveh city' }, { n: 'Micah', c: 7 }, { n: 'Nahum', c: 3 }, { n: 'Habakkuk', c: 3 }, { n: 'Zephaniah', c: 3 }, { n: 'Haggai', c: 2 }, { n: 'Zechariah', c: 14 }, { n: 'Malachi', c: 4 }
  ]},
  { category: 'The Gospels', color: 'bg-blue-600', theme: 'gospel', keywords: 'sea of galilee, mount of olives, ancient jerusalem streets, empty tomb', books: [
      { n: 'Matthew', c: 28 }, { n: 'Mark', c: 16 }, { n: 'Luke', c: 24 }, { n: 'John', c: 21 }
  ]},
  { category: 'Early Church', color: 'bg-orange-600', theme: 'gospel', keywords: 'ancient mediterranean map, roman ship in storm, temple courts, tongues of fire', books: [
      { n: 'Acts', c: 28 }
  ]},
  { category: 'Epistles', color: 'bg-emerald-800', theme: 'epistle', keywords: 'parchment and quill, candle light, roman prison cell, ancient letters', books: [
      { n: 'Romans', c: 16 }, { n: '1 Corinthians', c: 16 }, { n: '2 Corinthians', c: 13 }, { n: 'Galatians', c: 6 }, { n: 'Ephesians', c: 6 }, { n: 'Philippians', c: 4 }, { n: 'Colossians', c: 4 }, { n: '1 Thessalonians', c: 5 }, { n: '2 Thessalonians', c: 3 }, { n: '1 Timothy', c: 6 }, { n: '2 Timothy', c: 4 }, { n: 'Titus', c: 3 }, { n: 'Philemon', c: 1 }, { n: 'Hebrews', c: 13 }, { n: 'James', c: 5 }, { n: '1 Peter', c: 5 }, { n: '2 Peter', c: 3 }, { n: '1 John', c: 5 }, { n: '2 John', c: 1 }, { n: '3 John', c: 1 }, { n: 'Jude', c: 1 }
  ]},
  { category: 'Apocalypse', color: 'bg-purple-900', theme: 'revelation', keywords: 'apocalyptic sky, four horsemen, golden city, crystal sea, lightning storm', books: [
      { n: 'Revelation', c: 22 }
  ]}
];

// --- LOGIC: ONE YEAR PLAN ---
const generateDailyReadings = () => {
    const allChapters = [];
    BIBLE_STRUCTURE.forEach(cat => cat.books.forEach(book => {
        for(let i=1; i<=book.c; i++) allChapters.push({book: book.n, chapter: i, theme: cat.theme});
    }));
    
    const totalDays = 365;
    const chaptersPerDay = Math.ceil(allChapters.length / totalDays);
    
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const startIndex = (dayOfYear - 1) * chaptersPerDay;
    return allChapters.slice(startIndex, startIndex + 3); 
};

// --- AWS CONNECTION (Hybrid Mode) ---
const fetchSceneData = async (book, chapter) => {
    const API_URL = "https://1alqvhm1da.execute-api.us-east-1.amazonaws.com/prod/scene"; 
    
    // DEMO LOGIC: Simulating that "Genesis 1" has a real Runway ML video
    // In production, your backend would look up if an S3 URL exists for this chapter.
    if (book === 'Genesis' && chapter === 1) {
        return {
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", // Placeholder for Runway video
            summary: "The Creation: In the beginning God created the heavens and the earth.",
            source: "RunwayML"
        };
    }

    try {
        const response = await fetch(`${API_URL}?id=${book}-${chapter}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn("AI Fetch Failed (Using Fallback):", error);
        return {
            summary: `A visual exploration of ${book} chapter ${chapter}.`,
            isFallback: true
        };
    }
};

// --- PROCEDURAL AUDIO HOOK ---
const useAtmosphericDrone = (isPlaying) => {
    const audioCtxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const oscillatorsRef = useRef([]);

    useEffect(() => {
        if (isPlaying) {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioContext();
                
                const gainNode = audioCtxRef.current.createGain();
                gainNode.gain.value = 0.05; 
                gainNode.connect(audioCtxRef.current.destination);
                gainNodeRef.current = gainNode;

                const frequencies = [65.41, 130.81, 155.56, 196.00]; 
                
                frequencies.forEach((freq) => {
                    const osc = audioCtxRef.current.createOscillator();
                    osc.type = 'triangle'; 
                    osc.frequency.value = freq;
                    osc.detune.value = (Math.random() - 0.5) * 15; 
                    osc.connect(gainNode);
                    osc.start();
                    oscillatorsRef.current.push(osc);
                });
            } else if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            if(gainNodeRef.current) gainNodeRef.current.gain.setTargetAtTime(0.05, audioCtxRef.current.currentTime, 2);
        } else {
            if (audioCtxRef.current && gainNodeRef.current) {
                gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
                setTimeout(() => { if (audioCtxRef.current) audioCtxRef.current.suspend(); }, 500);
            }
        }
        return () => {
            if (audioCtxRef.current) {
                oscillatorsRef.current.forEach(osc => osc.stop());
                audioCtxRef.current.close();
                audioCtxRef.current = null;
                oscillatorsRef.current = [];
            }
        };
    }, [isPlaying]);
};

// --- SCENE LOADER ---
const SceneLoader = () => {
    const mesh = useRef();
    useFrame((state, delta) => {
        if(mesh.current) {
            mesh.current.rotation.x += delta;
            mesh.current.rotation.y += delta;
        }
    });
    return (
        <group>
            <mesh ref={mesh}>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="white" wireframe />
            </mesh>
            <Text position={[0, -1.5, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
                LOADING ASSETS...
            </Text>
        </group>
    );
};

// --- MULTI-PLANE ANIMATION ENGINE ---
const CinematicLayer = ({ url, depth, speed, scale, opacity = 1, blending = THREE.NormalBlending }) => {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.getElapsedTime();
            ref.current.position.x = Math.sin(t * 0.05 * speed) * (0.5 * depth);
            ref.current.position.y = Math.cos(t * 0.03 * speed) * (0.2 * depth);
        }
    });

    return (
        <DreiImage 
            ref={ref}
            url={url}
            scale={scale}
            position={[0, 0, -depth * 2]} 
            transparent
            opacity={opacity}
            color={new THREE.Color(opacity, opacity, opacity)} 
        />
    );
};

const EpisodicDirector = ({ isPlaying, bookName }) => {
    const [shotIndex, setShotIndex] = useState(0); 
    const { camera } = useThree();

    const shots = useMemo(() => {
        const getKeywords = () => {
            const flatBooks = BIBLE_STRUCTURE.flatMap(c => c.books.map(b => ({...b, parentKeywords: c.keywords})));
            const bookData = flatBooks.find(b => b.n === bookName);
            return bookData?.keywords || bookData?.parentKeywords || "clouds, light, cinematic";
        };
        const keywords = getKeywords();
        
        const seed = Math.floor(Math.random() * 99999);
        const RES = "width=1280&height=720";

        return [
            {
                type: 'ESTABLISHING',
                bg: `https://image.pollinations.ai/prompt/wide%20cinematic%20landscape%20shot%20of%20${encodeURIComponent(keywords)},%20epic%20sky,%20horizon,%208k,%20matte%20painting?${RES}&nologo=true&seed=${seed}_1`,
                fg: `https://image.pollinations.ai/prompt/subtle%20fog%20overlay,%20mist,%20transparent%20background?${RES}&nologo=true&seed=${seed}_fog`
            },
            {
                type: 'DETAIL',
                bg: `https://image.pollinations.ai/prompt/close%20up%20macro%20shot%20of%20${encodeURIComponent(keywords)},%20intricate%20texture,%20dramatic%20lighting,%20depth%20of%20field?${RES}&nologo=true&seed=${seed}_2`,
                fg: `https://image.pollinations.ai/prompt/floating%20dust%20particles,%20light%20rays,%20sparkles,%20black%20background?${RES}&nologo=true&seed=${seed}_dust`
            },
            {
                type: 'ACTION',
                bg: `https://image.pollinations.ai/prompt/dynamic%20action%20angle%20of%20${encodeURIComponent(keywords)},%20motion%20blur,%20cinematic%20orange%20and%20teal,%20volumetric%20lighting?${RES}&nologo=true&seed=${seed}_3`,
                fg: `https://image.pollinations.ai/prompt/lens%20flare%20overlay,%20bokeh,%20transparent?${RES}&nologo=true&seed=${seed}_flare`
            }
        ];
    }, [bookName]);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setShotIndex(prev => (prev + 1) % shots.length);
        }, 12000);
        return () => clearInterval(interval);
    }, [isPlaying, shots.length]);

    useFrame((state, delta) => {
        if (!isPlaying) return;
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5 + (Math.sin(state.clock.elapsedTime * 0.1)), delta);
        const targetZoom = 5 - (shotIndex * 0.5); 
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZoom, delta * 0.5);
    });

    return (
        <group>
            <mesh position={[0,0,-10]}>
                <planeGeometry args={[50, 30]} />
                <meshBasicMaterial color="#050505" />
            </mesh>

            <CinematicLayer 
                url={shots[shotIndex].bg} 
                depth={2} 
                speed={0.2} 
                scale={[16, 9]} 
            />

            <group position={[0, 0, 1]}>
                <CinematicLayer 
                    url={shots[shotIndex].fg} 
                    depth={1} 
                    speed={0.5} 
                    scale={[16, 9]} 
                    opacity={0.6}
                    blending={THREE.AdditiveBlending} 
                />
            </group>

            <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#fff" />
        </group>
    );
};

// --- UI COMPONENTS ---

const PlayerOverlay = ({ content, onClose, onComplete }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [sceneData, setSceneData] = useState(null);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    // Only use drone if NOT playing a video file
    useAtmosphericDrone(isPlaying && !isLoading && !sceneData?.videoUrl);

    useEffect(() => {
        setIsLoading(true);
        fetchSceneData(content.book, content.chapter).then(data => {
            setSceneData(data);
            setIsLoading(false);
        });
    }, [content]);

    useEffect(() => {
        let interval;
        
        // Handle Video File Playback
        if (sceneData?.videoUrl && videoRef.current) {
            if (isPlaying) videoRef.current.play().catch(e => console.warn("Video Play:", e));
            else videoRef.current.pause();
        }

        // Handle Progress (If procedural)
        if(isPlaying && !isLoading && !sceneData?.videoUrl) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        if (onComplete) onComplete();
                        return 100;
                    }
                    return p + 0.05;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying, isLoading, sceneData]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            <div className="flex-grow relative bg-black overflow-hidden">
                <div className="absolute inset-0">
                    {/* HYBRID RENDERER: Video File OR Procedural Engine */}
                    {!isLoading && sceneData?.videoUrl ? (
                        <video 
                            ref={videoRef}
                            src={sceneData.videoUrl}
                            className="w-full h-full object-cover"
                            loop
                            playsInline
                            onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
                        />
                    ) : (
                        <Canvas camera={{ position: [0, 0, 6], fov: 35 }}>
                            <Suspense fallback={<SceneLoader />}>
                                <EpisodicDirector key={content.book + content.chapter} isPlaying={isPlaying} bookName={content.book} />
                                <Preload all />
                            </Suspense>
                        </Canvas>
                    )}
                </div>

                {/* Overlays (Only show cinematics if NOT playing a real video file) */}
                {!sceneData?.videoUrl && (
                    <>
                        <div className="absolute top-0 left-0 w-full h-[12%] bg-black z-10"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[12%] bg-black z-10"></div>
                        <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-[5] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-[5]"></div>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
                                transition={{ duration: 6, times: [0, 0.1, 0.8, 1] }} 
                                className="text-center"
                            >
                                <h2 className="text-white/80 text-sm font-bold tracking-[0.5em] mb-4 uppercase drop-shadow-lg">Now Presenting</h2>
                                <h1 className="text-6xl md:text-8xl font-serif text-white tracking-tighter drop-shadow-2xl">{content.book}</h1>
                                <h3 className="text-xl md:text-2xl font-light text-red-500 tracking-[0.3em] uppercase mt-4">Chapter {content.chapter}</h3>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Subtitles */}
                {!isLoading && sceneData && !sceneData.videoUrl && (
                    <div className="absolute bottom-[15%] w-full flex justify-center z-20 px-10">
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2, duration: 1 }}
                            className="text-white/90 text-center max-w-4xl font-serif text-xl md:text-2xl leading-relaxed drop-shadow-lg bg-black/60 backdrop-blur-md p-6 rounded-sm border-b-2 border-red-600"
                        >
                            "{sceneData.summary}"
                        </motion.p>
                    </div>
                )}

                <button type="button" onClick={onClose} className="absolute top-8 right-8 z-30 text-white/50 hover:text-white transition p-2 bg-white/10 rounded-full backdrop-blur pointer-events-auto">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="h-1 bg-gray-900 w-full z-30">
                <div className="h-full bg-red-600 shadow-[0_0_10px_red]" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="absolute bottom-6 left-8 z-30 flex items-center gap-4">
                 <button type="button" onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-red-500 transition hover:scale-110">
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                 </button>
                 <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {sceneData?.videoUrl ? 'Runway ML Video' : 'Procedural Render'}
                 </div>
            </div>
        </motion.div>
    );
};

const Dashboard = ({ progress, setView, onPlay }) => {
    const dailyReadings = generateDailyReadings();
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-red-900/20 to-transparent"></div>
                <h1 className="text-4xl font-serif text-white mb-2">Welcome Back.</h1>
                <p className="text-gray-400 mb-6">Day 1 of 365. You are on track.</p>
                
                <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-4">Today's Readings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dailyReadings.map((r, i) => (
                        <div key={i} className="bg-zinc-800/50 p-4 rounded-lg border border-white/5 hover:border-red-500/50 transition cursor-pointer group" onClick={() => onPlay(r)}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-300">{r.book}</span>
                                <Play className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                            </div>
                            <div className="text-2xl font-serif text-white">Ch. {r.chapter}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><Bookmark className="w-4 h-4 text-red-500" /> Saved Chapters</h3>
                    <div className="text-sm text-gray-500 text-center py-8">No bookmarks yet.</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Recent Progress</h3>
                    <div className="text-sm text-gray-500 text-center py-8">Start watching to track progress.</div>
                </div>
            </div>
        </motion.div>
    );
};

const BookCard = ({ book, theme, onClick }) => (
    <div onClick={onClick} className="group relative aspect-[2/3] bg-zinc-900 rounded-sm overflow-hidden cursor-pointer border border-zinc-900 hover:border-zinc-700 transition-all shadow-xl">
        <div className={`absolute inset-0 opacity-60 bg-gradient-to-t ${theme === 'law' ? 'from-amber-900' : theme === 'gospel' ? 'from-blue-900' : theme === 'prophecy' ? 'from-red-900' : theme === 'revelation' ? 'from-purple-900' : 'from-gray-800'} to-black via-black/50`}></div>
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
        
        <div className="flex items-center gap-6 pointer-events-auto bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            <button type="button" onClick={() => setView('browse')} className={`text-sm font-bold transition ${view === 'browse' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Library</button>
            <button type="button" onClick={() => setView('dashboard')} className={`text-sm font-bold transition ${view === 'dashboard' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Dashboard</button>
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
        
        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
            <Dashboard 
                setView={setView} 
                onPlay={(content) => setSelectedContent(content)} 
            />
        )}

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
                    type="button"
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
                                        type="button"
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
                onComplete={() => console.log('Chapter Complete')}
              />
          )}
      </AnimatePresence>

    </div>
  );
}