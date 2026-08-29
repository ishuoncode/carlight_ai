'use client';
import React from 'react';

export function ErrorAlert({ message, onDismiss, title = 'Error', variant = 'error' }) {
  if (!message) return null;

  const variants = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const icons = {
    error: 'pi pi-exclamation-circle',
    warning: 'pi pi-exclamation-triangle',
    info: 'pi pi-info-circle',
    success: 'pi pi-check-circle'
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${variants[variant]}`} role="alert">
      <i className={`${icons[variant]} text-lg mt-0.5 flex-shrink-0`}></i>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <i className="pi pi-times"></i>
        </button>
      )}
    </div>
  );
}

export function InlineError({ message, className = '' }) {
  if (!message) return null;
  return (
    <p className={`text-red-600 text-sm mt-1 ${className}`} role="alert">
      <i className="pi pi-exclamation-circle mr-1"></i>
      {message}
    </p>
  );
}

export function FormFieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-red-600 text-sm mt-1.5" role="alert">
      <i className="pi pi-exclamation-circle mr-1"></i>
      {message}
    </p>
  );
}

export function PageError({ message, onRetry, title = 'Error' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <i className="pi pi-exclamation-circle text-3xl text-red-600"></i>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          <i className="pi pi-refresh mr-2"></i>
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No Data', message = 'There is nothing to show here.', icon = 'pi pi-inbox', action }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <i className={`${icon} text-3xl text-gray-400`}></i>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}