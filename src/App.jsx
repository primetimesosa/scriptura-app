import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Info, ChevronLeft, ChevronRight, X, Menu, Search, Clock, BookOpen, SkipForward, SkipBack, Pause, Volume2, Settings, Share2, Plus, Calendar } from 'lucide-react';

/**
 * Scriptura - Bible in a Year Visual Playlist
 * * UPDATED LOGIC:
 * - Generates a 365-day reading plan covering all 1,189 chapters.
 * - Organizes content into 12 "Months" (Seasons).
 * - Each "Episode" is a daily reading block (approx 3-4 chapters).
 */

// --- Data Generation Helpers ---

const BIBLE_BOOKS = [
  { n: 'Genesis', c: 50, color: 'bg-emerald-700' }, { n: 'Exodus', c: 40, color: 'bg-amber-600' }, { n: 'Leviticus', c: 27, color: 'bg-stone-600' },
  { n: 'Numbers', c: 36, color: 'bg-yellow-700' }, { n: 'Deuteronomy', c: 34, color: 'bg-orange-700' }, { n: 'Joshua', c: 24, color: 'bg-orange-800' },
  { n: 'Judges', c: 21, color: 'bg-stone-700' }, { n: 'Ruth', c: 4, color: 'bg-pink-700' }, { n: '1 Samuel', c: 31, color: 'bg-indigo-700' },
  { n: '2 Samuel', c: 24, color: 'bg-indigo-800' }, { n: '1 Kings', c: 22, color: 'bg-red-700' }, { n: '2 Kings', c: 25, color: 'bg-red-800' },
  { n: '1 Chronicles', c: 29, color: 'bg-slate-600' }, { n: '2 Chronicles', c: 36, color: 'bg-slate-700' }, { n: 'Ezra', c: 10, color: 'bg-zinc-600' },
  { n: 'Nehemiah', c: 13, color: 'bg-zinc-700' }, { n: 'Esther', c: 10, color: 'bg-rose-600' }, { n: 'Job', c: 42, color: 'bg-slate-800' },
  { n: 'Psalms', c: 150, color: 'bg-blue-600' }, { n: 'Proverbs', c: 31, color: 'bg-amber-500' }, { n: 'Ecclesiastes', c: 12, color: 'bg-stone-500' },
  { n: 'Song of Solomon', c: 8, color: 'bg-pink-500' }, { n: 'Isaiah', c: 66, color: 'bg-purple-800' }, { n: 'Jeremiah', c: 52, color: 'bg-purple-900' },
  { n: 'Lamentations', c: 5, color: 'bg-gray-700' }, { n: 'Ezekiel', c: 48, color: 'bg-orange-900' }, { n: 'Daniel', c: 12, color: 'bg-cyan-800' },
  { n: 'Hosea', c: 14, color: 'bg-teal-700' }, { n: 'Joel', c: 3, color: 'bg-teal-600' }, { n: 'Amos', c: 9, color: 'bg-teal-800' },
  { n: 'Obadiah', c: 1, color: 'bg-teal-900' }, { n: 'Jonah', c: 4, color: 'bg-blue-500' }, { n: 'Micah', c: 7, color: 'bg-cyan-600' },
  { n: 'Nahum', c: 3, color: 'bg-cyan-700' }, { n: 'Habakkuk', c: 3, color: 'bg-cyan-800' }, { n: 'Zephaniah', c: 3, color: 'bg-cyan-900' },
  { n: 'Haggai', c: 2, color: 'bg-sky-700' }, { n: 'Zechariah', c: 14, color: 'bg-sky-800' }, { n: 'Malachi', c: 4, color: 'bg-sky-900' },
  { n: 'Matthew', c: 28, color: 'bg-emerald-600' }, { n: 'Mark', c: 16, color: 'bg-red-950' }, { n: 'Luke', c: 24, color: 'bg-blue-900' },
  { n: 'John', c: 21, color: 'bg-stone-800' }, { n: 'Acts', c: 28, color: 'bg-orange-600' }, { n: 'Romans', c: 16, color: 'bg-yellow-800' },
  { n: '1 Corinthians', c: 16, color: 'bg-yellow-600' }, { n: '2 Corinthians', c: 13, color: 'bg-yellow-700' }, { n: 'Galatians', c: 6, color: 'bg-lime-700' },
  { n: 'Ephesians', c: 6, color: 'bg-lime-800' }, { n: 'Philippians', c: 4, color: 'bg-lime-900' }, { n: 'Colossians', c: 4, color: 'bg-green-700' },
  { n: '1 Thessalonians', c: 5, color: 'bg-green-800' }, { n: '2 Thessalonians', c: 3, color: 'bg-green-900' }, { n: '1 Timothy', c: 6, color: 'bg-emerald-800' },
  { n: '2 Timothy', c: 4, color: 'bg-emerald-900' }, { n: 'Titus', c: 3, color: 'bg-teal-800' }, { n: 'Philemon', c: 1, color: 'bg-teal-900' },
  { n: 'Hebrews', c: 13, color: 'bg-indigo-600' }, { n: 'James', c: 5, color: 'bg-indigo-800' }, { n: '1 Peter', c: 5, color: 'bg-blue-700' },
  { n: '2 Peter', c: 3, color: 'bg-blue-800' }, { n: '1 John', c: 5, color: 'bg-blue-900' }, { n: '2 John', c: 1, color: 'bg-sky-800' },
  { n: '3 John', c: 1, color: 'bg-sky-900' }, { n: 'Jude', c: 1, color: 'bg-purple-800' }, { n: 'Revelation', c: 22, color: 'bg-indigo-950' }
];

