import React, { useState } from 'react';
import { UploadResult } from '../types';
import { uploadFile } from '../services/api';

const ImageUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const data = await uploadFile(file);
      setUploadResult(data);
    } catch (error) {
      console.error('Error:', error);
      setUploadResult({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select an image to upload:
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!file}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Upload Image
        </button>
      </form>
      
      {uploadResult && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(uploadResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
