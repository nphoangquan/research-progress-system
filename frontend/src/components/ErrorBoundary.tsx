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
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="text-red-600 mr-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Đã xảy ra lỗi</h2>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Xin lỗi, đã xảy ra lỗi không mong muốn. Vui lòng thử làm mới trang hoặc thử lại.
            </p>
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-base"
              >
                Làm mới Trang
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-base"
              >
                Thử lại
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6" open>
                <summary className="text-base font-semibold text-gray-800 cursor-pointer hover:text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Chi tiết Lỗi (Chế độ phát triển)
                </summary>
                <div className="mt-4 space-y-4">
                  {this.state.error.message && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                      <p className="text-base font-bold text-red-900 mb-2">Thông báo lỗi:</p>
                      <p className="text-base text-red-800 font-mono break-words">{this.state.error.message}</p>
                    </div>
                  )}
                  {this.state.error.stack && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                      <p className="text-base font-bold text-red-900 mb-3">Stack Trace:</p>
                      <pre className="text-sm text-red-700 whitespace-pre-wrap break-words overflow-auto max-h-[600px] font-mono bg-red-100 p-4 rounded border border-red-200">
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
