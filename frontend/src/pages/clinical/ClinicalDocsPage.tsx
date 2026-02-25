import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/ui/Cards';
import {
  FileText,
  Plus,
  Search,
  Mic,
  MicOff,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ClinicalNote } from '../../types';

export default function ClinicalDocsPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewNote, setShowNewNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [filterStatus]);

  const fetchNotes = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-500" />
            Clinical Documentation
          </h1>
          <p className="text-slate-500 mt-1">AI-powered clinical note creation and management</p>
        </div>
        <button
          onClick={() => setShowNewNote(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Clinical Note
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clinical notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="amended">Amended</option>
        </select>
      </div>

      {/* Notes List */}
      {loading ? (
        <LoadingSpinner size="lg" className="h-64" />
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={() => setSelectedNote(selectedNote?._id === note._id ? null : note)}
              expanded={selectedNote?._id === note._id}
              onVerify={fetchNotes}
            />
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Create Note
            </button>
          }
        />
      )}

      {/* New Note Modal */}
      {showNewNote && <NewNoteModal onClose={() => setShowNewNote(false)} onCreated={fetchNotes} />}
    </div>
  );
}

function NoteCard({ note, onClick, expanded, onVerify }: {
  note: ClinicalNote;
  onClick: () => void;
  expanded: boolean;
  onVerify: () => void;
}) {
  const handleVerify = async (action: 'verify' | 'reject') => {
    try {
      await api.put(`/clinical-docs/${note._id}/verify`, { action });
      toast.success(`Note ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
      onVerify();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-amber-500" />,
    verified: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    rejected: <XCircle className="w-4 h-4 text-red-500" />,
    amended: <FileText className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onClick}>
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          {statusIcon[note.verificationStatus as keyof typeof statusIcon] || statusIcon.pending}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{note.chiefComplaint || 'Untitled Note'}</p>
          <p className="text-xs text-slate-500">
            {new Date(note.sessionDate).toLocaleDateString()} · {note.noteType}
          </p>
        </div>
        <Badge variant={
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

      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4 animate-fade-in">
          {note.hpiText && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">History of Present Illness</p>
              <p className="text-sm text-slate-700">{note.hpiText}</p>
            </div>
          )}
          {note.physicalExam && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Physical Exam</p>
              <p className="text-sm text-slate-700">{note.physicalExam}</p>
            </div>
          )}
          {note.assessment?.diagnoses?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Assessment</p>
              <div className="flex flex-wrap gap-2">
                {note.assessment.diagnoses.map((d, i) => (
                  <Badge key={i} variant="info">{d.condition} ({d.icdCode})</Badge>
                ))}
              </div>
              {note.assessment.clinicalImpression && (
                <p className="text-sm text-slate-700 mt-2">{note.assessment.clinicalImpression}</p>
              )}
            </div>
          )}
          {note.plan && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Plan</p>
              <p className="text-sm text-slate-700">{note.plan}</p>
            </div>
          )}
          {note.extractedEntities?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                <Sparkles className="w-3 h-3 inline mr-1" />
                AI-Extracted Entities
              </p>
              <div className="flex flex-wrap gap-2">
                {note.extractedEntities.map((entity, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-xs">
                    <span className="font-medium text-slate-700">{entity.text}</span>
                    <span className="text-slate-400">({entity.type})</span>
                    <span className="text-primary-500">{Math.round(entity.confidence * 100)}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {note.verificationStatus === 'pending' && (
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleVerify('verify')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Verify Note
              </button>
              <button
                onClick={() => handleVerify('reject')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewNoteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<'form' | 'transcript'>('form');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    noteType: 'progress_note',
    chiefComplaint: '',
    hpiText: '',
    physicalExam: '',
    assessment: '',
    plan: '',
    transcript: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'transcript') {
        await api.post('/clinical-docs/process-transcript', {
          patientId: formData.patientId,
          transcript: formData.transcript,
        });
      } else {
        await api.post('/clinical-docs', {
          patientId: formData.patientId,
          noteType: formData.noteType,
          chiefComplaint: formData.chiefComplaint,
          hpiText: formData.hpiText,
          physicalExam: formData.physicalExam,
          assessment: { clinicalImpression: formData.assessment },
          plan: formData.plan,
        });
      }
      toast.success('Clinical note created successfully');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">New Clinical Note</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setMode('form')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'form' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Structured Note
          </button>
          <button
            onClick={() => setMode('transcript')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'transcript' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mic className="w-4 h-4 inline mr-1.5" />
            Voice / Transcript
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient ID</label>
              <input
                type="text"
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter patient ID"
                required
              />
            </div>
            {mode === 'form' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Note Type</label>
                <select
                  name="noteType"
                  value={formData.noteType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="progress_note">Progress Note</option>
                  <option value="initial_consultation">Initial Consultation</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="procedure_note">Procedure Note</option>
                </select>
              </div>
            )}
          </div>

          {mode === 'form' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chief Complaint</label>
                <input
                  type="text"
                  name="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Primary complaint"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">History of Present Illness</label>
                <textarea
                  name="hpiText"
                  value={formData.hpiText}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Describe the patient's history..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Physical Exam</label>
                <textarea
                  name="physicalExam"
                  value={formData.physicalExam}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Exam findings..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assessment</label>
                <textarea
                  name="assessment"
                  value={formData.assessment}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Clinical impression..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Plan</label>
                <textarea
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Treatment plan..."
                />
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Transcript</label>
                <button
                  type="button"
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isRecording
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>
              <textarea
                name="transcript"
                value={formData.transcript}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Paste or dictate the clinical encounter transcript here. The AI will extract structured data from it..."
              />
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI will automatically extract entities, diagnoses, and create a structured note
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
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
      </div>
    </div>
  );
}
