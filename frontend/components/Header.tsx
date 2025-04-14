import React, { useState } from 'react';
import { testBackendConnection, checkBlenderVersion } from '../services/api';

interface HeaderProps {
  onRefreshJobs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRefreshJobs }) => {
  const [testingBackend, setTestingBackend] = useState(false);
  const [testingBlender, setTestingBlender] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testBackend = async () => {
    setTestingBackend(true);
    setTestResult(null);
    
    try {
      const data = await testBackendConnection();
      setTestResult({
        success: data.status === 'success',
        message: `Backend connection successful: ${data.message}`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error connecting to backend: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setTestingBackend(false);
    }
  };

  const checkBlender = async () => {
    setTestingBlender(true);
    setTestResult(null);
    
    try {
      const data = await checkBlenderVersion();
      setTestResult({
        success: data.status === 'success',
        message: `Blender check successful: ${data.version?.trim() || 'Version information not available'}`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error checking Blender: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setTestingBlender(false);
    }
  };

  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-2">ImagineIt</h1>
      <p className="mb-6 text-gray-600">Generate amazing social media videos from your prompts</p>
      
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <button
          onClick={testBackend}
          disabled={testingBackend}
          className={`px-4 py-2 rounded text-white flex items-center ${
            testingBackend ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {testingBackend && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Test Backend
        </button>
        
        <button
          onClick={checkBlender}
          disabled={testingBlender}
          className={`px-4 py-2 rounded text-white flex items-center ${
            testingBlender ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {testingBlender && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Check Blender
        </button>
        
        <button
          onClick={onRefreshJobs}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Refresh Jobs
        </button>
      </div>
      
      {testResult && (
        <div className={`p-3 rounded mb-6 ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
};

export default Header;
