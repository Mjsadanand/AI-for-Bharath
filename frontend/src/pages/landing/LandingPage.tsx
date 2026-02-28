import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Shield,
  Zap,
  FileText,
  Languages,
  Activity,
  FlaskConical,
  GitBranch,
  ChevronRight,
  ArrowRight,
  Check,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Heart,
  Lock,
  BarChart3,
  Clock,
  Users,
  MousePointer2,
} from 'lucide-react';

/* ─────────────── Handwriting SVG Animation ─────────────── */
function HandwritingText({ texts, drawDuration = 1.8, holdDuration = 2, fadeDuration = 0.6 }: { texts: string[]; drawDuration?: number; holdDuration?: number; fadeDuration?: number }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'draw' | 'hold' | 'fade'>('draw');
  const containerRef = useRef<HTMLSpanElement>(null);
  const [uniqueId] = useState(() => `hw-${crypto.randomUUID().slice(0, 8)}`);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'draw') {
      timer = setTimeout(() => setPhase('hold'), drawDuration * 1000);
    } else if (phase === 'hold') {
      timer = setTimeout(() => setPhase('fade'), holdDuration * 1000);
    } else {
      timer = setTimeout(() => {
        setIndex((p) => (p + 1) % texts.length);
        setPhase('draw');
      }, fadeDuration * 1000);
    }
    return () => clearTimeout(timer);
  }, [phase, texts.length, drawDuration, holdDuration, fadeDuration]);

  const text = texts[index];

  return (
    <span ref={containerRef} className="relative inline-flex flex-col items-start">
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          className="relative inline-block"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeDuration }}
        >
          {/* Hidden text to reserve space */}
          <span className="invisible font-extrabold" style={{ fontFamily: "'Caveat', cursive" }} aria-hidden="true">{text}</span>

          {/* Text revealed via animated clip-path (left→right wipe = handwriting reveal) */}
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent font-extrabold"
            style={{ willChange: 'clip-path', fontFamily: "'Caveat', cursive" }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{
              clipPath: phase === 'fade' ? 'inset(0 100% 0 0)' : 'inset(0 0% 0 0)',
            }}
            transition={{
              clipPath: {
                duration: phase === 'draw' ? drawDuration : phase === 'fade' ? fadeDuration * 0.5 : 0,
                ease: phase === 'draw' ? [0.22, 0.61, 0.36, 1] : 'easeIn',
              },
            }}
          >
            {text}
          </motion.span>

          {/* Pen cursor at the reveal edge */}
          <motion.span
            className="absolute top-0 z-30 pointer-events-none h-full flex items-center"
            initial={{ left: '0%', opacity: 0 }}
            animate={{
              left: phase === 'draw' ? '100%' : phase === 'hold' ? '100%' : '0%',
              opacity: phase === 'draw' ? 1 : 0,
            }}
            transition={{
              left: {
                duration: phase === 'draw' ? drawDuration : phase === 'fade' ? fadeDuration * 0.5 : 0,
                ease: phase === 'draw' ? [0.22, 0.61, 0.36, 1] : 'easeIn',
              },
              opacity: { duration: 0.25 },
            }}
          >
            {/* Pen nib glow */}
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-400 rounded-full blur-md opacity-80" />
            {/* Pen icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="-ml-3 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
              <path d="M24 4L10 18" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 18L7 25L14 22" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 18L14 22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 4L20 3L10 18" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="25" r="1.5" fill="#a855f7" />
            </svg>
          </motion.span>

          {/* Subtle glow behind text during draw */}
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/15 to-fuchsia-500/10 rounded-lg blur-xl -z-10"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: phase === 'fade' ? 0 : 0.8,
              scaleX: phase === 'draw' ? 1 : phase === 'hold' ? 1 : 0,
            }}
            style={{ originX: 0 }}
            transition={{ duration: drawDuration * 0.8, ease: 'easeOut' }}
          />
        </motion.span>
      </AnimatePresence>

      {/* Hand-drawn underline using motion.path with pathLength (proper Framer Motion API) */}
      <svg
        className="w-full h-3 -mt-1"
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${uniqueId}-underline`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d946ef" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <motion.path
          d="M2 8 Q 50 2, 100 7 T 200 5 T 300 8 T 398 4"
          fill="none"
          stroke={`url(#${uniqueId}-underline)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="0 1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: phase === 'fade' ? 0 : phase === 'hold' ? 1 : 1,
            opacity: phase === 'fade' ? 0 : 0.8,
          }}
          transition={{
            pathLength: {
              duration: phase === 'draw' ? drawDuration * 0.5 : fadeDuration * 0.3,
              delay: phase === 'draw' ? drawDuration * 0.6 : 0,
              ease: 'easeOut',
            },
            opacity: { duration: fadeDuration * 0.5 },
          }}
        />
        {/* Second, thinner scribble line for hand-drawn feel */}
        <motion.path
          d="M10 5 Q 60 10, 120 4 T 220 7 T 340 3 T 395 6"
          fill="none"
          stroke={`url(#${uniqueId}-underline)`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="0 1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: phase === 'fade' ? 0 : phase === 'hold' ? 1 : 1,
            opacity: phase === 'fade' ? 0 : 0.4,
          }}
          transition={{
            pathLength: {
              duration: phase === 'draw' ? drawDuration * 0.4 : fadeDuration * 0.3,
              delay: phase === 'draw' ? drawDuration * 0.75 : 0,
              ease: 'easeOut',
            },
            opacity: { duration: fadeDuration * 0.5 },
          }}
        />
      </svg>
    </span>
  );
}

