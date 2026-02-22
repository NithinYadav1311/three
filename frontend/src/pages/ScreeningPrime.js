import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle, AlertCircle, Loader2, X, File,
  Briefcase, ChevronRight, ArrowRight, Download, Plus
} from 'lucide-react';
import JobFormDialog from '../components/JobFormDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import apiClient from '../utils/api';
import PrimeLayout from '../components/PrimeLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const ScreeningPrime = () => {
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [screening, setScreening] = useState(false);
  const [results, setResults] = useState([]);
  const [recentScreenings, setRecentScreenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
    loadRecentScreenings();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await apiClient.get('/jobs?status=active');
      setJobs(res.data);
    } catch (error) {
      console.error('Failed to load jobs', error);
      toast.error('Failed to load active jobs');
    }
  };

  const loadRecentScreenings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/screenings');
      setRecentScreenings(res.data);
    } catch (error) {
      console.error('Failed to load screenings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      
      if (validFiles.length !== newFiles.length) {
        toast.warning('Some files were skipped. Only PDF and DOCX are supported.');
      }
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleScreening = async () => {
    if (!selectedJob) {
      toast.error('Please select a job description first');
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please upload at least one resume');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // 1. Upload Resumes
      const uploadRes = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedResumes = uploadRes.data.resumes;
      const resumeIds = uploadedResumes.map(r => r.resume_id);

      // 2. Screen Resumes
      setScreening(true);
      setUploading(false);
      
      const screenRes = await apiClient.post('/resumes/screen', {
        job_id: selectedJob,
        resume_ids: resumeIds
      });

      setResults(screenRes.data.results);
      toast.success(`Successfully screened ${screenRes.data.results.length} candidates`);
      
      // Clear files after success
      setFiles([]);
      loadRecentScreenings();
      
    } catch (error) {
      console.error('Screening failed', error);
      toast.error(error.response?.data?.detail || 'Screening failed');
    } finally {
      setUploading(false);
      setScreening(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <PrimeLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Screening</h1>
            <p className="text-muted-foreground mt-2">
              Upload resumes and let AI rank them against your job descriptions.
            </p>
          </div>
          <Button variant="outline" onClick={loadRecentScreenings}>
            <FileText className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle>New Screening</CardTitle>
                <CardDescription>Select a job and upload resumes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Description</label>
                  <div className="flex gap-2">
                    <Select value={selectedJob} onValueChange={setSelectedJob}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a job..." />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map(job => (
                          <SelectItem key={job.job_id} value={job.job_id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setShowJobModal(true)}
                      title="Create New Job"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resumes (PDF/DOCX)</label>
                  <div 
                    className="
                      border-2 border-dashed border-border hover:border-primary/50 
                      rounded-xl p-8 text-center transition-all cursor-pointer
                      bg-background/50 hover:bg-elevated/50 relative
                    "
                  >
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.docx" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports multiple files
                    </p>
                  </div>
                </div>

                {/* File List */}
                <AnimatePresence>
                  {files.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {files.map((file, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-elevated/50 text-sm"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <File className="h-4 w-4 text-primary" />
                            <span className="truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <button 
                            onClick={() => removeFile(idx)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                <Button 
                  className="
                    w-full font-bold border-2 transition-all duration-300
                    dark:bg-transparent dark:text-[#D4AF37] dark:border-[#D4AF37]
                    dark:hover:bg-[#D4AF37] dark:hover:text-black
                    light:bg-transparent light:text-orange-600 light:border-orange-600
                    light:hover:bg-orange-600 light:hover:text-white
                    bg-transparent text-orange-600 border-orange-600
                    hover:bg-orange-600 hover:text-white
                  "
                  size="lg"
                  onClick={handleScreening}
                  disabled={uploading || screening || !selectedJob || files.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : screening ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Briefcase className="mr-2 h-4 w-4" /> Start Screening
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">Current Results</TabsTrigger>
                <TabsTrigger value="history">Recent History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-4 mt-4">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-elevated/20 rounded-xl border border-dashed border-border">
                    <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                    <p>No screening results yet</p>
                    <p className="text-sm opacity-60">Upload resumes to see AI analysis</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {results.map((result) => (
                      <motion.div
                        key={result.screening_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="hover:border-primary/50 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className={`
                                  h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg
                                  ${result.match_score >= 80 ? 'bg-green-500/20 text-green-500' : 
                                    result.match_score >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 
                                    'bg-red-500/20 text-red-500'}
                                `}>
                                  {result.match_score}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{result.candidate_name || 'Unknown Candidate'}</h3>
                                  <p className="text-sm text-muted-foreground">{result.filename}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant={result.recommended_action === 'Interview' ? 'default' : 'secondary'}>
                                      {result.recommended_action}
                                    </Badge>
                                    <Badge variant="outline">
                                      Match: {result.match_score}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedCandidate(result);
                                }}
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4 mt-4">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {recentScreenings.map((item) => (
                      <Card key={item.screening_id} className="hover:bg-elevated/50 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`
                              h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm
                              ${item.match_score >= 80 ? 'bg-green-500/10 text-green-500' : 
                                item.match_score >= 60 ? 'bg-yellow-500/10 text-yellow-500' : 
                                'bg-red-500/10 text-red-500'}
                            `}>
                              {item.match_score}
                            </div>
                            <div>
                              <p className="font-medium">{item.candidate_name || 'Candidate'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString()} • {item.job_title}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                             <Badge variant="outline">{item.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <JobFormDialog 
        open={showJobModal} 
        onOpenChange={setShowJobModal} 
        onSaved={() => {
          setShowJobModal(false);
          loadJobs();
        }} 
      />

      {/* Detailed Profile Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {selectedCandidate.candidate_name || 'Candidate Profile'}
                  </h2>
                  <p className="text-muted-foreground">{selectedCandidate.filename}</p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 hover:bg-elevated rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Score Card */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <Card className="bg-elevated/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Overall Match</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${
                        selectedCandidate.match_score >= 80 ? 'text-green-500' : 
                        selectedCandidate.match_score >= 60 ? 'text-yellow-500' : 
                        'text-red-500'
                      }`}>
                        {selectedCandidate.match_score}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-elevated/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Skills</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        {selectedCandidate.skills_score || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-elevated/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Experience</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        {selectedCandidate.experience_score || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-elevated/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Keywords</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        {selectedCandidate.keyword_score || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation */}
              <div className="mb-6">
                <Badge 
                  variant={selectedCandidate.recommended_action === 'Interview' ? 'default' : 'secondary'}
                  className="text-sm px-4 py-1"
                >
                  Recommendation: {selectedCandidate.recommended_action}
                </Badge>
              </div>

              {/* Summary */}
              <Card className="mb-6 bg-elevated/30">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    {selectedCandidate.summary || 'No summary available'}
                  </p>
                </CardContent>
              </Card>

              {/* Detailed Analysis */}
              {selectedCandidate.detailed_analysis && (
                <Card className="mb-6 bg-elevated/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                      {selectedCandidate.detailed_analysis}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-500">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(selectedCandidate.strengths && selectedCandidate.strengths.length > 0) ? (
                      <ul className="space-y-2">
                        {selectedCandidate.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No strengths identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-red-500/5 border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-500">Gaps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(selectedCandidate.gaps && selectedCandidate.gaps.length > 0) ? (
                      <ul className="space-y-2">
                        {selectedCandidate.gaps.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No gaps identified</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Key Highlights */}
              {selectedCandidate.key_highlights && selectedCandidate.key_highlights.length > 0 && (
                <Card className="bg-elevated/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Key Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedCandidate.key_highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PrimeLayout>
  );
};

export default ScreeningPrime;
