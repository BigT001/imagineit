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
    setLoading(true);
    
    try {
      const data = await generateVideo(prompt, parseInt(duration.toString()), style);
      setResult(data);
      
      if (data.status === 'success' && data.job_id) {
        onJobCreated(data.job_id);
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
                onChange={(e) => setDuration(parseInt(e.target.value))}
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
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Generating...' : 'Generate Video'}
        </button>
      </form>
      
      {result && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
