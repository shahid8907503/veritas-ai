import React, { useState, useEffect } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { BarChart3, PieChart, TrendingUp, ShieldAlert, Award, Calendar, FolderHeart } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import OrbitLoader from '../components/OrbitLoader';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function Analytics({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        } else {
          setError('Failed to fetch analytics statistics.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error, unable to fetch statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center min-h-[400px]">
        <OrbitLoader 
          statusText="Aggregating news metrics..." 
          subtitle="Loading chart visualizations & model parameters..." 
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-red-400 font-semibold bg-red-500/5 border border-red-500/10 rounded-2xl max-w-md mx-auto">
        <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-red-500" />
        <p>{error || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  const { summary } = data;

  // 1. Doughnut Chart: Real vs Fake Distribution
  const doughnutData = {
    labels: ['Authentic', 'Manipulated/Fake'],
    datasets: [
      {
        data: [summary.realCount || 12, summary.fakeCount || 24],
        backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
        borderWidth: 1.5,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
      }
    }
  };

  // 2. Bar Chart: Category distribution
  const barData = {
    labels: summary.categoryDistribution.map(c => c.name),
    datasets: [
      {
        label: 'Articles Count',
        data: summary.categoryDistribution.map(c => c.value),
        backgroundColor: [
          'rgba(16, 185, 129, 0.6)', // Real
          'rgba(239, 68, 68, 0.6)', // Fake
          'rgba(245, 158, 11, 0.6)', // Misleading
          'rgba(139, 92, 246, 0.6)', // Clickbait
          'rgba(236, 72, 153, 0.6)', // Propaganda
          'rgba(6, 182, 212, 0.6)'   // Satire
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(6, 182, 212)'
        ],
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', stepSize: 1 }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 3. Line Chart: Detection Trends Over Time
  const lineData = {
    labels: summary.monthlyTrends.map(t => t.month),
    datasets: [
      {
        label: 'Scans Done',
        data: summary.monthlyTrends.map(t => t.scans),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
      {
        label: 'Avg Trust Score (%)',
        data: summary.monthlyTrends.map(t => t.averageAuthenticity),
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(6, 182, 212)',
        pointBorderColor: '#fff',
        pointRadius: 4,
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Analytics Portal</h1>
        <p className="text-slate-400 mt-1">Review statistical spreads of categorized articles, monthly user volumes, and confidence distribution mappings.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-5 border border-white/5">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Evaluated</span>
            <span className="text-3xl font-black text-slate-100">{summary.totalScans || 36}</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-5 border border-white/5">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">Authentic Checked</span>
            <span className="text-3xl font-black text-slate-100">{summary.realCount || 12}</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-5 border border-white/5">
          <div className="p-4 bg-red-500/10 rounded-2xl text-red-400 border border-red-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider">Manipulated Flags</span>
            <span className="text-3xl font-black text-slate-100">{summary.fakeCount || 24}</span>
          </div>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Real vs Fake Ratio (Doughnut) */}
        <div className="lg:col-span-4 h-full">
          <GlassCard className="border border-white/5 flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-400" /> Authenticity Split
            </h3>
            <div className="relative h-64 w-full flex-1">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </GlassCard>
        </div>

        {/* Category breakdown (Bar) */}
        <div className="lg:col-span-8 h-full">
          <GlassCard className="border border-white/5 flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <FolderHeart className="h-4 w-4 text-indigo-400" /> Label Frequency Distribution
            </h3>
            <div className="relative h-64 w-full flex-1">
              <Bar data={barData} options={barOptions} />
            </div>
          </GlassCard>
        </div>

        {/* Trends over time (Line) */}
        <div className="lg:col-span-12">
          <GlassCard className="border border-white/5">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" /> Monthly Scan Volume & Average Integrity Trends
            </h3>
            <div className="relative h-80 w-full">
              <Line data={lineData} options={lineOptions} />
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
