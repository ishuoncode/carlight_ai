'use client';
import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-6">
          <div className="text-9xl font-bold text-blue-200 mb-2">404</div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100">
            <i className="pi pi-search text-4xl text-blue-600"></i>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 mb-6 text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-col">
          <Link href="/">
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Back to Home
            </button>
          </Link>
          <Link href="/#services">
            <button className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              View Services
            </button>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Lost? Here are some helpful links:</p>
          <div className="flex flex-col gap-2">
            <Link href="/#booking" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Book a Service
            </Link>
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
