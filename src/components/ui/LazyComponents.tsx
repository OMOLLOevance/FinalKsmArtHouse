import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Lazy load heavy components
export const LazyCustomerManager = lazy(() => import('../features/events/CustomerManager'));
export const LazyCateringManager = lazy(() => import('../features/events/CateringManager'));
export const LazyQuotationManager = lazy(() => import('../features/events/QuotationManager'));
export const LazyEventCategoryManager = lazy(() => import('../features/events/EventCategoryManager'));
export const LazyEventPaymentForm = lazy(() => import('../features/events/EventPaymentForm'));


interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyComponentProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};