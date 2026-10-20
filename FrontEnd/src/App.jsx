import React, { useState } from 'react';
import { 
  Upload, FileText, Award, Briefcase, 
  GraduationCap, Mail, Phone, Sparkles, RefreshCw, Code, AlertCircle
} from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState(null);

  // Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Real API Call to FastAPI Backend
  const handleUploadAndParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setLoadingStep('Uploading document & processing with Gemini 3.8 Flash...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse resume from backend');
      }

      const data = await response.json();
      setParsedData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error parsing file. Please ensure your FastAPI backend is running.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                AI Resume Parser
              </h1>
              <p className="text-xs text-slate-400">Gemini 3.8 Flash & Pydantic Engine</p>
            </div>
          </div>
          {parsedData && (
            <button 
              onClick={handleReset}
              className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Upload Another CV</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* EMPTY STATE / UPLOAD SCREEN */}
        {!parsedData && !loading && (
          <div className="max-w-xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Upload Your Resume or CV</h2>
              <p className="text-sm text-slate-400">
                Securely extract structured JSON data with strict Pydantic validation. Supports PDF, DOCX, and TXT.
              </p>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-10 text-center bg-slate-900/40 transition group cursor-pointer shadow-xl">
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf,.docx,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition duration-300 shadow-md border border-slate-700">
                <Upload className="w-8 h-8" />
              </div>

              {file ? (
                <div>
                  <p className="font-medium text-white mb-1 flex items-center justify-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>{file.name}</span>
                  </p>
                  <p className="text-xs text-emerald-400 font-medium">File ready for analysis</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-1">
                    Drag and drop your file here, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500">PDF, DOCX up to 10MB</p>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={handleUploadAndParse}
                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Parse CV with Gemini AI</span>
              </button>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="max-w-md mx-auto text-center py-24">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-lg font-medium text-white mb-2">Analyzing Document</h3>
            <p className="text-sm text-indigo-400 animate-pulse">{loadingStep}</p>
          </div>
        )}

        {/* POPULATED DASHBOARD VIEW */}
        {parsedData && !loading && (
          <div className="space-y-8">
            
            {/* Top Bar Controls */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-medium text-slate-300">Pydantic Schema Validation: <strong className="text-emerald-400">Passed</strong></span>
              </div>
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Code className="w-4 h-4 text-indigo-400" />
                <span>{showJson ? "Hide Raw JSON" : "View Raw JSON"}</span>
              </button>
            </div>

            {/* RAW JSON VIEW */}
            {showJson && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Validated JSON Payload</h4>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl text-xs text-indigo-300 overflow-x-auto font-mono border border-slate-800/80">
                  {JSON.stringify(parsedData, null, 2)}
                </pre>
              </div>
            )}

            {/* PROFILE OVERVIEW CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start space-x-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30">
                    {parsedData.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{parsedData.full_name}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center space-x-1.5">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span>{parsedData.email}</span>
                      </span>
                      {parsedData.phone && (
                        <span className="flex items-center space-x-1.5">
                          <Phone className="w-4 h-4 text-indigo-400" />
                          <span>{parsedData.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Badge */}
                <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Overall Fit Score</p>
                    <p className="text-xl font-extrabold text-emerald-400">{parsedData.overall_fit_score} / 100</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* TWO COLUMN GRID: SKILLS & EDUCATION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* SKILLS SECTION */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 mb-5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Extracted Skills & Competencies</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-slate-700/80 text-xs font-medium text-slate-200 transition"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* EDUCATION SECTION */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center space-x-2.5 mb-5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Education</h3>
                </div>
                <div className="space-y-4">
                  {parsedData.education.map((edu, index) => (
                    <div key={index} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      {edu}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* EXPERIENCE TIMELINE SECTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center space-x-2.5 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Professional Experience</h3>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
                {parsedData.experience.map((exp, index) => (
                  <div key={index} className="relative pl-10">
                    <div className="absolute left-2.5 -translate-x-1/2 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">{exp.role} <span className="text-indigo-400">@ {exp.company}</span></h4>
                        <span className="text-xs font-medium text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 w-fit mt-1 sm:mt-0">{exp.duration}</span>
                      </div>
                      <ul className="space-y-1.5 mt-3">
                        {exp.key_responsibilities.map((resp, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}