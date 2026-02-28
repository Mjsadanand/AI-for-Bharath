import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { StatCard, Card, EmptyState, PageHeader, Skeleton } from '../../components/ui/Cards';
import { BookOpen, TrendingUp, Bookmark, Search, FlaskConical, Brain, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../../types';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ResearcherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/researcher').then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader
          icon={FlaskConical}
          title="Research Dashboard"
          description="Latest findings and trending topics"
          badge="Researcher"
          actions={
            <Link
              to="/research"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm shadow-primary-500/20"
            >
              <Search className="w-4 h-4" />
              Search Papers
            </Link>
          }
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Papers" value={stats.totalPapers || 0} icon={BookOpen} color="blue" />
        <StatCard title="Saved Papers" value={stats.savedPapers || 0} icon={Bookmark} color="green" />
        <StatCard title="Trending Topics" value={stats.trendingTopics || 0} icon={TrendingUp} color="purple" />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Trending Topics" icon={TrendingUp}>
          {data?.trendingTopicsData && data.trendingTopicsData.length > 0 ? (
            <div className="space-y-2">
              {data.trendingTopicsData.map((topic: { _id?: string; keyword?: string; count: number }, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-xs font-bold text-primary-700">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{topic._id || topic.keyword}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{topic.count} papers</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No trending topics" description="Research trends will appear as papers are indexed." />
          )}
        </Card>

        <Card title="Quick Actions" icon={BookOpen}>
          <div className="space-y-3">
            <Link to="/research" className="group flex items-center gap-4 p-4 rounded-xl bg-blue-50/80 border border-blue-100 hover:border-blue-200 transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-800">Browse Research Papers</p>
                <p className="text-xs text-blue-600/70 mt-0.5">Search and filter the latest medical research</p>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </Link>
            <Link to="/predictive" className="group flex items-center gap-4 p-4 rounded-xl bg-purple-50/80 border border-purple-100 hover:border-purple-200 transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-purple-800">Analytics & Insights</p>
                <p className="text-xs text-purple-600/70 mt-0.5">View predictive analytics and trend data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400" />
            </Link>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
