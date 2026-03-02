import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { PageHeader, Badge } from '../../components/ui/Cards';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  X,
  Trash2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Heart,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'carenet_patient_report_images';
const MAX_IMAGES = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB per image

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

interface StoredImage {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  addedAt: string;
}

interface AnalysisResult {
  simplified: string;
  sections: Array<{ title: string; content: string }>;
  termsExplained: Array<{ term: string; meaning: string }>;
  warnings: string[];
  tips: string[];
  disclaimer: string;
}

// ─── LocalStorage Image Helpers ──────────────────────────────────────────────

function loadImages(): StoredImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveImages(images: StoredImage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'QuotaExceededError') {
      toast.error('Storage full. Remove some images first.');
    }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MyReportsPage() {
  const [images, setImages] = useState<StoredImage[]>(loadImages);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist images
  useEffect(() => {
    saveImages(images);
  }, [images]);

  // ─── Image handling ────────────────────────────────────────────────────

  const addImages = useCallback(async (files: FileList | File[]) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const toProcess = Array.from(files).slice(0, remaining);
    const newImages: StoredImage[] = [];

    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} exceeds 5 MB limit.`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        newImages.push({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          size: file.size,
          addedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Failed to read ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
    }
  }, [images.length]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAllImages = () => {
    setImages([]);
    toast.success('All images removed');
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  // ─── Submit for analysis ───────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!reportText.trim() && images.length === 0) {
      toast.error('Please enter report text or upload at least one image.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/patient-reports/analyze', {
        reportText: reportText.trim(),
        imageCount: images.length,
      });
      setResult(data.data);
      toast.success('Report simplified successfully!');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        : undefined;
      toast.error(message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <PageHeader
          icon={BookOpen}
          title="My Reports"
          description="Upload your medical reports and get easy-to-understand explanations"
          badge="Patient AI"
          actions={
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </button>
          }
        />
      </motion.div>

      {/* History panel */}
      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {/* Step 1: Upload Images */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Upload Report Images</h3>
              <p className="text-xs text-slate-400">Photos of your medical reports (max {MAX_IMAGES})</p>
            </div>
          </div>
          {images.length > 0 && (
            <button onClick={clearAllImages} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all',
            dragActive
              ? 'border-primary-400 bg-primary-50/50'
              : images.length >= MAX_IMAGES
                ? 'border-slate-200 bg-slate-50/30 cursor-not-allowed'
                : 'border-slate-200 bg-slate-50/50 hover:border-primary-300 hover:bg-primary-50/30'
          )}
        >
          <Upload className={cn('w-8 h-8 mx-auto mb-2', dragActive ? 'text-primary-500' : 'text-slate-300')} />
          <p className="text-sm font-medium text-slate-600">
            {images.length >= MAX_IMAGES
              ? 'Maximum images reached'
              : dragActive
                ? 'Drop images here'
                : 'Tap to upload or drag & drop images'}
          </p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, HEIC — Max 5 MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileInput}
            className="hidden"
            disabled={images.length >= MAX_IMAGES}
          />
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
            {images.map(img => (
              <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(img.dataUrl); }}
                    className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:bg-white transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    className="p-1.5 bg-white/90 rounded-lg text-red-600 hover:bg-white transition-colors"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* File size badge */}
                <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-md font-mono">
                  {(img.size / 1024).toFixed(0)}KB
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Heart className="w-3 h-3 text-primary-400" />
          Images are stored locally on your device only — never uploaded to our servers.
        </p>
      </motion.div>

      {/* Step 2: Enter Report Text */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Report Text</h3>
            <p className="text-xs text-slate-400">Type or paste the text from your medical report</p>
          </div>
        </div>

        <textarea
          value={reportText}
          onChange={e => setReportText(e.target.value)}
          rows={6}
          className={cn(inputClass, 'resize-y min-h-[120px]')}
          placeholder={"Paste your clinical report, lab results, or prescription here...\n\nExample: \"Chief Complaint: Persistent headache for 2 weeks.\nAssessment: Hypertension, mild anemia.\nPlan: Start lisinopril 10mg daily. Follow up in 2 weeks.\""}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || (!reportText.trim() && images.length === 0)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm',
              'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Simplify My Report
              </>
            )}
          </button>
          {reportText.length > 0 && (
            <button
              onClick={() => { setReportText(''); setResult(null); }}
              className="px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Step 3: Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">{result.disclaimer}</p>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Important Notices
                </p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-red-700 leading-relaxed pl-5">• {w}</p>
                ))}
              </div>
            )}

            {/* Simplified Sections */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-bold text-slate-800">Your Report — Simplified</h3>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
                {result.sections.map((section, i) => (
                  <div key={i}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{section.title}</h4>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Terms Glossary */}
            {result.termsExplained.length > 0 && (
              <TermsGlossary terms={result.termsExplained} />
            )}

            {/* Health Tips */}
            {result.tips.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Health Tips
                </p>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-emerald-800 leading-relaxed flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-full max-h-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600 hover:text-slate-800 z-10"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
              <img src={previewImage} alt="Report" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Medical Terms Glossary Component ────────────────────────────────────────

function TermsGlossary({ terms }: { terms: Array<{ term: string; meaning: string }> }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left"
      >
        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Medical Terms Explained ({terms.length})
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {terms.map((t, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5 border border-purple-100">
                  <Badge variant="purple" size="sm">{t.term}</Badge>
                  <p className="text-xs text-purple-800 leading-relaxed flex-1">{t.meaning}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<Array<{ _id: string; details: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patient-reports/history')
      .then(({ data }) => setLogs(data.data || []))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Analysis History</p>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close history">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {logs.map(log => (
              <div key={log._id} className="px-4 py-2.5 text-xs text-slate-600 flex items-center justify-between">
                <span>{log.details}</span>
                <span className="text-slate-400 text-[10px] flex-shrink-0 ml-3">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No analysis history yet.</p>
        )}
      </div>
    </motion.div>
  );
}
