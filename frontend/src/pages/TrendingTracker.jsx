import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Flag, Search, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowButton from '../components/GlowButton';
import GlassInput from '../components/GlassInput';
import NeonCard from '../components/NeonCard';
import GlassSelect from '../components/GlassSelect';

export default function TrendingTracker() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reporting Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Fake News');
  const [reportUrl, setReportUrl] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Fetch trending list
  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/trending');
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (err) {
      console.error('Failed to load trending alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportTitle) return;

    setIsReporting(true);
    setReportSuccess(false);

    try {
      const res = await fetch('/api/trending/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle,
          category: reportCategory,
          url: reportUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStories(data.trending);
        setReportTitle('');
        setReportUrl('');
        setReportSuccess(true);
        setTimeout(() => setReportSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReporting(false);
    }
  };

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Viral Disinformation Tracker</h1>
        <p className="text-slate-400 mt-1">Real-time indicators of viral fake news campaigns, domain sources, shares counts, and fact-checker responses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Trending Stories List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-4">
            <GlassInput
              type="text"
              label="Search Claims"
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search viral claims or categories (e.g. Satire, Propaganda)..."
              className="flex-1 mb-0"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 text-sm">Fetching trending indicators...</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="py-20 text-center border border-slate-900 rounded-2xl bg-slate-950/20">
              <p className="text-slate-500 text-sm">No trending claims match your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStories.map((story) => (
                <GlassCard key={story.id} className="border border-white/5 hover:border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        story.category === 'Propaganda' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                        story.category === 'Fake News' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        story.category === 'Misleading News' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        story.category === 'Satire' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      }`}>
                        {story.category}
                      </span>
                      <span className="text-slate-500 text-xs">Logged: {story.date}</span>
                    </div>

                    <h3 className="font-bold text-slate-200 text-sm sm:text-base leading-snug">
                      {story.title}
                    </h3>

                    {/* Debunk paragraph */}
                    <div className="flex items-start gap-2 bg-[#090a10] border border-slate-900 rounded-xl p-3 text-xs text-indigo-300">
                      <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{story.verification}</span>
                    </div>
                  </div>

                  {/* Share Stats */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t border-slate-900 md:border-t-0 pt-3 md:pt-0 gap-2">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Social Velocity</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TrendingUp className="h-4 w-4 text-red-400" />
                        <span className="font-black text-slate-200">{story.shares} Shares</span>
                      </div>
                    </div>

                    <div className="text-right mt-1">
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold">Credibility Score</span>
                      <span className={`text-xs font-black ${
                        story.credibility > 75 ? 'text-emerald-400' :
                        story.credibility > 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {story.credibility}/100
                      </span>
                    </div>
                  </div>

                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Reporting Flag Box */}
        <div className="lg:col-span-4">
          <NeonCard className="bg-cyber-card space-y-6">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-indigo-400" />
              <h3 className="font-extrabold text-slate-200">Flag Viral Rumors</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Discovered a trending news story on social platforms that seems fabricated or highly misleading? Flag it here to log the claim under review.
            </p>

            {reportSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Story successfully logged for review.</span>
              </div>
            )}

            <form onSubmit={handleReport} className="space-y-4">
              <GlassInput
                type="text"
                required
                label="Claim/Title"
                icon={Flag}
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Paste headline or specific claim..."
              />

              <GlassInput
                type="url"
                label="Source Link (Optional)"
                icon={Search}
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="https://social-post-link.com"
              />

              <GlassSelect
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                label="Suspected Category"
                className="mb-4"
              >
                <option value="Fake News">Fake News</option>
                <option value="Propaganda">Propaganda</option>
                <option value="Clickbait">Clickbait</option>
                <option value="Misleading News">Misleading News</option>
                <option value="Satire">Satire</option>
              </GlassSelect>

              <GlowButton
                type="submit"
                disabled={isReporting}
                className="w-full mt-4"
                variant="indigo"
              >
                {isReporting ? 'Logging...' : 'Flag and Report Story'}
              </GlowButton>
            </form>
          </NeonCard>
        </div>

      </div>

    </div>
  );
}
