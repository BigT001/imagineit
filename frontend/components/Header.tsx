import React from 'react';
import { testBackendConnection, checkBlenderVersion } from '../services/api';

interface HeaderProps {
  onRefreshJobs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRefreshJobs }) => {
  const testBackend = async () => {
    try {
      const data = await testBackendConnection();
      alert(JSON.stringify(data));
    } catch (error) {
      alert(`Error connecting to backend: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const checkBlender = async () => {
    try {
      const data = await checkBlenderVersion();
      alert(JSON.stringify(data));
    } catch (error) {
      alert(`Error checking Blender: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-4">ImagineIt</h1>
      <p className="mb-6">Generate amazing social media videos from your prompts</p>
      
      <div className="flex space-x-4 justify-center">
        <button 
          onClick={testBackend}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Backend
        </button>
        <button 
          onClick={checkBlender}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Check Blender
        </button>
        <button 
          onClick={onRefreshJobs}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Refresh Jobs
        </button>
      </div>
    </div>
  );
};

export default Header;
