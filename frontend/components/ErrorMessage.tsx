import React from 'react';

interface ErrorMessageProps {
  message: string;
  details?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, details }) => {
  return (
    <div className="p-4 bg-red-100 text-red-700 rounded-md">
      <p className="font-medium">{message}</p>
      {details && <p className="text-sm mt-1">{details}</p>}
    </div>
  );
};

export default ErrorMessage;
