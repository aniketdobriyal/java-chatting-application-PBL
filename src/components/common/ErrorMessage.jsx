import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorMessage = ({ message = 'An error occurred', onRetry }) => {
  return (
    <div className="flex items-start p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm gap-3 my-2">
      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-rose-800">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1.5 underline underline-offset-2 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Try Again
          </button>
        )}
      </div>
    </div>
  );
};