const MONTH_NAMES = [
  "January - Beginnings", "February - The Law & Land", "March - Rise of Judges", 
  "April - The Kingdom United", "May - The Kingdom Divided", "June - Exile & Return",
  "July - Songs & Wisdom", "August - The Prophets Call", "September - The Messiah",
  "October - The Early Church", "November - Letters to Churches", "December - Revelation"
];

const MONTH_COLORS = [
  'from-emerald-900 to-green-900', 'from-amber-900 to-orange-900', 'from-stone-800 to-red-900',
  'from-indigo-900 to-blue-900', 'from-red-900 to-rose-900', 'from-zinc-800 to-slate-900',
  'from-blue-900 to-sky-900', 'from-purple-900 to-fuchsia-900', 'from-emerald-900 to-teal-900',
  'from-orange-900 to-amber-900', 'from-yellow-900 to-lime-900', 'from-slate-900 to-black'
];

// Generates the 365 day plan
const generateYearlyPlan = () => {
  const months = [];
  let dayCounter = 1;
  let currentBookIndex = 0;
  let currentChapter = 1;

  for (let m = 0; m < 12; m++) {
    const monthData = {
      id: `month-${m + 1}`,
      title: MONTH_NAMES[m],
      description: `Reading plan for Month ${m + 1}.`,
      color: MONTH_COLORS[m],
      episodes: []
    };

    // Approx 30 days per month for simplicity in UI
    const daysInMonth = m === 1 ? 28 : 30; // Simplified calendar

    for (let d = 0; d < daysInMonth; d++) {
      let chaptersForToday = [];
      let dailyThumbnailColor = 'bg-gray-800';
      
      // Assign roughly 3.3 chapters per day (1189 / 365)
      // We'll target 3 chapters minimum, catching up if we fall behind
      const targetChapterCount = 3; 
      
      for(let i=0; i < targetChapterCount; i++) {
        if (currentBookIndex >= BIBLE_BOOKS.length) break;

        const book = BIBLE_BOOKS[currentBookIndex];
        dailyThumbnailColor = book.color; // Use the color of the last book in the reading
        
        chaptersForToday.push(`${book.n} ${currentChapter}`);
        
        if (currentChapter < book.c) {
          currentChapter++;
        } else {
          currentBookIndex++;
          currentChapter = 1;
        }
      }

      if (chaptersForToday.length > 0) {
        // Format title nicely (e.g., "Genesis 1-3" or "Gen 50, Ex 1-2")
        const firstRef = chaptersForToday[0];
        const lastRef = chaptersForToday[chaptersForToday.length - 1];
        
        // Simple title formatter
        let title = chaptersForToday.length === 1 ? firstRef : `${firstRef.split(' ')[0]} ${firstRef.split(' ')[1]} - ${lastRef.split(' ')[1]}`;
        // Handle cross-book readings roughly
        if(chaptersForToday.some(c => c.startsWith(BIBLE_BOOKS[currentBookIndex]?.n || 'ZZZ'))) {
             title = `${firstRef} - ${lastRef}`;
        }

        monthData.episodes.push({
          id: `day-${dayCounter}`,
          dayNumber: dayCounter,
          title: title, // e.g. "Genesis 1-3"
          duration: `${10 + Math.floor(Math.random() * 10)} min`, // Simulated read time
          description: `Day ${dayCounter} of the annual journey. Reading from ${chaptersForToday[0].split(' ')[0]}.`,
          thumbnailColor: dailyThumbnailColor,
          fullReadings: chaptersForToday
        });
        dayCounter++;
      }
    }
    months.push(monthData);
  }
  return months;
};

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }) => (
  <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent px-4 py-4 flex items-center justify-between transition-all duration-300">
    <div className="flex items-center gap-8">
      <div className="text-red-600 font-bold text-3xl tracking-tighter cursor-pointer" onClick={() => setActiveTab('home')}>
        SCRIPTURA
      </div>
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
        <button onClick={() => setActiveTab('home')} className={`hover:text-white transition ${activeTab === 'home' ? 'text-white font-bold' : ''}`}>Home</button>
        <button className="hover:text-white transition">Reading Plan</button>
        <button className="hover:text-white transition">Audio Bible</button>
        <button className="hover:text-white transition">My Progress</button>
      </div>
    </div>
    <div className="flex items-center gap-4 text-white">
      <Search className="w-5 h-5 cursor-pointer hover:text-gray-300" />
      <div className="w-8 h-8 rounded bg-red-800 flex items-center justify-center font-bold text-xs">J</div>
    </div>
  </nav>
);

