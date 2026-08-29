'use client';
import React, { Component } from 'react';
import Link from 'next/link';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
                <i className="pi pi-bug text-5xl text-red-600"></i>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Application Error
            </h1>

            <p className="text-gray-600 mb-4 text-lg">
              Something went wrong in this component. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-left">
                <summary className="font-semibold text-red-800 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-sm font-mono text-red-800 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex gap-3 flex-col">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link href="/">
                <button className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}