'use client';

import React from 'react';
import { ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useTransactionStatus, getTransactionStatusText, getTransactionStatusColor } from '../../hooks/use-transaction-status';

interface TransactionStatusProps {
  hash?: `0x${string}`;
  type?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function TransactionStatus({ hash, type = 'Transaction', onSuccess, onError }: TransactionStatusProps) {
  const { status, explorerUrl, error } = useTransactionStatus(hash);

  // Handle callbacks
  React.useEffect(() => {
    if (status === 'success' && onSuccess) {
      onSuccess();
    }
    if (status === 'error' && error && onError) {
      onError(error);
    }
  }, [status, error, onSuccess, onError]);

  if (!hash) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'confirming':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <div>
          <p className={`text-sm font-medium ${getTransactionStatusColor(status)}`}>
            {getTransactionStatusText(status, type)}
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1">
              {error.message || 'Transaction failed'}
            </p>
          )}
        </div>
      </div>
      
      {explorerUrl && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(explorerUrl, '_blank', 'noopener,noreferrer')}
          className="flex items-center space-x-1"
        >
          <ExternalLink className="h-3 w-3" />
          <span>View</span>
        </Button>
      )}
    </div>
  );
}

// Simple loading spinner component
export function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin`} />
  );
}