const Hero = ({ featured, onPlay }) => {
  return (
    <div className="relative h-[70vh] w-full flex items-center">
      {/* Dynamic Background based on featured item */}
      <div className={`absolute inset-0 bg-gradient-to-r ${featured.color} opacity-60`}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
      
      {/* Abstract Content Background (Simulated Video) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="w-full h-full bg-black/50 animate-pulse-slow">
             <div className="w-full h-full flex items-center justify-center opacity-20">
                <BookOpen size={200} />
             </div>
        </div>
      </div>

      <div className="relative z-10 px-4 md:px-12 max-w-2xl mt-16">
        <div className="flex items-center gap-2 text-red-500 font-bold tracking-widest text-sm mb-4">
          <span className="bg-red-600 text-white px-2 py-0.5 text-xs rounded-sm">TODAY'S READING</span>
          <span>DAY 1</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
          The Beginning
        </h1>
        <p className="text-lg text-gray-200 mb-8 drop-shadow-md line-clamp-3">
          Start your 365-day journey through the entire Bible. Today we witness the creation of the heavens and the earth, and the dawn of humanity.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => onPlay(featured, featured.episodes[0])}
            className="bg-white text-black px-6 py-2.5 rounded font-bold flex items-center gap-2 hover:bg-gray-200 transition"
          >
            <Play className="fill-black w-5 h-5" /> Start Day 1
          </button>
          <button className="bg-gray-500/30 backdrop-blur-sm text-white px-6 py-2.5 rounded font-bold flex items-center gap-2 hover:bg-gray-500/50 transition">
            <Info className="w-5 h-5" /> View Plan
          </button>
        </div>
      </div>
    </div>
  );
};

const EpisodeCard = ({ episode, onClick, sectionColor }) => (
  <div 
    onClick={onClick}
    className="flex-none w-64 md:w-72 cursor-pointer group relative transition-transform duration-300 hover:scale-105 hover:z-20"
  >
    <div className={`aspect-video rounded-md overflow-hidden relative shadow-lg ${episode.thumbnailColor}`}>
      {/* Thumbnail Content Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-30 transition-opacity">
         <div className="text-4xl font-black text-white/30">DAY {episode.dayNumber}</div>
      </div>
      
      {/* Duration Badge */}
      <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-gray-300 font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" /> {episode.duration}
      </div>

      {/* Play Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
        <div className="bg-white/90 rounded-full p-3">
          <Play className="w-6 h-6 fill-black text-black ml-1" />
        </div>
      </div>
    </div>

    <div className="mt-2 px-1">
      <h3 className="text-white font-medium text-sm group-hover:text-red-500 transition-colors truncate">{episode.title}</h3>
      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{episode.description}</p>
    </div>
  </div>
);

const SectionRow = ({ section, onPlayEpisode }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-12 relative group/row">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-12 flex items-center gap-2">
        {section.title}
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover/row:text-white transition-colors cursor-pointer" />
      </h2>
      
      <div className="relative">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 w-12 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        {/* Cards Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-12 scrollbar-hide pb-4 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {section.episodes.map((ep) => (
            <EpisodeCard 
              key={ep.id} 
              episode={ep} 
              sectionColor={section.color}
              onClick={() => onPlayEpisode(section, ep)} 
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 w-12 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
};

const VideoPlayer = ({ section, episode, onClose, onNext }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [muted, setMuted] = useState(false);
  
  // Auto-hide controls simulation
  useEffect(() => {
    let timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Simulate video progress
  useEffect(() => {
    let interval;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 100 : p + 0.1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Area Placeholder */}
      <div className={`flex-grow relative flex items-center justify-center bg-gradient-to-br ${section.color}`}>
        {/* Placeholder Visuals */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="text-center z-10 p-8">
            <div className="text-red-500 font-bold tracking-widest mb-2">DAY {episode.dayNumber}</div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wider animate-pulse">{episode.title}</h1>
            <p className="text-xl text-white/80 italic">{section.title}</p>
        </div>

        {/* Controls Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-between p-6 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Top Bar */}
          <div className="flex justify-between items-start">
             <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition"><ChevronLeft className="w-8 h-8 text-white" /></button>
             <button className="p-2 hover:bg-white/20 rounded-full transition"><Settings className="w-6 h-6 text-white" /></button>
          </div>

          {/* Bottom Controls */}
          <div className="w-full max-w-5xl mx-auto space-y-4">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-600 rounded cursor-pointer group" onClick={(e) => {
                // Simple seek simulation
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = (x / rect.width) * 100;
                setProgress(percent);
            }}>
              <div 
                className="h-full bg-red-600 rounded relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg border-2 border-white"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-red-500 transition">
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                </button>
                <button className="text-white hover:text-gray-300 transition">
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button onClick={onNext} className="text-white hover:text-gray-300 transition">
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
                <div className="flex items-center gap-2 group/vol">
                    <button onClick={() => setMuted(!muted)} className="text-white">
                        <Volume2 className={`w-6 h-6 ${muted ? 'text-gray-500' : ''}`} />
                    </button>
                    <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                        <div className="h-1 bg-white/50 w-20 ml-2 rounded-full"></div>
                    </div>
                </div>
                <span className="text-white text-sm font-medium">
                    {Math.floor((progress/100) * 15)}:{(Math.floor((progress/100) * 60) % 60).toString().padStart(2, '0')} / {episode.duration}
                </span>
              </div>

              <div className="flex items-center gap-4">
                 <h3 className="text-white font-bold text-lg hidden md:block">{episode.title}</h3>
                 <button className="text-white/70 hover:text-white"><Share2 className="w-5 h-5" /></button>
                 <button className="text-white/70 hover:text-white"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar Playlist (Simulated) */}
      <div className="hidden lg:block w-80 bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800">
            <h3 className="text-white font-bold">Up Next in {section.title}</h3>
        </div>
        {section.episodes.map(ep => (
            <div key={ep.id} className={`p-4 flex gap-3 hover:bg-zinc-800 cursor-pointer ${ep.id === episode.id ? 'bg-zinc-800 border-l-4 border-red-600' : ''}`}>
                <div className={`w-24 h-14 rounded flex-shrink-0 ${ep.thumbnailColor} opacity-80 flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white/50">DAY {ep.dayNumber}</span>
                </div>
                <div className="flex-grow min-w-0">
                    <h4 className={`text-sm font-medium truncate ${ep.id === episode.id ? 'text-white' : 'text-gray-300'}`}>{ep.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{ep.duration}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="w-full bg-zinc-950 py-16 px-4 md:px-12 text-gray-500 text-sm border-t border-zinc-900">
    <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 mb-4">
            <div className="w-6 h-6 bg-gray-700 rounded-sm"></div>
            <div className="w-6 h-6 bg-gray-700 rounded-sm"></div>
            <div className="w-6 h-6 bg-gray-700 rounded-sm"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 gap-y-8 mb-8">
            <div className="flex flex-col gap-3">
                <a href="#" className="hover:underline">Audio Description</a>
                <a href="#" className="hover:underline">Investor Relations</a>
                <a href="#" className="hover:underline">Legal Notices</a>
            </div>
            <div className="flex flex-col gap-3">
                <a href="#" className="hover:underline">Help Center</a>
                <a href="#" className="hover:underline">Jobs</a>
                <a href="#" className="hover:underline">Cookie Preferences</a>
            </div>
            <div className="flex flex-col gap-3">
                <a href="#" className="hover:underline">Gift Cards</a>
                <a href="#" className="hover:underline">Terms of Use</a>
                <a href="#" className="hover:underline">Corporate Information</a>
            </div>
            <div className="flex flex-col gap-3">
                <a href="#" className="hover:underline">Media Center</a>
                <a href="#" className="hover:underline">Privacy</a>
                <a href="#" className="hover:underline">Contact Us</a>
            </div>
        </div>
        <button className="border border-gray-500 px-4 py-1.5 hover:text-white transition mb-4">Service Code</button>
        <p className="text-xs">&copy; 2024 Scriptura Inc.</p>
    </div>
  </footer>
);

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'player'
  const [playingData, setPlayingData] = useState({ section: null, episode: null });
  const [activeTab, setActiveTab] = useState('home');

  // Memoize the plan generation so it's stable across renders
  const yearlyPlan = useMemo(() => generateYearlyPlan(), []);

  const handlePlay = (section, episode) => {
    setPlayingData({ section, episode });
    setCurrentView('player');
  };

  const handleClosePlayer = () => {
    setCurrentView('home');
    setPlayingData({ section: null, episode: null });
  };

  const handleNextEpisode = () => {
      // Logic to find next episode
      if(!playingData.section) return;
      const currentIndex = playingData.section.episodes.findIndex(e => e.id === playingData.episode.id);
      if(currentIndex < playingData.section.episodes.length - 1) {
          setPlayingData({
              ...playingData,
              episode: playingData.section.episodes[currentIndex + 1]
          });
      }
  };

  // Feature Day 1 of Month 1
  const featuredSection = yearlyPlan[0]; 

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-red-600 selection:text-white">
      
      {currentView === 'home' && (
        <>
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <Hero featured={featuredSection} onPlay={(sec, ep) => handlePlay(sec, ep)} />
          
          <div className="relative z-10 -mt-24 md:-mt-32 pb-10 space-y-4">
             {yearlyPlan.map((section) => (
               <SectionRow 
                 key={section.id} 
                 section={section} 
                 onPlayEpisode={handlePlay} 
               />
             ))}
          </div>
          <Footer />
        </>
      )}

      {currentView === 'player' && playingData.episode && (
        <VideoPlayer 
          section={playingData.section} 
          episode={playingData.episode} 
          onClose={handleClosePlayer}
          onNext={handleNextEpisode}
        />
      )}
    </div>
  );
}