/* ─────────────── Animated Counter ─────────────── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────── Section Reveal ─────────────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────── FAQ Accordion Item ─────────────── */
function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div
      className="border border-slate-700/50 rounded-2xl overflow-hidden bg-slate-800/50 backdrop-blur-sm hover:border-purple-500/30 transition-colors"
      layout
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 rounded-2xl"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-semibold text-slate-100 pr-4 text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────── Floating Orb BG ─────────────── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/15 to-violet-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/8 rounded-full blur-3xl animate-float [animation-delay:1.5s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/8 to-indigo-500/5 rounded-full blur-3xl animate-float [animation-delay:3s]" />
    </div>
  );
}

/* ─────────────── Grid Pattern ─────────────── */
function GridPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden>
      <svg width="100%" height="100%">
        <defs>
          <pattern id="landing-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#landing-grid)" />
      </svg>
    </div>
  );
}

/* ─────────────── Handwritten Section Label ─────────────── */
function HandwrittenLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [uid] = useState(() => `hl-${crypto.randomUUID().slice(0, 6)}`);
  return (
    <span ref={ref} className={`relative inline-block font-hand ${className}`}>
      {children}
      <svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <motion.path
          d="M2 5 Q 40 1, 80 5 T 160 4 T 198 5"
          fill="none"
          stroke={`url(#${uid})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="0 1"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
    </span>
  );
}

/* ─────────────── Decorative Hand-drawn Divider ─────────────── */
function ScribbleDivider({ className = '' }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <svg ref={ref} className={`mx-auto ${className}`} width="200" height="16" viewBox="0 0 200 16" fill="none" aria-hidden>
      <motion.path
        d="M5 8 Q 30 2, 60 9 T 120 7 T 195 8"
        stroke="#a855f7"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="0 1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.3 } : {}}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <motion.path
        d="M20 10 Q 50 14, 80 7 T 140 10 T 180 8"
        stroke="#7c3aed"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="0 1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.2 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitShown, setExitShown] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], ['rgba(2,6,23,0)', 'rgba(2,6,23,0.92)']);
  const headerBlur = useTransform(scrollYProgress, [0, 0.05], ['blur(0px)', 'blur(16px)']);
  const headerBorder = useTransform(scrollYProgress, [0, 0.05], ['rgba(0,0,0,0)', 'rgba(51,65,85,0.4)']);

  const heroTexts = ['Clinical Documentation', 'Risk Prediction', 'Patient Translation', 'Medical Research', 'Workflow Automation'];

  // Exit-intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShown) {
        setShowExitPopup(true);
        setExitShown(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exitShown]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);


  /* ── Data ── */
  const features = [
    { icon: FileText, title: 'AI Clinical Docs', desc: 'Generate structured clinical notes from voice or text input with entity extraction and ICD-10 coding in seconds.', gradient: 'from-blue-500 to-indigo-600',
      details: {
        highlights: ['SOAP note auto-generation from voice or text', 'Medical entity extraction (symptoms, diagnoses, medications)', 'Automatic ICD-10 & CPT code assignment', 'Prescription and treatment plan drafting', 'Real-time clinical spell-check and grammar correction'],
        stats: { label: 'Average note generation time', value: '< 8 seconds' },
        description: 'Our AI Clinical Documentation engine uses Amazon Bedrock foundation models fine-tuned on millions of medical records. It understands clinical context, extracts structured data, and produces compliant documentation — reducing physician burnout and improving accuracy.'
      }
    },
    { icon: Languages, title: 'Patient Translator', desc: 'Convert complex medical jargon into simple, patient-friendly language. Supports multiple comprehension levels.', gradient: 'from-teal-500 to-emerald-600',
      details: {
        highlights: ['Adjustable reading levels (5th grade to professional)', 'Medical terminology simplification with context', 'Multilingual output support', 'Patient discharge summary generation', 'Medication instruction translation'],
        stats: { label: 'Patient comprehension improvement', value: '4x better' },
        description: 'The Patient Translator bridges the communication gap between healthcare providers and patients. It takes complex clinical notes and converts them into clear, understandable language — improving adherence, reducing readmissions, and empowering patients.'
      }
    },
    { icon: Activity, title: 'Predictive Engine', desc: 'AI-powered risk scoring, early warning alerts, and personalized prevention plans based on patient history.', gradient: 'from-amber-500 to-orange-600',
      details: {
        highlights: ['Multi-category risk scoring (cardiovascular, metabolic, respiratory)', 'Early warning alerts with confidence intervals', 'Personalized prevention plan recommendations', 'Trend analysis from historical vitals and labs', 'Integration with real-time patient monitoring'],
        stats: { label: 'Risk prediction accuracy', value: '98%' },
        description: 'Our Predictive Engine analyzes patient vitals, lab results, medical history, and demographic data to generate comprehensive risk assessments. It catches critical conditions up to 72 hours earlier than traditional methods, enabling proactive intervention.'
      }
    },
    { icon: FlaskConical, title: 'Research Synthesis', desc: 'Search, analyze, and synthesize medical literature. Surface key findings relevant to patient conditions.', gradient: 'from-violet-500 to-purple-600',
      details: {
        highlights: ['Search across PubMed, clinical trials, and medical journals', 'AI-powered relevance ranking for patient conditions', 'Automated literature review summarization', 'Evidence-based treatment recommendations', 'Citation tracking and source verification'],
        stats: { label: 'Research papers analyzed', value: '35M+' },
        description: 'Research Synthesis keeps clinicians up-to-date by automatically surfacing the most relevant medical literature based on patient conditions. It saves hours of manual research and ensures treatment decisions are backed by the latest evidence.'
      }
    },
    { icon: GitBranch, title: 'Workflow Automation', desc: 'Automate scheduling, claims processing, lab result tracking, and follow-up reminders seamlessly.', gradient: 'from-rose-500 to-pink-600',
      details: {
        highlights: ['Smart appointment scheduling and rescheduling', 'Automated insurance claims processing', 'Lab result tracking and abnormal value alerts', 'Patient follow-up reminders (SMS, email, in-app)', 'Referral management and care coordination'],
        stats: { label: 'Admin time reduction', value: '50%' },
        description: 'Workflow Automation eliminates repetitive administrative tasks that consume healthcare teams. From scheduling to billing, every step is intelligently automated — freeing up staff to focus on what matters most: patient care.'
      }
    },
    { icon: Brain, title: '6-Step AI Pipeline', desc: 'End-to-end intelligent pipeline: Patient → Docs → Translation → Prediction → Workflow → Research, all connected.', gradient: 'from-cyan-500 to-blue-600',
      details: {
        highlights: ['Single-click activation of all six AI agents', 'Sequential and parallel processing modes', 'Real-time pipeline status monitoring', 'Configurable pipeline stages per workflow', 'Complete audit trail for every pipeline run'],
        stats: { label: 'Full pipeline execution time', value: '< 2.3 seconds' },
        description: 'The 6-Step AI Pipeline orchestrates all agents into a cohesive workflow. One click triggers patient intake, clinical documentation, translation, risk prediction, workflow automation, and research synthesis — transforming a 45-minute process into seconds.'
      }
    },
  ];

  const stats = [
    { value: 98, suffix: '%', label: 'Documentation Accuracy' },
    { value: 12, suffix: 'x', label: 'Faster Report Generation' },
    { value: 50, suffix: '%', label: 'Reduction in Admin Time' },
    { value: 99.9, suffix: '%', label: 'Uptime Guarantee' },
  ];

  const benefits = [
    { icon: Clock, text: 'Save 3+ hours daily on documentation' },
    { icon: Shield, text: 'HIPAA-compliant & SOC 2 certified' },
    { icon: Heart, text: 'Improve patient understanding by 4x' },
    { icon: BarChart3, text: 'Catch critical risks 72 hours earlier' },
    { icon: Users, text: 'Seamless multi-role collaboration' },
    { icon: Sparkles, text: 'Powered by Amazon Bedrock AI' },
  ];

  const faqs = [
    { q: 'Is CareNet AI HIPAA compliant?', a: 'Absolutely. CareNet AI is fully HIPAA-compliant with end-to-end encryption, audit logging, role-based access control, and SOC 2 Type II certification. Your patient data never leaves your secure environment.' },
    { q: 'How does the AI generate clinical documentation?', a: 'Our AI uses Amazon Bedrock foundation models fine-tuned on medical datasets. It extracts entities, maps ICD-10 codes, structures SOAP notes, and generates prescriptions — all from natural language input.' },
    { q: 'Can it integrate with our existing EHR system?', a: 'Yes. CareNet AI offers REST APIs and HL7 FHIR-compatible interfaces. We support Epic, Cerner, and most major EHR platforms with minimal setup.' },
    { q: 'What roles does the platform support?', a: 'CareNet AI supports Doctors, Patients, Researchers, and Administrators — each with tailored dashboards, permissions, and workflows.' },
    { q: 'How accurate is the predictive risk engine?', a: 'Our risk scoring achieves 98% accuracy on benchmark datasets. It combines vital signs, lab results, medical history, and AI analysis to generate multi-category risk scores with confidence intervals.' },
    { q: 'Is there a free trial available?', a: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required. Start transforming your practice today.' },
  ];

  const techStack = [
    { name: 'React', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
    { name: 'TypeScript', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
    { name: 'Vite', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg' },
    { name: 'Tailwind CSS', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
    { name: 'Framer Motion', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/framermotion/framermotion-original.svg' },
    { name: 'Node.js', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
    { name: 'Express', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg', invert: true },
    { name: 'MongoDB', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg' },
    { name: 'AWS', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { name: 'Zod', img: 'https://zod.dev/_next/image?url=%2Flogo%2Flogo-glow.png&w=640&q=100' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* ════════ STICKY HEADER ════════ */}
      <motion.header
        style={{ backgroundColor: headerBg, backdropFilter: headerBlur, borderBottomColor: headerBorder, borderBottomWidth: '1px' } as unknown as React.CSSProperties}
        className="fixed top-0 inset-x-0 z-50"
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16 lg:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="CareNet AI Home">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              CareNet<span className="text-purple-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {['Features', 'Benefits', 'Testimonials', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-purple-500 after:transition-all hover:after:w-full"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="group px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60"
            >
              <div className="px-5 py-6 space-y-4">
                {['Features', 'Benefits', 'Testimonials', 'FAQ'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base font-medium text-slate-300 hover:text-purple-400 transition-colors"
                  >
                    {item}
                  </a>
                ))}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <Link to="/login" className="block w-full text-center px-4 py-2.5 text-sm font-semibold border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="block w-full text-center px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl shadow-lg shadow-purple-500/25">
                    Get Started Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <FloatingOrbs />
        <GridPattern />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 tracking-wide">POWERED BY AMAZON BEDROCK</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <HandwritingText texts={heroTexts} drawDuration={1.6} holdDuration={2.2} fadeDuration={0.5} />
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              CareNet AI transforms healthcare operations with a 6-step intelligent pipeline.
              From clinical docs to predictive analytics spend less time on paperwork,
              more time saving lives.
            </motion.p>

            {/* CTA Group */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/register"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-2xl shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 text-base"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="group w-full sm:w-auto px-8 py-4 bg-slate-800/80 border border-slate-700/60 text-slate-200 font-semibold rounded-2xl hover:border-purple-500/30 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-base shadow-sm"
              >
                See How It Works
                <MousePointer2 className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </a>
            </motion.div>

            {/* Trust Signal */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-2"
            >
              <Lock className="w-3 h-3" />
              No credit card required · 14-day free trial · HIPAA compliant
            </motion.p>
          </div>

          {/* Hero visual - Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-16 lg:mt-20 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-purple-500/10 bg-gradient-to-b from-slate-900 to-slate-950">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full max-w-md mx-auto h-7 bg-slate-900 rounded-lg border border-slate-700 flex items-center px-3">
                    <Lock className="w-3 h-3 text-green-400 mr-2" />
                    <span className="text-[11px] text-slate-400">app.carenet.ai/dashboard</span>
                  </div>
                </div>
              </div>
              {/* Dashboard Mock */}
              <div className="p-6 lg:p-8 space-y-4">
                {/* Top bar mock */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 w-40 bg-slate-200 rounded-md" />
                    <div className="h-3 w-56 bg-slate-700 rounded mt-2" />
                  </div>
                  <div className="h-9 w-28 bg-purple-500 rounded-xl" />
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Patients', val: '1,247', color: 'bg-blue-500' },
                    { label: 'AI Notes', val: '3,891', color: 'bg-violet-500' },
                    { label: 'Predictions', val: '892', color: 'bg-amber-500' },
                    { label: 'Risk Alerts', val: '47', color: 'bg-red-500' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 lg:p-4 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-sm">
                      <div className={`w-6 h-6 ${s.color} rounded-lg mb-2`} />
                      <p className="text-lg lg:text-xl font-bold text-white">{s.val}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Chart Mock */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2 h-32 lg:h-44 bg-gradient-to-br from-slate-800/80 to-slate-900 rounded-xl border border-slate-700/50 flex items-end p-4 gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="h-32 lg:h-44 bg-gradient-to-br from-slate-800/80 to-slate-900 rounded-xl border border-slate-700/50 p-4 flex flex-col justify-between">
                    <div className="text-xs text-slate-400 font-medium">AI Pipeline Status</div>
                    <div className="space-y-2">
                      {['Patient Data', 'Clinical Docs', 'Translation', 'Prediction'].map((step, i) => (
                        <div key={step} className="flex items-center gap-2">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + i * 0.15 }}
                            className="w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </motion.div>
                          <span className="text-xs text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ TECH STACK ════════ */}
      <section className="py-14 border-y border-slate-800/60 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-10">
            Built With Modern Tech Stack
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-5 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group flex flex-col items-center gap-2 sm:gap-3 select-none"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl bg-slate-800/80 border border-slate-700/50 group-hover:border-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-500/10 transition-all duration-300">
                  <img
                    src={tech.img}
                    alt={tech.name}
                    className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 transition-transform duration-300 group-hover:scale-110 ${'invert' in tech && tech.invert ? 'invert' : ''}`}
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-500 group-hover:text-slate-300 transition-colors text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {tech.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-950 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-slate-400 font-medium text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <ScribbleDivider className="my-0" />

      {/* ════════ FEATURES ════════ */}
      <section id="features" className="py-20 lg:py-28 relative">
        <FloatingOrbs />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="text-center mb-16">
            <HandwrittenLabel className="text-lg text-purple-400 mb-4">The Platform</HandwrittenLabel>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Six AI agents.<br className="hidden sm:block" /> One <span className="text-purple-400">seamless</span> pipeline.
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Each module is powered by specialized AI — working together to automate the entire clinical workflow.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {features.map((feat, i) => (
              <Reveal key={feat.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group relative p-6 lg:p-7 bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-500/30 transition-all duration-300 h-full"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feat.gradient} rounded-xl flex items-center justify-center shadow-lg mb-5`}>
                    <feat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{feat.desc}</p>
                  <button
                    onClick={() => setSelectedFeature(i)}
                    className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-purple-300"
                  >
                    Learn more <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Feature Detail Modal */}
        <AnimatePresence>
          {selectedFeature !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedFeature(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-purple-500/10 max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Gradient accent bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${features[selectedFeature].gradient}`} />

                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-700" />
                </div>

                <div className="p-5 sm:p-6 lg:p-8 overflow-y-auto flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${features[selectedFeature].gradient} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                        {(() => { const Icon = features[selectedFeature].icon; return <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />; })()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{features[selectedFeature].title}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 line-clamp-2">{features[selectedFeature].desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFeature(null)}
                      aria-label="Close feature details"
                      className="p-1.5 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex-shrink-0 ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 sm:mb-6">{features[selectedFeature].details.description}</p>

                  {/* Stat badge */}
                  <div className="flex items-center gap-3 mb-4 sm:mb-6 p-2.5 sm:p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400">{features[selectedFeature].details.stats.label}</p>
                      <p className="text-base sm:text-lg font-bold text-purple-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{features[selectedFeature].details.stats.value}</p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h4 className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2.5 sm:mb-3">Key Capabilities</h4>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {features[selectedFeature].details.highlights.map((item, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-slate-300"
                        >
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-800">
                    <Link
                      to="/register"
                      className="group inline-flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
                    >
                      Try it free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ════════ HOW IT WORKS (Pipeline Visual) ════════ */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-900/50 to-slate-950 relative overflow-hidden">
        <GridPattern />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal className="text-center mb-16">
            <span className="text-lg text-purple-400 mb-4 font-semibold tracking-wide uppercase text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>How It Works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              From patient visit to <span className="text-purple-400">research insight</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              A single click triggers our 6-step AI pipeline — automating every touchpoint of patient care.
            </p>
          </Reveal>

          <div className="relative max-w-3xl mx-auto">
            {/* Vertical line — centered on the step icons */}
            <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/80 via-purple-400 to-violet-500/80 hidden sm:block" style={{ transform: 'translateX(-0.5px)' }} />

            {[
              { step: '01', title: 'Patient Intake', desc: 'Retrieve comprehensive patient data, medical history, vitals, risk factors, allergies, current medications and lab results in a single unified view.' },
              { step: '02', title: 'AI Clinical Documentation', desc: 'Auto-generate structured SOAP notes, extract medical entities, and assign ICD-10 codes.' },
              { step: '03', title: 'Smart Translation', desc: 'Convert clinical documentation into patient-friendly language at their comprehension level.' },
              { step: '04', title: 'Predictive Analytics', desc: 'Run AI risk assessment across cardiovascular, metabolic, and other health categories.' },
              { step: '05', title: 'Workflow Automation', desc: 'Auto-schedule follow-ups, process claims, trigger lab orders, and send reminders.' },
              { step: '06', title: 'Research Synthesis', desc: 'Surface relevant medical literature and clinical trials based on patient conditions.' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.1}>
                <div className="flex items-start gap-5 lg:gap-7 mb-10 last:mb-0">
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span className="text-sm lg:text-base font-extrabold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.step}</span>
                  </div>
                  <div className="pt-1 lg:pt-2.5">
                    <h3 className="text-base lg:text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400 leading-relaxed max-w-lg">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ScribbleDivider className="my-0" />

      {/* ════════ BENEFITS ════════ */}
      <section id="benefits" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal>
              <HandwrittenLabel className="text-lg text-purple-400 mb-4">Why CareNet AI</HandwrittenLabel>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Built for <span className="text-purple-400">modern</span> healthcare teams
              </h2>
              <p className="mt-4 text-base text-slate-400 leading-relaxed">
                Stop drowning in paperwork. CareNet AI gives you back the time to practice medicine
                the way you intended focused on patient outcomes, not admin overhead.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <b.icon className="w-4.5 h-4.5 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 pt-1.5">{b.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all text-sm"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </Reveal>

            {/* Right: Abstract visual */}
            <Reveal delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 shadow-xl">
                  <div className="space-y-4">
                    {/* Mock notification cards */}
                    {[
                      { icon: Shield, title: 'HIPAA Compliant', sub: 'End-to-end encryption active', color: 'from-emerald-500 to-green-600', badge: 'Verified' },
                      { icon: Zap, title: 'Pipeline Complete', sub: '6 AI agents finished in 2.3s', color: 'from-primary-500 to-blue-600', badge: 'Success' },
                      { icon: Activity, title: 'Risk Alert Detected', sub: 'Cardiovascular risk: High (87%)', color: 'from-amber-500 to-orange-600', badge: 'Critical' },
                    ].map((card, i) => (
                      <motion.div
                        key={card.title}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className="flex items-center gap-4 p-4 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-md hover:shadow-purple-500/5 transition-shadow"
                      >
                        <div className={`w-11 h-11 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-sm`}>
                          <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{card.title}</p>
                          <p className="text-xs text-slate-500 truncate">{card.sub}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 2 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {card.badge}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <ScribbleDivider className="my-0" />

      {/* ════════ FAQ ════════ */}
      <section id="faq" className="py-20 lg:py-28 relative">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <Reveal className="text-center mb-12">
            <HandwrittenLabel className="text-lg text-purple-400 mb-4">FAQ</HandwrittenLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Frequently <span className="text-purple-400">asked</span> questions
            </h2>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <FAQItem
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFAQ === i}
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="relative bg-slate-950 border-t border-slate-800/60 overflow-hidden">
        {/* Giant brand text as background */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <motion.h2
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 0.06 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(5rem,18vw,16rem)] font-extrabold leading-[0.85] tracking-tighter text-white whitespace-nowrap"
              style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
            >
              CareNetAI
            </motion.h2>
          </div>
        </div>

        {/* Footer content overlaid on the giant text */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
            {/* Left column: brand + email */}
            <div className="md:col-span-5 space-y-6">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  CareNet<span className="text-purple-400">AI</span>
                </span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[280px]">
                AI-powered healthcare platform built for modern clinical workflows.
              </p>
              {/* Email input */}
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button className="px-4 py-2.5 bg-[#c8ff00] hover:bg-[#d4ff33] text-slate-950 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
                  Join for free
                </button>
              </div>
            </div>

            {/* Link columns */}
            {[
              { title: 'Product', links: ['Features', 'Pipeline', 'Pricing', 'Changelog'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'HIPAA', 'Security'] },
            ].map((col) => (
              <div key={col.title} className="md:col-span-3">
                <p className="text-sm font-semibold text-slate-200 mb-4">{col.title}</p>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} CareNet AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {[
                  { label: 'Instagram', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z' },
                  { label: 'Twitter', path: 'M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.38 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.32 3.91A12.16 12.16 0 013.15 4.83a4.28 4.28 0 001.33 5.71 4.24 4.24 0 01-1.94-.54v.05a4.28 4.28 0 003.44 4.2 4.27 4.27 0 01-1.93.07 4.29 4.29 0 004 2.98A8.59 8.59 0 012 19.54a12.13 12.13 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0024 5.06a8.54 8.54 0 01-2.54.7z' },
                  { label: 'Email', path: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
                ].map((icon) => (
                  <a
                    key={icon.label}
                    href="#"
                    aria-label={icon.label}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d={icon.path} /></svg>
                  </a>
                ))}
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-semibold text-emerald-400">
                <Shield className="w-3 h-3" /> HIPAA Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════ STICKY MOBILE CTA ════════ */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/60 px-4 py-3 safe-area-bottom">
        <Link
          to="/register"
          className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 text-sm"
        >
          Start Free Trial — No Credit Card
        </Link>
      </div>

      {/* ════════ EXIT-INTENT POPUP ════════ */}
      <AnimatePresence>
        {showExitPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowExitPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-3xl shadow-2xl shadow-purple-500/10 max-w-md w-full p-8 text-center relative border border-slate-700/50"
            >
              <button
                onClick={() => setShowExitPopup(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                aria-label="Close popup"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Wait! Don&apos;t miss out</h3>
              <p className="text-sm text-slate-400 mb-6">
                Get 14 days of full access — completely free. See how CareNet AI can save your team 3+ hours daily.
              </p>
              <Link
                to="/register"
                onClick={() => setShowExitPopup(false)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all text-sm"
              >
                Claim Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-4 text-xs text-slate-500">No credit card required</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
