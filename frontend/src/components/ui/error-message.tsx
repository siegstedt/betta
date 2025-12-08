import React from 'react';
import { Button } from './button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-center p-4 bg-destructive/10 border border-destructive/20 rounded-md ${className}`}
    >
      <AlertCircle className="h-5 w-5 text-destructive mr-3 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-destructive font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-3">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
