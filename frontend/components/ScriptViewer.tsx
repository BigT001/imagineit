"use client";

import { useState, useEffect } from 'react';

interface Scene {
  description: string;
  duration: number;
}

interface Script {
  title: string;
  prompt: string;
  scenes: Scene[];
}

interface ScriptViewerProps {
  jobId: string;
}

const ScriptViewer = ({ jobId }: ScriptViewerProps) => {
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScript = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/script/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setScript(data.script);
        } else {
          setError(data.message || 'Failed to load script');
        }
      } catch (err) {
        setError('Error fetching script');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-indigo-500">Loading script...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error}
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-8 text-gray-500">
        Script not available yet. It will appear here once generated.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-indigo-700 mb-3">
        {script.title}
      </h3>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-500 mb-1">Original Prompt:</h4>
        <p className="text-gray-700 italic border-l-4 border-gray-200 pl-3 py-1">
          "{script.prompt}"
        </p>
      </div>
      
      <div className="border-t border-gray-200 my-4"></div>
      
      <h4 className="text-lg font-medium text-gray-900 mb-3">Scenes</h4>
      
      <div className="space-y-4">
        {script.scenes.map((scene, index) => (
          <div 
            key={index} 
            className="border rounded-md p-3 bg-white shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-medium text-gray-900">
                Scene {index + 1}
              </h5>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                {scene.duration}s
              </span>
            </div>
            <p className="text-gray-700 text-sm">
              {scene.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-sm text-gray-500 mt-4">
        <span>Total Duration: {script.scenes.reduce((total, scene) => total + scene.duration, 0)} seconds</span>
        <span>{script.scenes.length} scenes</span>
      </div>
    </div>
  );
};

export default ScriptViewer;
