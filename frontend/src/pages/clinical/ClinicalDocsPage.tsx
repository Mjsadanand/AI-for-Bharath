import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, EmptyState, PageHeader, Skeleton } from '../../components/ui/Cards';
import {
  FileText,
  Plus,
  Search,
  Mic,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  X,
  Upload,
  Loader2,
  StopCircle,
  Zap,
  CalendarDays,
  Shield,
  FlaskConical,
  ArrowRight,
  RefreshCw,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ClinicalNote, Patient, User } from '../../types';
import WorkflowNav from '../../components/ui/WorkflowNav';
import PatientRequiredGuard from '../../components/ui/PatientRequiredGuard';
import { cn } from '../../lib/utils';
import { usePatient } from '../../contexts/PatientContext';

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const inputClass = 'w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all';

export default function ClinicalDocsPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewNote, setShowNewNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [workflowTarget, setWorkflowTarget] = useState<{ noteId: string; patientId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchParams] = useSearchParams();
  const { selectedPatient: ctxPatient } = usePatient();
  const activePatientId = searchParams.get('patient') || ctxPatient?._id || '';

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, activePatientId]);

  const fetchNotes = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (activePatientId) params.patientId = activePatientId;
      const { data } = await api.get('/clinical-docs', { params });
      setNotes(data.data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter((note) =>
    !searchQuery || note.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.noteType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Guard: block access until a patient is selected ── */
  if (!ctxPatient) return <PatientRequiredGuard>{null}</PatientRequiredGuard>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <WorkflowNav />

      <motion.div variants={fadeUp}>
        <PageHeader
          icon={FileText}
          title="Clinical Documentation"
          description="AI-powered clinical note creation and management"
          badge="AI Agent"
          actions={
            <button
              onClick={() => setShowNewNote(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" />
              New Clinical Note
            </button>
          }
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clinical notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(inputClass, 'pl-10')}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="amended">Amended</option>
        </select>
      </motion.div>

      {/* Notes List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-3">
          {filteredNotes.map((note, idx) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <NoteCard
                note={note}
                onClick={() => setSelectedNote(selectedNote?._id === note._id ? null : note)}
                expanded={selectedNote?._id === note._id}
                onVerify={fetchNotes}
                onRunWorkflow={(noteId, patientId) => setWorkflowTarget({ noteId, patientId })}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No clinical notes found"
          description="Create your first clinical note to get started."
          action={
            <button
              onClick={() => setShowNewNote(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all"
            >
              Create Note
            </button>
          }
        />
      )}

      {/* New Note Modal */}
      <AnimatePresence>
        {showNewNote && (
          <NewNoteModal
            onClose={() => setShowNewNote(false)}
            onCreated={(noteId, patientId) => {
              fetchNotes();
              setShowNewNote(false);
              setWorkflowTarget({ noteId, patientId });
            }}
            preselectedPatientId={activePatientId}
          />
        )}
      </AnimatePresence>

      {/* Workflow Automator Panel — auto-triggered after note creation */}
      <AnimatePresence>
        {workflowTarget && (
          <WorkflowAutoPanel
            noteId={workflowTarget.noteId}
            patientId={workflowTarget.patientId}
            onClose={() => setWorkflowTarget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NoteCard({ note, onClick, expanded, onVerify, onRunWorkflow }: {
  note: ClinicalNote;
  onClick: () => void;
  expanded: boolean;
  onVerify: () => void;
  onRunWorkflow?: (noteId: string, patientId: string) => void;
}) {
  const [fullNote, setFullNote] = useState<ClinicalNote>(note);

  useEffect(() => {
    if (expanded && note._id) {
      api.get(`/clinical-docs/${note._id}`).then(({ data }) => {
        if (data.data) setFullNote(data.data);
      }).catch(() => { /* use inline data */ });
    }
  }, [expanded, note._id]);

  const handleVerify = async (action: 'verify' | 'reject') => {
    try {
      await api.put(`/clinical-docs/${note._id}/verify`, { action });
      toast.success(`Note ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
      onVerify();
    } catch {
      toast.error('Action failed');
    }
  };

  const statusConfig = {
    pending: { icon: <Clock className="w-4 h-4 text-amber-500" />, bg: 'from-amber-100 to-amber-50' },
    verified: { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, bg: 'from-emerald-100 to-emerald-50' },
    rejected: { icon: <XCircle className="w-4 h-4 text-red-500" />, bg: 'from-red-100 to-red-50' },
    amended: { icon: <FileText className="w-4 h-4 text-blue-500" />, bg: 'from-blue-100 to-blue-50' },
  };

  const status = statusConfig[note.verificationStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-md hover:border-slate-300/80 transition-all">
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onClick}>
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', status.bg)}>
          {status.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{note.chiefComplaint || 'Untitled Note'}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{new Date(note.sessionDate).toLocaleDateString()}</span>
            <span>·</span>
            <span className="capitalize">{note.noteType}</span>
            {((note as ClinicalNote & { patientId: Patient }).patientId) && (
              <>
                <span>·</span>
                {typeof (note as ClinicalNote & { patientId: Patient }).patientId === 'object' && (note as ClinicalNote & { patientId: Patient }).patientId?.patientCode && (
                  <span className="font-mono text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md font-bold">
                    {(note as ClinicalNote & { patientId: Patient }).patientId.patientCode}
                  </span>
                )}
                {typeof (note as ClinicalNote & { patientId: Patient }).patientId === 'object' && ((note as ClinicalNote & { patientId: Patient }).patientId?.userId as User)?.name && (
                  <span className="text-slate-600 font-medium">{((note as ClinicalNote & { patientId: Patient }).patientId?.userId as User).name}</span>
                )}
              </>
            )}
          </div>
        </div>
        <Badge dot variant={
          note.verificationStatus === 'verified' ? 'success' :
          note.verificationStatus === 'rejected' ? 'danger' :
          note.verificationStatus === 'amended' ? 'info' : 'warning'
        }>
          {note.verificationStatus}
        </Badge>
        {note.extractedEntities?.length > 0 && (
          <Badge variant="purple">
            <Sparkles className="w-3 h-3 mr-1" />
            {note.extractedEntities.length} entities
          </Badge>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 p-5 space-y-4">
              {fullNote.historyOfPresentIllness && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">History of Present Illness</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{fullNote.historyOfPresentIllness}</p>
                </div>
              )}
              {fullNote.physicalExam && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Physical Exam</p>
                  {typeof fullNote.physicalExam === 'string' ? (
                    <p className="text-sm text-slate-700">{fullNote.physicalExam}</p>
                  ) : (
                    <div className="text-sm text-slate-700">
                      {fullNote.physicalExam.general && <p>{fullNote.physicalExam.general}</p>}
                      {fullNote.physicalExam.findings?.length > 0 && (
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {fullNote.physicalExam.findings.map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
              {fullNote.assessment?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assessment</p>
                  <div className="flex flex-wrap gap-2">
                    {fullNote.assessment.map((a, i) => (
                      <Badge key={i} variant="info">{a.diagnosis} {a.icdCode ? `(${a.icdCode})` : ''} - {a.severity}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {fullNote.plan?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Plan</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {fullNote.plan.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        {p.treatment}{p.followUp ? ` — Follow up: ${p.followUp}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fullNote.prescriptions && fullNote.prescriptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Prescriptions</p>
                  <div className="flex flex-wrap gap-2">
                    {fullNote.prescriptions.map((rx, i) => (
                      <Badge key={i} variant="default">{rx.medication} {rx.dosage} {rx.frequency}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {fullNote.extractedEntities?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    AI-Extracted Entities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fullNote.extractedEntities.map((entity, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 text-xs">
                        <span className="font-semibold text-slate-700">{entity.value}</span>
                        <span className="text-slate-400">({entity.type})</span>
                        <span className="text-primary-600 font-medium">{Math.round(entity.confidence * 100)}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                {fullNote.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleVerify('verify')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Note
                    </button>
                    <button
                      onClick={() => handleVerify('reject')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {onRunWorkflow && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rawPatientId = (note as any).patientId?._id || (note as any).patientId;
                      onRunWorkflow(note._id!, String(rawPatientId || ''));
                    }}
                    className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm shadow-violet-500/20"
                  >
                    <Zap className="w-4 h-4" />
                    Run AI Workflow
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewNoteModal({ onClose, onCreated, preselectedPatientId }: { onClose: () => void; onCreated: (noteId: string, patientId: string) => void; preselectedPatientId?: string }) {
  const [mode, setMode] = useState<'form' | 'transcript'>('form');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patients, setPatients] = useState<Array<{ _id: string; userId?: { name: string }; patientCode?: string }>>([]);
  const [formData, setFormData] = useState({
    patientId: preselectedPatientId || '',
    noteType: 'consultation',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExam: '',
    assessment: '',
    plan: '',
    transcript: '',
  });

  // Fetch patients for dropdown
  useEffect(() => {
    api.get('/patients').then(res => setPatients(res.data.data || res.data)).catch(() => {});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Transcription via backend (Groq Whisper) ──────────────────
  const transcribeAudioBlob = async (blob: Blob, filename: string) => {
    setTranscribing(true);
    try {
      const uploadData = new FormData();
      uploadData.append('audio', blob, filename);

      const { data } = await api.post('/clinical-docs/transcribe', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      if (data.success && data.data.transcript) {
        setFormData(prev => ({ ...prev, transcript: data.data.transcript }));
        toast.success(
          data.data.duration
            ? `Transcribed ${Math.round(data.data.duration)}s of audio`
            : 'Audio transcribed successfully'
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Transcription failed';
      toast.error(msg);
    } finally {
      setTranscribing(false);
    }
  };

  // ─── Live Recording (MediaRecorder + Web Speech API) ───────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (audioBlob.size > 0) {
          // Send to Groq Whisper for high-accuracy transcription
          transcribeAudioBlob(audioBlob, 'recording.webm');
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start Web Speech API for real-time interim preview
      startSpeechRecognition();
    } catch {
      toast.error('Microphone access denied. Check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const startSpeechRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return; // Browser doesn't support Web Speech API

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setFormData(prev => ({ ...prev, transcript: (finalTranscript + interim).trim() }));
    };

    recognition.onerror = () => {}; // Silently ignore SR errors
    recognition.onend = () => {
      // Restart if still recording (SR auto-stops sometimes)
      if (mediaRecorderRef.current?.state === 'recording') {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // ─── File Upload ────────────────────────────────────────────────
  const handleFileUpload = (file: File) => {
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 25 MB.');
      return;
    }
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file (WAV, MP3, M4A, WebM, OGG, FLAC).');
      return;
    }
    transcribeAudioBlob(file, file.name);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) { toast.error('Please select a patient'); return; }
    setLoading(true);
    try {
      let createdNoteId = '';
      if (mode === 'transcript') {
        // Step 1: Process transcript to get AI suggestions
        const { data: suggestions } = await api.post('/clinical-docs/process-transcript', {
          patientId: formData.patientId,
          transcript: formData.transcript,
        });
        const suggested = suggestions.data || {};
        // Step 2: Create actual clinical note with the AI-generated structure
        const { data: noteRes } = await api.post('/clinical-docs', {
          patientId: formData.patientId,
          noteType: 'consultation',
          chiefComplaint: suggested.chiefComplaint || 'Transcript consultation',
          historyOfPresentIllness: suggested.historyOfPresentIllness || formData.transcript,
          assessment: suggested.assessment || [],
          plan: suggested.plan || [],
          transcript: formData.transcript,
          prescriptions: suggested.prescriptions || [],
        });
        createdNoteId = noteRes.data?._id || '';
      } else {
        const { data: noteRes } = await api.post('/clinical-docs', {
          patientId: formData.patientId,
          noteType: formData.noteType,
          chiefComplaint: formData.chiefComplaint,
          historyOfPresentIllness: formData.historyOfPresentIllness,
          physicalExam: { findings: formData.physicalExam ? [formData.physicalExam] : [] },
          assessment: formData.assessment ? [{ diagnosis: formData.assessment, severity: 'moderate' }] : [],
          plan: formData.plan ? [{ treatment: formData.plan }] : [],
        });
        createdNoteId = noteRes.data?._id || '';
      }
      toast.success('Clinical note created — launching Workflow Agent...');
      onCreated(createdNoteId, formData.patientId);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">New Clinical Note</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setMode('form')}
            className={cn('flex-1 py-3.5 text-sm font-medium transition-all', mode === 'form' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700')}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Structured Note
          </button>
          <button
            onClick={() => setMode('transcript')}
            className={cn('flex-1 py-3.5 text-sm font-medium transition-all', mode === 'transcript' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700')}
          >
            <Mic className="w-4 h-4 inline mr-1.5" />
            Voice / Transcript
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Patient</label>
              <select name="patientId" value={formData.patientId} onChange={handleChange} className={inputClass} required>
                <option value="">Select a patient</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.userId?.name || 'Unknown'} {p.patientCode ? `(${p.patientCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {mode === 'form' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Note Type</label>
                <select name="noteType" value={formData.noteType} onChange={handleChange} className={inputClass}>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow Up</option>
                  <option value="emergency">Emergency</option>
                  <option value="procedure">Procedure</option>
                  <option value="discharge">Discharge</option>
                </select>
              </div>
            )}
          </div>

          {mode === 'form' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chief Complaint</label>
                <input type="text" name="chiefComplaint" value={formData.chiefComplaint} onChange={handleChange} className={inputClass} placeholder="Primary complaint" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">History of Present Illness</label>
                <textarea name="historyOfPresentIllness" value={formData.historyOfPresentIllness} onChange={handleChange} rows={3} className={cn(inputClass, 'resize-none')} placeholder="Describe the patient's history..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Physical Exam</label>
                <textarea name="physicalExam" value={formData.physicalExam} onChange={handleChange} rows={2} className={cn(inputClass, 'resize-none')} placeholder="Exam findings..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assessment</label>
                <textarea name="assessment" value={formData.assessment} onChange={handleChange} rows={2} className={cn(inputClass, 'resize-none')} placeholder="Clinical impression..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plan</label>
                <textarea name="plan" value={formData.plan} onChange={handleChange} rows={2} className={cn(inputClass, 'resize-none')} placeholder="Treatment plan..." />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Recording & Upload Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={transcribing}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all text-sm font-medium',
                    isRecording
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700',
                    transcribing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isRecording ? (
                    <>
                      <div className="relative">
                        <StopCircle className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      </div>
                      <span>Stop Recording</span>
                      <span className="text-xs font-mono tabular-nums text-red-500">{formatTime(recordingTime)}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6" />
                      <span>Live Record</span>
                      <span className="text-xs text-slate-400">Click to start</span>
                    </>
                  )}
                </button>

                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => !transcribing && !isRecording && fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all text-sm font-medium cursor-pointer',
                    dragActive
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700',
                    (transcribing || isRecording) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Upload className="w-6 h-6" />
                  <span>Upload Audio</span>
                  <span className="text-xs text-slate-400">WAV, MP3, M4A, WebM</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg,.flac"
                    onChange={onFileInputChange}
                    className="hidden"
                    disabled={transcribing || isRecording}
                  />
                </div>
              </div>

              {/* Recording Waveform Animation */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1.5 py-2">
                  {[1, 3, 5, 3, 1].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{ height: `${8 + h * 4}px`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                  <span className="ml-2 text-xs text-red-500 font-medium">Listening... (live preview below)</span>
                </div>
              )}

              {/* Transcribing Indicator */}
              {transcribing && (
                <div className="flex items-center justify-center gap-2 py-3 bg-primary-50/70 rounded-xl">
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                  <span className="text-sm text-primary-700 font-medium">Transcribing audio with Whisper AI...</span>
                </div>
              )}

              {/* Transcript Textarea */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Transcript</label>
                <textarea
                  name="transcript"
                  value={formData.transcript}
                  onChange={handleChange}
                  rows={8}
                  className={cn(inputClass, 'resize-none')}
                  placeholder="Record audio or upload a file to transcribe automatically. You can also type or paste a transcript directly..."
                  disabled={isRecording}
                />
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary-400" />
                  AI will automatically extract entities, diagnoses, and create a structured note
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || transcribing || isRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 shadow-sm shadow-primary-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {mode === 'transcript' ? 'Process Transcript' : 'Create Note'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
/* ══════════════════════════════════════════════════════════════════════
   WORKFLOW AUTO PANEL
   Automatically invokes the Workflow Automator AI Agent on a clinical note
   and displays created appointments, insurance claims & lab orders.
   ══════════════════════════════════════════════════════════════════════ */

interface WorkflowArtifacts {
  appointments?: Array<{ id: string; date: string; type: string }>;
  insuranceClaims?: Array<{ id: string; claimNumber: string; amount: number }>;
  labOrders?: Array<{ id: string; test: string; priority: string }>;
}

interface WorkflowResult {
  summary: string;
  artifacts: WorkflowArtifacts;
  toolCalls: Array<{ tool: string; success: boolean; durationMs: number }>;
  durationMs: number;
}

function WorkflowAutoPanel({ noteId, patientId, onClose }: { noteId: string; patientId: string; onClose: () => void }) {
  const [status, setStatus] = useState<'running' | 'done' | 'error'>('running');
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || !noteId) return;
    hasFetched.current = true;

    const run = async () => {
      try {
        const { data } = await api.post('/workflow/auto-generate', { clinicalNoteId: noteId, patientId }, { timeout: 180_000 });
        setResult(data.data);
        setStatus('done');
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Workflow agent failed. Check server logs.');
        setStatus('error');
      }
    };
    run();
  }, [noteId, patientId]);

  const artifacts = result?.artifacts || {};
  const appointments = artifacts.appointments || [];
  const claims = artifacts.insuranceClaims || [];
  const labs = artifacts.labOrders || [];
  const totalActions = appointments.length + claims.length + labs.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-primary-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base">Workflow Automator</h2>
                <p className="text-xs text-white/70">AI Agent · Appointments, Claims & Labs</p>
              </div>
            </div>
            {status !== 'running' && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Running state */}
          {status === 'running' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-violet-600" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Agent is processing the clinical note...</p>
                <p className="text-xs text-slate-500 text-center max-w-xs">
                  Analyzing diagnoses, checking schedules, preparing insurance codes, and ordering labs.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: CalendarDays, label: 'Scheduling', color: 'text-blue-500 bg-blue-50' },
                  { icon: Shield, label: 'Insurance', color: 'text-emerald-500 bg-emerald-50' },
                  { icon: FlaskConical, label: 'Lab Orders', color: 'text-amber-500 bg-amber-50' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className={cn('rounded-xl p-3 flex flex-col items-center gap-1.5', color.split(' ')[1])}>
                    <Icon className={cn('w-5 h-5', color.split(' ')[0])} />
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Agent run failed</p>
                  <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={() => { setStatus('running'); hasFetched.current = false; }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {/* Success state */}
          {status === 'done' && result && (
            <div className="space-y-4">
              {/* Summary badge */}
              <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <p className="text-xs text-violet-800 font-medium">
                  Agent created {totalActions} workflow action{totalActions !== 1 ? 's' : ''} in {(result.durationMs / 1000).toFixed(1)}s
                </p>
              </div>

              {/* Appointments */}
              {appointments.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> Appointments Scheduled
                  </p>
                  <div className="space-y-1.5">
                    {appointments.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs">
                        <span className="font-semibold text-blue-800 capitalize">{a.type.replace('_', ' ')}</span>
                        <span className="text-blue-600">·</span>
                        <span className="text-blue-700">{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance Claims */}
              {claims.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> Insurance Claims Created
                  </p>
                  <div className="space-y-1.5">
                    {claims.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
                        <span className="font-mono font-semibold text-emerald-800">{c.claimNumber}</span>
                        <span className="text-emerald-700 font-semibold">${c.amount?.toLocaleString()}</span>
                        <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">draft</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Orders */}
              {labs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-500" /> Lab Orders Placed
                  </p>
                  <div className="space-y-1.5">
                    {labs.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs">
                        <span className="font-semibold text-amber-800">{l.test}</span>
                        <span className={cn('px-2 py-0.5 rounded-full font-medium',
                          l.priority === 'stat' ? 'bg-red-100 text-red-700' :
                          l.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        )}>
                          {l.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent summary (collapsed) */}
              {result.summary && (
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 font-medium select-none flex items-center gap-1">
                    <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                    Agent reasoning
                  </summary>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">{result.summary}</p>
                </details>
              )}

              {/* Footer actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <a
                  href="/workflow"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  View in Workflow <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}