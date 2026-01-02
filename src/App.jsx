import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, BookOpen, Volume2, VolumeX, Loader2, RefreshCw, Settings, Image as ImageIcon, AlertTriangle, Video } from 'lucide-react';

/**
 * Scriptura: Cinema Engine (OpenAI Edition)
 * Supports:
 * 1. OpenAI DALL-E 3 (Best Quality - Requires API Key in Env Vars)
 * 2. Hugging Face FLUX.1 (High Quality - Requires Token in Env Vars)
 * 3. Pollinations.ai (Fallback - Free, No Key) - Generates Cinematic Stills
 */

// --- CONFIGURATION ---
// Keys are now pulled from Environment Variables
// In Vite, variables must start with VITE_ to be exposed to the frontend
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const HUGGING_FACE_TOKEN = import.meta.env.VITE_HUGGING_FACE_TOKEN || "";

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther",
  "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

export default function App() {
  // State
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bibleText, setBibleText] = useState("");
  
  // Media State
  const [visualUrl, setVisualUrl] = useState("");
  const [isVideo, setIsVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [progress, setProgress] = useState(0);
  const [engineUsed, setEngineUsed] = useState("Pollinations");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Refs
  const speechRef = useRef(null);
  const textContainerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const videoRef = useRef(null);

  // --- 1. FETCH BIBLE TEXT ---
  useEffect(() => {
    const fetchChapter = async () => {
      setIsLoading(true);
      setIsPlaying(false);
      setProgress(0);
      setErrorMsg("");
      cancelSpeech();
      setVisualUrl(""); 
      setIsVideo(false);

      try {
        // Changed translation to 'web' (World English Bible) which is closer to NLT in readability and Public Domain.
        const response = await fetch(`https://bible-api.com/${selectedBook}+${selectedChapter}?translation=web`);
        const data = await response.json();
        
        if (data.text) {
          const cleanText = data.text.trim().replace(/\n/g, " ");
          setBibleText(cleanText);
          generateVisuals(cleanText, selectedBook, selectedChapter);
        } else {
          setBibleText("Text not available for this chapter.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch bible text", error);
        setBibleText("Error loading text. Please try again.");
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [selectedBook, selectedChapter]);

  // --- 2. IMAGE/VIDEO GENERATION ENGINE (MULTI-PROVIDER) ---
  const generateVisuals = async (text, book, chapter) => {
    // Extract keywords for prompt
    const snippet = text.substring(0, 300).replace(/[^a-zA-Z ]/g, "");
    
    // Prompt Engineering
    const prompt = `cinematic movie scene of ${book} chapter ${chapter}, ${snippet}, epic lighting, 8k resolution, historical accuracy, dramatic atmosphere, volumetric fog, photorealistic`;

    try {
      if (OPENAI_API_KEY) {
        // --- MODE A: OPENAI DALL-E 3 (High Quality Image) ---
        setEngineUsed("DALL-E 3");
        setIsVideo(false); // DALL-E returns Images, so we treat it as an animated background
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid"
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        if (data.data && data.data[0]) {
            setVisualUrl(data.data[0].url);
        } else {
            throw new Error("No image data returned from OpenAI");
        }

      } else {
        // --- MODE C: POLLINATIONS (Default Free) ---
        setEngineUsed("Pollinations (Free)");
        setIsVideo(false); // Pollinations returns Images, we will animate them via CSS
        
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 10000);
        
        // Using Pollinations Image Endpoint
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;
        
        const img = new Image();
        img.src = url;
        img.onload = () => setVisualUrl(url);
        img.onerror = () => { throw new Error("Pollinations failed to load"); }
      }
    } catch (error) {
      console.error("Gen Error:", error);
      setErrorMsg(error.message || "Failed to generate visual");
      setVisualUrl(`https://source.unsplash.com/1280x720/?bible,${book},ancient`);
      setEngineUsed("Unsplash (Error Fallback)");
      setIsVideo(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. AUDIO & PLAYBACK ENGINE ---
  const startPlayback = () => {
    if (!bibleText) return;
    
    setIsPlaying(true);
    
    // Start video loop if available
    if (videoRef.current) videoRef.current.play();

    if (audioEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(bibleText);
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Microsoft Guy") ||
        v.name.includes("Samantha")
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      const estimatedDuration = bibleText.split(' ').length * 350; // ms per word
      let startTime = Date.now();
      
      const updateProgress = () => {
        if (!window.speechSynthesis.speaking) return;
        
        const elapsed = Date.now() - startTime;
        const p = Math.min((elapsed / estimatedDuration) * 100, 100);
        setProgress(p);
        
        // Auto-scroll
        if (textContainerRef.current) {
          const maxScroll = textContainerRef.current.scrollHeight - textContainerRef.current.clientHeight;
          textContainerRef.current.scrollTo({
            top: (p / 100) * maxScroll,
            behavior: 'auto'
          });
        }

        if (p < 100) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setTimeout(() => {
        startTime = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }, 500);
      
    } else {
        alert("Audio narration not supported.");
    }
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    window.speechSynthesis.pause();
    if (videoRef.current) videoRef.current.pause();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const resumePlayback = () => {
    setIsPlaying(true);
    window.speechSynthesis.resume();
    if (videoRef.current) videoRef.current.play();
    const updateProgress = () => {
        if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) return;
        setProgress(prev => Math.min(prev + 0.05, 100));
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    };
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelSpeech = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      if (window.speechSynthesis.paused && speechRef.current) {
        resumePlayback();
      } else {
        startPlayback();
      }
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center">
      
      {/* HEADER */}
      <header className="w-full bg-zinc-900 border-b border-zinc-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-2">
          <BookOpen className="text-red-600 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">Scriptura <span className="font-light text-gray-400">Engine</span></h1>
        </div>

        <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-zinc-700">
          <select 
            value={selectedBook} 
            onChange={(e) => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
            className="bg-transparent text-white text-sm font-bold p-2 focus:outline-none cursor-pointer"
          >
            {BIBLE_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="w-px h-6 bg-zinc-700"></div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 pl-2">CH</span>
            <input 
              type="number" 
              min="1" 
              max="150" 
              value={selectedChapter} 
              onChange={(e) => setSelectedChapter(parseInt(e.target.value) || 1)}
              className="bg-transparent text-white text-sm font-bold w-12 p-2 text-center focus:outline-none"
            />
          </div>
          <button 
            onClick={() => { setSelectedChapter(prev => prev + 1)}} 
            className="p-2 hover:bg-zinc-700 rounded transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="flex-grow w-full max-w-6xl p-4 md:p-8 flex flex-col items-center justify-center">
        
        <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 group">
          
          {/* 1. VISUAL LAYER */}
          <div className="absolute inset-0 z-0">
             {isLoading || !visualUrl ? (
               <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                 <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                 <p className="text-gray-500 animate-pulse text-xs tracking-widest uppercase">
                    Generating Visuals ({engineUsed})...
                 </p>
                 {errorMsg && (
                    <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs bg-amber-900/20 px-4 py-2 rounded">
                        <AlertTriangle className="w-4 h-4" />
                        {errorMsg}
                    </div>
                 )}
               </div>
             ) : (
                <>
                  {isVideo ? (
                    <video
                        ref={videoRef}
                        src={visualUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                    />
                  ) : (
                    <div 
                        className={`w-full h-full bg-cover bg-center transition-transform duration-[60s] ease-linear ${isPlaying ? 'scale-125' : 'scale-100'}`}
                        style={{ backgroundImage: `url('${visualUrl}')` }}
                    ></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60"></div>
                </>
             )}
          </div>

          {/* 2. TEXT LAYER */}
          {!isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-20 px-8 md:px-20 text-center pointer-events-none">
                <div className="mb-6 transition-opacity duration-500" style={{ opacity: isPlaying ? 0.3 : 1 }}>
                    <h2 className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase mb-2">{selectedBook}</h2>
                    <h1 className="text-4xl md:text-6xl font-serif text-white mb-4 tracking-tighter shadow-black drop-shadow-2xl">Chapter {selectedChapter}</h1>
                </div>
                
                <div 
                    ref={textContainerRef}
                    className="h-48 md:h-56 w-full overflow-hidden relative mask-linear-fade"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
                >
                    <p className="text-xl md:text-3xl font-serif text-gray-100 leading-relaxed max-w-4xl mx-auto py-10 transition-all duration-500 drop-shadow-md">
                        {bibleText}
                    </p>
                </div>
            </div>
          )}

          {/* 3. CONTROLS LAYER */}
          <div className={`absolute bottom-0 w-full z-20 bg-gradient-to-t from-black to-transparent pt-20 pb-4 px-6 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
             <div className="w-full h-1 bg-gray-800 rounded-full mb-4 overflow-hidden cursor-pointer" onClick={(e) => {
                 // Seek logic
             }}>
                <div className="h-full bg-red-600 transition-all duration-200 ease-linear" style={{ width: `${progress}%` }}></div>
             </div>

             <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={togglePlay}
                        className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-white">
                            {isPlaying ? "Playing" : "Ready"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            Engine: {engineUsed}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className="text-gray-400 hover:text-white transition">
                        {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                </div>
             </div>
          </div>

        </div>

      </main>
    </div>
  );
}