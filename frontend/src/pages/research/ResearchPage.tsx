import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { Badge, EmptyState, Skeleton, PageHeader } from '../../components/ui/Cards';
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
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ResearchPaper } from '../../types';
import WorkflowNav from '../../components/ui/WorkflowNav';
import { cn } from '../../lib/utils';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ResearchPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [trends, setTrends] = useState<Array<{ _id: string; keyword?: string; count: number; avgImpactFactor?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'papers' | 'trends'>('papers');

  useEffect(() => { fetchPapers(); fetchTrends(); }, []);

  const fetchPapers = async (query?: string, cat?: string) => {
    try {
      const params: Record<string, string> = {};
      if (query) params.query = query;
      if (cat) params.category = cat;
      const { data } = await api.get('/research/search', { params });
      setPapers(data.data || []);
    } catch { console.error('Failed to fetch papers'); } finally { setLoading(false); }
  };

  const fetchTrends = async () => {
    try { const { data } = await api.get('/research/trends'); setTrends(data.data || []); } catch { console.error('Failed to fetch trends'); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setLoading(true); fetchPapers(searchQuery, category); };

  const toggleSave = async (paperId: string) => {
    try {
      const { data } = await api.post(`/research/paper/${paperId}/save`);
      toast.success(data.data.saved ? 'Paper saved' : 'Paper unsaved');
      fetchPapers(searchQuery, category);
    } catch { toast.error('Failed to save paper'); }
  };

  const categories = ['cardiology', 'neurology', 'oncology', 'immunology', 'genetics', 'public_health'];

  if (loading && papers.length === 0) return (
    <div className="space-y-6">
      <WorkflowNav />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader icon={BookOpen} title="Research Synthesizer" description="Search and analyze the latest medical research papers" badge="AI Agent" />
      </motion.div>

      {/* Search */}
      <motion.form variants={fadeUp} onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all" placeholder="Search papers by title, keywords, abstract..." />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
          ))}
        </select>
        <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm shadow-primary-500/20">
          <Sparkles className="w-4 h-4" />Search
        </button>
      </motion.form>

      {/* Tabs + Content */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          {([{ id: 'papers' as const, label: 'Papers', icon: BookOpen, count: papers.length }, { id: 'trends' as const, label: 'Trending Topics', icon: TrendingUp, count: trends.length }]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex-1 py-3.5 text-sm font-medium transition-all', activeTab === tab.id ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
              <tab.icon className="w-4 h-4 inline mr-1.5" />{tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === 'papers' ? (
              <motion.div key="papers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {papers.length > 0 ? (
                  <div className="space-y-4">
                    {papers.map((paper, idx) => (
                      <motion.div key={paper._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="border border-slate-200/80 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all">
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <button onClick={() => setExpandedId(expandedId === paper._id ? null : paper._id)} className="text-left">
                                <h3 className="text-base font-semibold text-slate-800 hover:text-primary-600 transition-colors">{paper.title}</h3>
                              </button>
                              <p className="text-xs text-slate-500 mt-1.5">{paper.authors?.join(', ')}</p>
                              <div className="flex items-center flex-wrap gap-2 mt-2">
                                <Badge variant="info">{paper.category?.replace('_', ' ')}</Badge>
                                <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : 'N/A'}</span>
                                <span className="text-xs text-slate-400">{paper.journal}</span>
                                {paper.citations > 0 && <span className="text-xs text-slate-400">{paper.citations} citations</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => toggleSave(paper._id)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title={paper.savedBy?.length ? 'Unsave' : 'Save'}>
                                {paper.savedBy?.length ? <BookmarkCheck className="w-5 h-5 text-primary-600" /> : <Bookmark className="w-5 h-5 text-slate-400" />}
                              </button>
                              {paper.url && (
                                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="View Paper">
                                  <ExternalLink className="w-5 h-5 text-slate-400" />
                                </a>
                              )}
                              {expandedId === paper._id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedId === paper._id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                  <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Abstract</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{paper.abstract}</p>
                                  </div>
                                  {paper.keywords?.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                                      {paper.keywords.map((kw, i) => (
                                        <span key={i} className="text-xs px-2.5 py-1 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-lg border border-violet-100 font-medium">{kw}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={BookOpen} title="No papers found" description="Try a different search query or browse by category." />
                )}
              </motion.div>
            ) : (
              <motion.div key="trends" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {trends.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trends.map((trend, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group" onClick={() => { setSearchQuery(trend._id || trend.keyword || ''); setActiveTab('papers'); fetchPapers(trend._id || trend.keyword); }}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center group-hover:from-primary-200 group-hover:to-blue-200 transition-all">
                            <TrendingUp className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 capitalize">{trend._id || trend.keyword}</p>
                            <p className="text-xs text-slate-500">{trend.count} papers</p>
                          </div>
                        </div>
                        {trend.avgImpactFactor && <p className="text-xs text-slate-400">Avg. Impact Factor: {trend.avgImpactFactor?.toFixed(1)}</p>}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={TrendingUp} title="No trends available" description="Trends will appear as papers are indexed." />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
