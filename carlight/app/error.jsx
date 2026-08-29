'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
            <i className="pi pi-exclamation-circle text-5xl text-red-600"></i>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Oops! Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 mb-4 text-lg">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>

        {/* Error Details (Development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <Link href="/" className="flex-1">
            <button className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              Back to Home
            </button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Need help?</p>
          <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
