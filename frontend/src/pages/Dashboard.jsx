import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, FileText, Globe, MessageSquare, Upload, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { Bar } from 'react-chartjs-2';
import GlowButton from '../components/GlowButton';
import GlassInput from '../components/GlassInput';
import OrbitLoader from '../components/OrbitLoader';
import NeonCard from '../components/NeonCard';
import GlassSelect from '../components/GlassSelect';
import GlassTextarea from '../components/GlassTextarea';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard({ token, user }) {
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [modelPreference, setModelPreference] = useState(user?.modelPreference || 'Random Forest');

  // Scanner Loading States
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanSteps, setScanSteps] = useState([
    'Cleaning text & tokenizing...',
    'Extracting POS tags & sentiment...',
    'Performing Named Entity Recognition...',
    'Querying selected ML models...',
    'Calculating keyword weights & XAI indicators...'
  ]);

  // Results State
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Handle Text Changes
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  // File Upload Helper
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.txt')) {
      reader.onload = (event) => {
        setInputText(event.target.result);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
      // Simulate PDF parsing
      setIsScanning(true);
      setScanStep(0);
      const interval = setInterval(() => {
        setScanStep((prev) => {
          if (prev >= scanSteps.length - 1) {
            clearInterval(interval);
            setIsScanning(false);
            setInputText(
              "BREAKING: Local government secret archives leaked online. Leaked documents prove that planetary alignment completely reversed global temperatures within 24 hours. The engineered crisis was hidden from public to prevent panic. Citizens are advised to seek alternative truth websites for updates."
            );
            return 0;
          }
          return prev + 1;
        });
      }, 600);
    } else {
      setError('Unsupported file format. Please upload a .txt or .pdf file.');
    }
  };

  // Run Analysis Pipeline
  const runAnalysis = async () => {
    if (activeTab === 'url' && !inputUrl) {
      setError('Please provide a news article URL.');
      return;
    }
    if (activeTab !== 'url' && inputText.trim().length < 20) {
      setError('Please enter at least 20 characters of news text.');
      return;
    }

    setError('');
    setIsScanning(true);
    setScanStep(0);
    setResults(null);

    // Simulate scanning delays for high-fidelity feel
    const stepInterval = 450; 
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep += 1;
      if (currentStep < scanSteps.length) {
        setScanStep(currentStep);
      } else {
        clearInterval(timer);
      }
    }, stepInterval);

    try {
      let submissionText = inputText;
      if (activeTab === 'url') {
        // Mock scraped text from URL
        submissionText = `LEAKED REPORT: Health ministry secretly advises eating raw onions to build 100% immunity against viruses. You won't believe how simple trick works. Officials are shocked by what happens next. A secret plot has been engineered to suppress this natural cure.`;
        if (inputUrl.includes('government') || inputUrl.includes('gov') || inputUrl.includes('bbc')) {
          submissionText = `The national space agency successfully launched its latest weather monitoring satellite today. Environmental scientists confirmed that high-resolution sensors will monitor oceanic currents and hurricane structures, providing crucial public data.`;
        }
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          text: submissionText,
          url: activeTab === 'url' ? inputUrl : null,
          modelPreference
        })
      });

      const data = await res.json();
      
      // Stop scanner animation and render
      setTimeout(() => {
        if (res.ok) {
          setResults(data);
        } else {
          setError(data.message || 'An error occurred during scanning.');
        }
        setIsScanning(false);
      }, stepInterval * (scanSteps.length - currentStep) + 200);

    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setError('Failed to reach detection servers. Please check your connection.');
        setIsScanning(false);
      }, 1500);
    }
  };

  // Highlight color maps
  const getHighlightClass = (type) => {
    switch (type) {
      case 'clickbait': return 'highlight-clickbait';
      case 'propaganda': return 'highlight-propaganda';
      case 'emotional': return 'highlight-emotional';
      default: return '';
    }
  };

  // Color mappings for Category badge
  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'Real News': return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: ShieldCheck, color: 'rgb(16, 185, 129)' };
      case 'Fake News': return { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: ShieldAlert, color: 'rgb(239, 68, 68)' };
      case 'Misleading News': return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle, color: 'rgb(245, 158, 11)' };
      case 'Clickbait': return { bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: AlertCircle, color: 'rgb(139, 92, 246)' };
      case 'Propaganda': return { bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: ShieldAlert, color: 'rgb(236, 72, 153)' };
      default: return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: HelpCircle, color: 'rgb(6, 182, 212)' };
    }
  };

  // Chart data setup for Model comparisons
  const getChartData = () => {
    if (!results) return null;
    
    return {
      labels: results.modelComparisons.map(m => m.name),
      datasets: [
        {
          label: 'Prediction Confidence (%)',
          data: results.modelComparisons.map(m => m.confidence),
          backgroundColor: results.modelComparisons.map(m => {
            const val = m.confidence;
            if (results.category === 'Real News') {
              return 'rgba(16, 185, 129, 0.6)'; // emerald green
            } else if (results.category === 'Fake News' || results.category === 'Propaganda') {
              return 'rgba(239, 68, 68, 0.6)'; // red
            } else {
              return 'rgba(99, 102, 241, 0.6)'; // indigo default
            }
          }),
          borderColor: results.modelComparisons.map(m => {
            if (results.category === 'Real News') return 'rgb(16, 185, 129)';
            if (results.category === 'Fake News' || results.category === 'Propaganda') return 'rgb(239, 68, 68)';
            return 'rgb(99, 102, 241)';
          }),
          borderWidth: 1.5,
          borderRadius: 8,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    indexAxis: 'y', // horizontal bar chart
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Confidence: ${ctx.raw}%`
        }
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <CheckCircle2 className="h-3.5 w-3.5" /> Explainable Deep NLP Classifier
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Verify News Authenticity with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Explainable AI
          </span>
        </h1>
        <p className="text-slate-400 md:text-lg">
          Paste article content, URLs, or documents. Our hybrid AI service flags conspiracies, emotional framing, and clickbait with instant semantic highlights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="border border-white/5 bg-cyber-card" id="analyzer-card">
            
            {/* Model Selection Selector */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
              <span className="text-sm font-semibold text-slate-300">Default Target Model</span>
              <GlassSelect
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value)}
                className="mb-0 max-w-xs"
              >
                <option value="Random Forest">Random Forest (Fast & Robust)</option>
                <option value="Logistic Regression">Logistic Regression (Linear Classifier)</option>
                <option value="Naive Bayes">Naive Bayes (Lexical Probabilities)</option>
                <option value="BERT">BERT Transformer (Context-Aware)</option>
                <option value="RoBERTa">RoBERTa (Advanced Transformer)</option>
              </GlassSelect>
            </div>

            {/* Input Form Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-950 p-1.5 rounded-xl border border-slate-900/50">
              {[
                { id: 'text', name: 'Text Manual', icon: FileText },
                { id: 'url', name: 'URL Link', icon: Globe },
                { id: 'file', name: 'Upload Doc', icon: Upload },
                { id: 'social', name: 'Social Post', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <GlassTextarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste the full body text of the news article here (minimum 20 characters)..."
                  height="h-60"
                  className="mb-2"
                />
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{wordCount} words | {inputText.length} characters</span>
                  <span>Min recommended: 30 words</span>
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="space-y-4 py-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <GlassInput
                    type="url"
                    label="Article URL Link"
                    icon={Globe}
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example-news-site.com/article-slug"
                    className="text-left"
                  />
                  <p className="text-xs text-slate-500">
                    We will parse metadata, scrape visible article text, and verify domain trust logs.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'file' && (
              <div className="py-6">
                <label className="flex flex-col items-center justify-center w-full h-44 border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/40 rounded-2xl cursor-pointer hover:bg-slate-950/60 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center space-y-2">
                    <Upload className="h-8 w-8 text-indigo-400 animate-bounce" />
                    <p className="text-sm font-semibold text-slate-300">
                      {fileName ? `Loaded: ${fileName}` : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-xs text-slate-500">TXT or PDF formats supported (Max 5MB)</p>
                  </div>
                  <input type="file" accept=".txt,.pdf" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-4">
                <GlassTextarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste viral Twitter/X, Facebook, or Reddit news copy here..."
                  height="h-44"
                  className="mb-2"
                />
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Hashtags and structural patterns will be parsed for viral velocity indicators.</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold animate-pulse mt-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <GlowButton
              onClick={runAnalysis}
              disabled={isScanning}
              className="w-full mt-6"
              variant="indigo"
            >
              Analyze News Article <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
            </GlowButton>

          </GlassCard>
        </div>

        {/* Right Side: Loaders or Results Dashboard */}
        <div className="lg:col-span-5 h-full">
          {/* Scanning/Loading Panel */}
          {isScanning && (
            <NeonCard className="flex flex-col justify-center items-center py-20 min-h-[460px]" containerClassName="h-full">
              <OrbitLoader 
                statusText={scanSteps[scanStep]} 
                subtitle={`Step ${scanStep + 1} of ${scanSteps.length}: executing linguistic parsing...`}
              />
              <div className="mt-8 space-y-1.5 text-center max-w-xs w-full bg-slate-950/40 p-4 rounded-xl border border-white/5">
                {scanSteps.map((step, idx) => (
                  <p
                    key={idx}
                    className={`text-[10px] transition-all duration-300 ${
                      idx === scanStep ? 'text-indigo-400 font-bold opacity-100 scale-105' :
                      idx < scanStep ? 'text-emerald-450/60 line-through opacity-40' : 'text-slate-600 opacity-30'
                    }`}
                  >
                    {step}
                  </p>
                ))}
              </div>
            </NeonCard>
          )}

          {/* Idle Panel */}
          {!isScanning && !results && (
            <GlassCard className="flex flex-col justify-center items-center text-center p-12 min-h-[460px] border border-dashed border-slate-800 bg-[#0a0b10]/20">
              <div className="p-4 bg-indigo-950/30 rounded-2xl border border-indigo-500/10 text-indigo-400/80 mb-4">
                <ShieldCheck className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-300">Ready for Scans</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                Submit text on the left to activate deep learning analytics, explainable highlights, and fact credibility indices.
              </p>
            </GlassCard>
          )}

          {/* Analysis Results Visualizer */}
          {!isScanning && results && (
            <div className="space-y-6">
              
              {/* Score card */}
              <GlassCard className="border border-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Classification</h3>
                    
                    {/* Dynamic Category Badge */}
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getCategoryTheme(results.category).bg}`}>
                      {React.createElement(getCategoryTheme(results.category).icon, { className: "h-3.5 w-3.5" })}
                      {results.category}
                    </div>
                  </div>

                  {/* Authenticity Score Circle */}
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-900"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="transition-all duration-1000"
                        strokeWidth="3.2"
                        strokeDasharray={`${results.authenticityScore}, 100`}
                        strokeLinecap="round"
                        stroke={getCategoryTheme(results.category).color}
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-black text-slate-100">{results.authenticityScore}%</span>
                      <span className="block text-[8px] text-slate-500 font-medium leading-none uppercase">Trust</span>
                    </div>
                  </div>
                </div>

                {/* Simplified language reasoning */}
                <div className="bg-[#0b0c13] border border-slate-900 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-200">AI Verdict:</span> {results.reasoning}
                </div>
              </GlassCard>

              {/* Source Credibility Module (renders if URL exists) */}
              {results.sourceCredibility && (
                <GlassCard className="border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source Credibility Index</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0b0c13] border border-slate-900 rounded-xl p-3 text-center">
                      <span className="block text-[9px] text-slate-500 uppercase font-semibold">Domain Trust</span>
                      <span className={`text-lg font-black ${
                        results.sourceCredibility.trustScore > 80 ? 'text-emerald-400' :
                        results.sourceCredibility.trustScore > 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {results.sourceCredibility.trustScore}/100
                      </span>
                    </div>
                    
                    <div className="bg-[#0b0c13] border border-slate-900 rounded-xl p-3 text-center">
                      <span className="block text-[9px] text-slate-500 uppercase font-semibold">Reputation</span>
                      <span className="text-sm font-bold text-slate-200 mt-1 block">
                        {results.sourceCredibility.domainReputation}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 px-1 border-t border-slate-900/60 pt-3">
                    <span>Domain: <strong className="text-slate-300">{results.sourceCredibility.domain}</strong></span>
                    <span>HTTPS Secure: <strong className={results.sourceCredibility.https ? 'text-emerald-400' : 'text-red-400'}>
                      {results.sourceCredibility.https ? 'Yes' : 'No'}
                    </strong></span>
                  </div>
                </GlassCard>
              )}

              {/* XAI Highlighted Sentence Viewer */}
              {results.explainableAi?.highlightedPhrases?.length > 0 && (
                <GlassCard className="border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Suspicious Phrases Flagged
                  </h4>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
                    {results.explainableAi.highlightedPhrases.map((phrase, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border leading-relaxed ${
                          phrase.type === 'clickbait' ? 'bg-violet-950/20 border-violet-850/50 text-violet-300' :
                          phrase.type === 'propaganda' ? 'bg-pink-950/20 border-pink-850/50 text-pink-300' :
                          'bg-red-950/20 border-red-850/50 text-red-300'
                        }`}
                      >
                        <span className="font-semibold capitalize block text-[9px] text-slate-400 mb-0.5">{phrase.type} Hook:</span>
                        "{phrase.text}"
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Influential Keywords */}
              {results.explainableAi?.topKeywords?.length > 0 && (
                <GlassCard className="border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Influential Feature Weights</h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {results.explainableAi.topKeywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0b0c13] border border-slate-900 rounded-xl px-3 py-2 flex items-center gap-2"
                      >
                        <span className="text-xs text-slate-200 font-semibold">{kw.word}</span>
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          {kw.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Models comparison chart */}
              <GlassCard className="border border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classifier Consistency Matrix</h4>
                <div className="h-56">
                  <Bar data={getChartData()} options={chartOptions} />
                </div>
              </GlassCard>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
