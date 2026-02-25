import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { StatCard, Card, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
import { BookOpen, TrendingUp, Bookmark, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResearcherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-96" />;

  const stats = data?.stats || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Research Dashboard</h1>
          <p className="text-slate-500 mt-1">Latest findings and trending topics</p>
        </div>
        <Link
          to="/research"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Search Papers
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Papers" value={stats.totalPapers || 0} icon={BookOpen} color="blue" />
        <StatCard title="Saved Papers" value={stats.savedPapers || 0} icon={Bookmark} color="green" />
        <StatCard title="Trending Topics" value={stats.trendingTopics || 0} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Trending Topics">
          {data?.trendingTopicsData && data.trendingTopicsData.length > 0 ? (
            <div className="space-y-3">
              {data.trendingTopicsData.map((topic: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{topic._id || topic.keyword}</span>
                  </div>
                  <span className="text-sm text-slate-500">{topic.count} papers</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No trending topics" description="Research trends will appear as papers are indexed." />
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-3">
            <Link to="/research" className="block p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <p className="font-semibold text-sm text-blue-700">Browse Research Papers</p>
              <p className="text-xs text-blue-600 mt-1">Search and filter the latest medical research</p>
            </Link>
            <Link to="/predictive" className="block p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <p className="font-semibold text-sm text-purple-700">Analytics & Insights</p>
              <p className="text-xs text-purple-600 mt-1">View predictive analytics and trend data</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
