import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-red-600 mr-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Đã xảy ra lỗi</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Xin lỗi, đã xảy ra lỗi không mong muốn. Vui lòng thử làm mới trang hoặc thử lại.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Làm mới Trang
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Thử lại
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4" open>
                <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 mb-2">
                  Chi tiết Lỗi (Chế độ phát triển)
                </summary>
                <div className="mt-2 space-y-2">
                  {this.state.error.message && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm font-semibold text-red-800 mb-1">Thông báo lỗi:</p>
                      <p className="text-sm text-red-700">{this.state.error.message}</p>
                    </div>
                  )}
                  {this.state.error.stack && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm font-semibold text-red-800 mb-2">Stack Trace:</p>
                      <pre className="text-xs text-red-600 whitespace-pre-wrap break-words overflow-auto max-h-96">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
