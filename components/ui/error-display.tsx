'use client';

import * as React from 'react';
import { AlertCircle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message,
  details,
  type = 'error',
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(false);

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'border-red-200 bg-red-50',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          container: 'border-yellow-200 bg-yellow-50',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      case 'info':
        return {
          container: 'border-blue-200 bg-blue-50',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      default:
        return {
          container: 'border-gray-200 bg-gray-50',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Card className={`${styles.container} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className={`h-5 w-5 ${styles.icon} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <CardTitle className={`text-sm font-medium ${styles.title}`}>
                {title}
              </CardTitle>
              <p className={`text-sm ${styles.message} mt-1`}>
                {message}
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {(details || showDetails) && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {details && (
              <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                <strong>Details:</strong> {details}
              </div>
            )}
            
            {showDetails && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs p-0 h-auto font-normal"
                >
                  {expanded ? 'Hide' : 'Show'} technical details
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                
                {expanded && (
                  <div className="text-xs text-gray-500 bg-white p-3 rounded border font-mono">
                    <div>Error Type: {type}</div>
                    <div>Timestamp: {new Date().toLocaleString()}</div>
                    <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
                  </div>
                )}
              </div>
            )}
            
            {onRetry && (
              <div className="flex space-x-2">
                <Button
                  onClick={onRetry}
                  size="sm"
                  className={`${styles.button} text-xs`}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface ValidationErrorDisplayProps {
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  onDismiss?: () => void;
  className?: string;
}

export function ValidationErrorDisplay({
  errors,
  onDismiss,
  className = ''
}: ValidationErrorDisplayProps) {
  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-sm font-medium text-red-800">
                Validation Failed
              </CardTitle>
              <p className="text-sm text-red-700 mt-1">
                Please check the following fields and try again:
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="text-sm bg-white p-2 rounded border border-red-200">
              <div className="font-medium text-red-800 capitalize">
                {error.field.replace(/([A-Z])/g, ' $1').trim()}:
              </div>
              <div className="text-red-700 mt-1">
                {error.message}
              </div>
              {error.value && (
                <div className="text-xs text-gray-500 mt-1 font-mono">
                  Current value: {JSON.stringify(error.value)}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


