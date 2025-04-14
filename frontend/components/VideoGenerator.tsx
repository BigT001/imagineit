import React, { useState } from 'react';
import { GenerateResult } from '../types';
import { generateVideo } from '../services/api';

interface VideoGeneratorProps {
  onJobCreated: (jobId: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onJobCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert('Please enter a description for your video');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      // Fix: Only pass the prompt parameter
      const data = await generateVideo(prompt);
      setResult(data);
      
      if (data.status === 'success' && data.job_id) {
        onJobCreated(data.job_id);
        // Clear the form after successful submission
        setPrompt('');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Generate Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Describe your video:
            <textarea
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want in your video. Be specific about scenes, style, and content."
              required
            />
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Duration (seconds):
              <input
                type="number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                min="10"
                max="120"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Style:
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="cinematic">Cinematic</option>
                <option value="modern">Modern</option>
                <option value="vintage">Vintage</option>
                <option value="minimalist">Minimalist</option>
                <option value="energetic">Energetic</option>
              </select>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Video'
          )}
        </button>
      </form>
      
      {result && (
        <div className={`mt-4 p-3 rounded ${result.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium">{result.message}</p>
          {result.job_id && (
            <p className="text-sm mt-1">
              Job ID: <span className="font-mono">{result.job_id}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
