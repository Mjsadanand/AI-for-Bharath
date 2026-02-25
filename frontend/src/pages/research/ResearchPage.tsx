import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, Badge, StatCard, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
import {
  BookOpen,
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Tag,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ResearchPaper } from '../../types';

export default function ResearchPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'papers' | 'trends'>('papers');

  useEffect(() => {
    fetchPapers();
    fetchTrends();
  }, []);

  const fetchPapers = async (query?: string, cat?: string) => {
    try {
      const params: Record<string, string> = {};
      if (query) params.query = query;
      if (cat) params.category = cat;
      const { data } = await api.get('/research', { params });
      setPapers(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const { data } = await api.get('/research/trends');
      setTrends(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchPapers(searchQuery, category);
  };

  const toggleSave = async (paperId: string) => {
    try {
      const { data } = await api.post(`/research/${paperId}/save`);
      toast.success(data.data.saved ? 'Paper saved' : 'Paper unsaved');
      fetchPapers(searchQuery, category);
    } catch (err) {
      toast.error('Failed to save paper');
    }
  };

  if (loading && papers.length === 0) return <LoadingSpinner size="lg" className="h-96" />;

  const categories = ['cardiology', 'neurology', 'oncology', 'immunology', 'genetics', 'public_health'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary-500" />
          Research Synthesizer
        </h1>
        <p className="text-slate-500 mt-1">Search and analyze the latest medical research papers</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search papers by title, keywords, abstract..."
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </form>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('papers')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'papers'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5" />
            Papers ({papers.length})
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'trends'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1.5" />
            Trending Topics
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'papers' ? (
            papers.length > 0 ? (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div key={paper._id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setExpandedId(expandedId === paper._id ? null : paper._id)}
                            className="text-left"
                          >
                            <h3 className="text-base font-semibold text-slate-800 hover:text-primary-600 transition-colors">
                              {paper.title}
                            </h3>
                          </button>
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                            <span className="text-xs text-slate-500">{paper.authors?.join(', ')}</span>
                          </div>
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                            <Badge variant="info">{paper.category?.replace('_', ' ')}</Badge>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'N/A'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {paper.journal}
                            </span>
                            {paper.citations > 0 && (
                              <span className="text-xs text-slate-400">
                                {paper.citations} citations
                              </span>
                            )}
                            {paper.impactFactor > 0 && (
                              <Badge variant="purple">IF: {paper.impactFactor}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleSave(paper._id)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            title={paper.savedBy?.length ? 'Unsave' : 'Save'}
                          >
                            {paper.savedBy?.length ? (
                              <BookmarkCheck className="w-5 h-5 text-primary-600" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          {paper.doi && (
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                              title="View Paper"
                            >
                              <ExternalLink className="w-5 h-5 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>

                      {expandedId === paper._id && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fade-in">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Abstract</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{paper.abstract}</p>
                          </div>
                          {paper.keywords?.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              {paper.keywords.map((kw, i) => (
                                <Badge key={i} variant="default">{kw}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No papers found"
                description="Try a different search query or browse by category."
              />
            )
          ) : (
            trends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSearchQuery(trend._id || trend.keyword);
                      setActiveTab('papers');
                      fetchPapers(trend._id || trend.keyword);
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 capitalize">{trend._id || trend.keyword}</p>
                        <p className="text-xs text-slate-500">{trend.count} papers</p>
                      </div>
                    </div>
                    {trend.avgImpactFactor && (
                      <p className="text-xs text-slate-400">Avg. Impact Factor: {trend.avgImpactFactor?.toFixed(1)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title="No trends available" description="Trends will appear as papers are indexed." />
            )
          )}
        </div>
      </div>
    </div>
  );
}
