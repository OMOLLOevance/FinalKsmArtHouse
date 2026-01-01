'use client';

import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onContinue?: () => void;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onContinue
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onContinue || onClose}
              className="px-6"
            >
              Continue
            </Button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SuccessDialog;