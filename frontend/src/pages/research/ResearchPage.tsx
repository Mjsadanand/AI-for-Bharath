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
  GitCompare,
  Eye,
  X,
  CheckSquare,
  Square,
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
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<{ comparison?: string; commonFindings?: string[]; differences?: string[] } | null>(null);
  const [comparing, setComparing] = useState(false);
  const [detailPaper, setDetailPaper] = useState<ResearchPaper | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : (toast.error('Max 5 papers'), prev));
  };

  const handleCompare = async () => {
    if (selectedForCompare.length < 2) { toast.error('Select at least 2 papers to compare'); return; }
    setComparing(true);
    try {
      const { data } = await api.post('/research/compare', { paperIds: selectedForCompare });
      setCompareResult(data.data || data);
      toast.success('Evidence comparison complete');
    } catch { toast.error('Comparison failed'); } finally { setComparing(false); }
  };

  const viewPaperDetail = async (paperId: string) => {
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/research/paper/${paperId}`);
      setDetailPaper(data.data || data);
    } catch { toast.error('Failed to load paper details'); } finally { setLoadingDetail(false); }
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

      {/* Compare Evidence Toolbar */}
      {selectedForCompare.length > 0 && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
          <GitCompare className="w-5 h-5 text-violet-600" />
          <span className="text-sm font-semibold text-violet-800">{selectedForCompare.length} paper{selectedForCompare.length > 1 ? 's' : ''} selected</span>
          <button onClick={handleCompare} disabled={comparing || selectedForCompare.length < 2} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all">
            {comparing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <GitCompare className="w-4 h-4" />}
            {comparing ? 'Comparing...' : 'Compare Evidence'}
          </button>
          <button onClick={() => { setSelectedForCompare([]); setCompareResult(null); }} className="px-3 py-2 text-sm text-violet-600 hover:bg-violet-100 rounded-xl transition-colors">Clear</button>
        </motion.div>
      )}

      {/* Compare Result */}
      <AnimatePresence>
        {compareResult && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white border border-violet-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50">
              <h3 className="text-sm font-bold text-violet-800 flex items-center gap-2"><GitCompare className="w-4 h-4" />Evidence Comparison</h3>
              <button onClick={() => setCompareResult(null)} className="p-1.5 hover:bg-violet-100 rounded-lg transition-colors"><X className="w-4 h-4 text-violet-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              {compareResult.comparison && <div className="p-3 rounded-xl bg-slate-50"><p className="text-sm text-slate-700">{compareResult.comparison}</p></div>}
              {compareResult.commonFindings?.length ? (
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Common Findings</p>
                  <ul className="space-y-1">{compareResult.commonFindings.map((f, i) => <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{f}</li>)}</ul>
                </div>
              ) : null}
              {compareResult.differences?.length ? (
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase mb-2">Differences</p>
                  <ul className="space-y-1">{compareResult.differences.map((d, i) => <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-amber-500 mt-0.5">≠</span>{d}</li>)}</ul>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                            <div className="flex items-start gap-3">
                              <button onClick={(e) => { e.stopPropagation(); toggleCompareSelect(paper._id); }} className="mt-1 p-0.5 rounded hover:bg-slate-100 transition-colors" title="Select for comparison">
                                {selectedForCompare.includes(paper._id) ? <CheckSquare className="w-5 h-5 text-violet-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                              </button>
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
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => viewPaperDetail(paper._id)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" title="View details">
                                <Eye className="w-5 h-5 text-slate-400 hover:text-primary-600" />
                              </button>
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

      {/* Paper Detail Modal */}
      <AnimatePresence>
        {(detailPaper || loadingDetail) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setDetailPaper(null); setLoadingDetail(false); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {loadingDetail && !detailPaper ? (
                <div className="p-10 flex items-center justify-center"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : detailPaper ? (
                <>
                  <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex-1 min-w-0 pr-4">
                      <h2 className="text-lg font-bold text-slate-800">{detailPaper.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">{detailPaper.authors?.join(', ')}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="info">{detailPaper.category?.replace('_', ' ')}</Badge>
                        <span className="text-xs text-slate-400">{detailPaper.journal}</span>
                        <span className="text-xs text-slate-400">{detailPaper.publicationDate ? new Date(detailPaper.publicationDate).toLocaleDateString() : ''}</span>
                        {detailPaper.citations > 0 && <span className="text-xs text-slate-400">{detailPaper.citations} citations</span>}
                      </div>
                    </div>
                    <button onClick={() => { setDetailPaper(null); setLoadingDetail(false); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 flex-shrink-0"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    {detailPaper.abstract && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Abstract</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{detailPaper.abstract}</p>
                      </div>
                    )}
                    {detailPaper.summary && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-2">AI Summary</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{detailPaper.summary}</p>
                      </div>
                    )}
                    {detailPaper.keyFindings && detailPaper.keyFindings.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Key Findings</p>
                        <ul className="space-y-1.5">{detailPaper.keyFindings.map((f, i) => <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{f}</li>)}</ul>
                      </div>
                    )}
                    {detailPaper.methodology && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Methodology</p>
                        <p className="text-sm text-slate-700">{detailPaper.methodology}</p>
                      </div>
                    )}
                    {detailPaper.limitations && detailPaper.limitations.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-amber-600 uppercase mb-2">Limitations</p>
                        <ul className="space-y-1">{detailPaper.limitations.map((l, i) => <li key={i} className="text-sm text-slate-600">• {l}</li>)}</ul>
                      </div>
                    )}
                    {detailPaper.keywords?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        {detailPaper.keywords.map((kw, i) => <span key={i} className="text-xs px-2.5 py-1 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-lg border border-violet-100 font-medium">{kw}</span>)}
                      </div>
                    )}
                    {detailPaper.url && (
                      <a href={detailPaper.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors">
                        <ExternalLink className="w-4 h-4" />View Full Paper
                      </a>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
