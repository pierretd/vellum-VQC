'use client';
import { useState, useEffect } from "react";

interface SectionScores {
  totalScore: number;
  contentClarity: number;
  instructionalStructure: number;
  engagement: number;
  language: number;
  additionalValue: number;
}

interface TranscriptEntry {
  jobDescription: string;
  jobVideo?: string;
  videoFilename?: string;
  score: SectionScores;
  feedback: string;
  transcript: string;
  timestamp: string;
  warnings: string[];
}

interface Project {
  id: string;
  name: string;
  transcripts: TranscriptEntry[];
}

// Add this helper function to determine score status
const getScoreStatus = (score: number, threshold: number, max: number) => {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return 'green';
  if (score >= threshold) return 'yellow';
  return 'red';
};

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [score, setScore] = useState(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [jobVideo, setJobVideo] = useState<string | null>(null);
  const [videoProcessed, setVideoProcessed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load projects from localStorage on component mount
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        // Ensure each project has a transcripts array
        const validatedProjects = parsed.map((project: Project) => ({
          ...project,
          transcripts: Array.isArray(project.transcripts) ? project.transcripts : []
        }));
        setProjects(validatedProjects);
      } catch (e) {
        console.error('Error loading projects:', e);
        setProjects([]);
      }
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      transcripts: []
    };
    
    saveProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowNewProjectInput(false);
  };

  const processVideo = async (file: File) => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      setLoading(true);
      console.log('Processing video:', file.name);
      
      const response = await fetch('/api/process-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Video processing response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to process video');
      }

      if (!data.description) {
        throw new Error('No video description received from server');
      }

      setJobVideo(data.description);
      setVideoFile(file);
      setVideoProcessed(true);
    } catch (error) {
      console.error('Error processing video:', error);
      setError(error instanceof Error ? error.message : 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      setError('Please select or create a project first');
      return;
    }
    
    setLoading(true);
    setError(null);
    const currentTimestamp = new Date().toLocaleString();
    setTimestamp(currentTimestamp);
    
    try {
      const payload = {
        jobDescription,
        jobVideo: jobVideo || ''
      };

      console.log('Sending payload:', payload);

      const response = await fetch('/api/score-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || data.details || 'Failed to process transcript');
      }
      
      console.log('Received score data:', data);
      
      if (!data.score) {
        throw new Error('No score received from API');
      }
      
      setScore(data.score);

      // Add logging to debug warnings
      console.log('Warnings from API:', data.warnings);

      // Update the project with both transcript and video description
      const updatedProjects = projects.map(project => {
        if (project.id === currentProject.id) {
          const newTranscript = {
            jobDescription: jobDescription,
            jobVideo: jobVideo || '',
            videoFilename: videoFile?.name,
            score: data.score,
            feedback: data.feedback,
            transcript: jobDescription,
            timestamp: currentTimestamp,
            warnings: data.warnings || []
          };
          console.log('New transcript entry:', newTranscript); // Debug log
          return {
            ...project,
            transcripts: [...project.transcripts, newTranscript]
          };
        }
        return project;
      });

      saveProjects(updatedProjects);
      setCurrentProject(updatedProjects.find(p => p.id === currentProject.id) || null);
      
      // Update warnings state
      if (data.warnings) {
        console.log('Setting warnings:', data.warnings);
        setWarnings(data.warnings);
      } else {
        console.log('No warnings received');
        setWarnings([]);
      }
      
    } catch (error) {
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!currentProject) return;

    const content = currentProject.transcripts.map(entry => (
      `Transcript Analysis
Date: ${entry.timestamp}

Scores:
Total Score: ${entry.score.totalScore}/100
Content Clarity: ${entry.score.contentClarity}/30
Instructional Structure: ${entry.score.instructionalStructure}/20
Engagement: ${entry.score.engagement}/20
Language: ${entry.score.language}/20
Additional Value: ${entry.score.additionalValue}/10

Detailed Feedback:
${entry.feedback}

Original Transcript:
${entry.transcript}

${entry.jobVideo ? `Video Analysis:\n${entry.jobVideo}` : 'No video analysis available'}
----------------------------------------
`
    )).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}-transcripts-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = (entry: TranscriptEntry) => {
    const content = `Transcript Analysis
Date: ${entry.timestamp}

Scores:
Total Score: ${entry.score.totalScore}/100
Content Clarity: ${entry.score.contentClarity}/30
Instructional Structure: ${entry.score.instructionalStructure}/20
Engagement: ${entry.score.engagement}/20
Language: ${entry.score.language}/20
Additional Value: ${entry.score.additionalValue}/10

Detailed Feedback:
${entry.feedback}

Original Transcript:
${entry.transcript}

${entry.jobVideo ? `Video Analysis:\n${entry.jobVideo}` : 'No video analysis available'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date(entry.timestamp).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSortedTranscripts = (transcripts: TranscriptEntry[]) => {
    return [...transcripts].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? 
          b.score.totalScore - a.score.totalScore : 
          a.score.totalScore - b.score.totalScore;
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
      // If shift is pressed, allow default behavior (new line)
    }
  };

  const toggleCard = (index: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-3xl">
        <h1 className="text-2xl font-bold">Technical Video Scoring Tool</h1>
        
        {error && (
          <div className="w-full p-4 border border-red-500 rounded-lg bg-red-50 text-red-600">
            {error}
          </div>
        )}

        <div className="w-full space-y-4">
          <div className="flex gap-4">
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const selected = projects.find(p => p.id === e.target.value);
                setCurrentProject(selected || null);
              }}
              className="flex-1 p-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project?.transcripts?.length || 0} transcripts)
                </option>
              ))}
            </select>
            
            {showNewProjectInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="p-2 border rounded-lg dark:bg-gray-800"
                />
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewProjectInput(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg"
              >
                New Project
              </button>
            )}
          </div>
        </div>
        
        <div className="w-full">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setVideoFile(file);
                processVideo(file);
              }
            }}
            className="w-full p-2 border rounded-lg dark:bg-gray-800"
            disabled={loading}
          />
          {loading && <div className="mt-2">Processing video...</div>}
          {videoProcessed && !loading && (
            <div className="mt-2 p-2 text-green-600">
              ✓ Video processed successfully
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-64 p-4 border rounded-lg dark:bg-gray-800"
            placeholder="Paste your transcript here..."
            required
          />
          
          <button
            type="submit"
            disabled={loading || !currentProject}
            className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Score My Video'}
          </button>
        </form>

        {currentProject && currentProject.transcripts.length > 0 && (
          <div className="w-full p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-xl font-semibold">
                Project: {currentProject.name}
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                  className="px-2 py-1 border rounded-lg text-sm dark:bg-gray-800"
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-2 py-1 border rounded-lg text-sm dark:bg-gray-800"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {getSortedTranscripts(currentProject.transcripts).map((entry, index) => (
                <div key={index} className="p-4 border rounded-lg hover:border-gray-400 transition-colors">
                  <div className="grid gap-4">
                    <div 
                      className="flex justify-between items-start cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                      onClick={() => toggleCard(index.toString())}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-lg flex items-center gap-2">
                          Total Score: {entry.score.totalScore}
                          <span className={`w-3 h-3 rounded-full ${
                            getScoreStatus(entry.score.totalScore, 50, 100) === 'green' 
                              ? 'bg-green-500' 
                              : getScoreStatus(entry.score.totalScore, 50, 100) === 'yellow'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}/>
                          <span className="text-sm text-gray-500 ml-2 group-hover:text-blue-500 transition-colors">
                            {expandedCards[index.toString()] ? '(Click to collapse)' : '(Click to expand)'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Analysis completed: {entry.timestamp}
                          {entry.videoFilename && (
                            <span className="ml-2 text-gray-500">
                              • Video: {entry.videoFilename}
                            </span>
                          )}
                        </div>
                        {!expandedCards[index.toString()] && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {entry.feedback ? `${entry.feedback.substring(0, 200)}...` : 'No feedback available'}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingle(entry);
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        Download
                      </button>
                    </div>

                    {expandedCards[index.toString()] && (
                      <>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-medium mb-2">Detailed Feedback:</div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {entry.feedback || 'No feedback available'}
                          </p>
                        </div>

                        {entry.warnings && entry.warnings.length > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                            <div className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                              Warnings:
                            </div>
                            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                              {entry.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Content Clarity
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                getScoreStatus(entry.score.contentClarity, 15, 30) === 'green'
                                  ? 'bg-green-500'
                                  : getScoreStatus(entry.score.contentClarity, 15, 30) === 'yellow'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}/>
                            </div>
                            <div>{entry.score.contentClarity}/30</div>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Instructional Structure
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                getScoreStatus(entry.score.instructionalStructure, 10, 20) === 'green'
                                  ? 'bg-green-500'
                                  : getScoreStatus(entry.score.instructionalStructure, 10, 20) === 'yellow'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}/>
                            </div>
                            <div>{entry.score.instructionalStructure}/20</div>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Engagement
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                getScoreStatus(entry.score.engagement, 10, 20) === 'green'
                                  ? 'bg-green-500'
                                  : getScoreStatus(entry.score.engagement, 10, 20) === 'yellow'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}/>
                            </div>
                            <div>{entry.score.engagement}/20</div>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Language
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                getScoreStatus(entry.score.language, 10, 20) === 'green'
                                  ? 'bg-green-500'
                                  : getScoreStatus(entry.score.language, 10, 20) === 'yellow'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}/>
                            </div>
                            <div>{entry.score.language}/20</div>
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Additional Value
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                getScoreStatus(entry.score.additionalValue, 5, 10) === 'green'
                                  ? 'bg-green-500'
                                  : getScoreStatus(entry.score.additionalValue, 5, 10) === 'yellow'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}/>
                            </div>
                            <div>{entry.score.additionalValue}/10</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleDownload}
              className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Download All Transcripts
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
