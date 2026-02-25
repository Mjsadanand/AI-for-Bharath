import mongoose, { Document, Schema } from 'mongoose';

export interface IResearchPaper extends Document {
  externalId?: string; // PubMed ID
  title: string;
  authors: string[];
  publicationDate: Date;
  journal: string;
  abstract: string;
  summary: string;
  keyFindings: string[];
  methodology: string;
  limitations: string[];
  keywords: string[];
  citations: number;
  url?: string;
  savedBy: mongoose.Types.ObjectId[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const researchPaperSchema = new Schema<IResearchPaper>(
  {
    externalId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    authors: [String],
    publicationDate: Date,
    journal: String,
    abstract: String,
    summary: String,
    keyFindings: [String],
    methodology: String,
    limitations: [String],
    keywords: [String],
    citations: { type: Number, default: 0 },
    url: String,
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    category: String,
  },
  { timestamps: true }
);

researchPaperSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });

const ResearchPaper = mongoose.model<IResearchPaper>('ResearchPaper', researchPaperSchema);
export default ResearchPaper;
