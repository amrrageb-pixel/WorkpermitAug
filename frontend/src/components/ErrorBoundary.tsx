import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  language?: 'ar' | 'en' | 'zh';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleFullReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isAr = this.props.language === 'ar';
      return (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)',
              border: '1px solid #fed7aa',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Warning Icon */}
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>

            <h2
              style={{
                color: '#c2410c',
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 8px 0',
              }}
            >
              {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
            </h2>

            <p
              style={{
                color: '#78716c',
                fontSize: '13px',
                margin: '0 0 20px 0',
                lineHeight: '1.6',
              }}
            >
              {isAr
                ? 'حدث خطأ أثناء عرض هذا القسم. يمكنك المحاولة مرة أخرى أو إعادة تحميل الصفحة.'
                : 'An error occurred while rendering this section. You can try again or reload the page.'}
            </p>

            {/* Error details (collapsed) */}
            {this.state.error && (
              <details
                style={{
                  textAlign: 'start',
                  background: '#fafaf9',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '11px',
                  color: '#a8a29e',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#78716c' }}>
                  {isAr ? 'تفاصيل الخطأ (للمطورين)' : 'Error Details (for developers)'}
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    marginTop: '8px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack?.slice(0, 500)}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  background: '#ea580c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#c2410c')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#ea580c')}
              >
                {isAr ? '🔄 إعادة المحاولة' : '🔄 Try Again'}
              </button>
              <button
                onClick={this.handleFullReload}
                style={{
                  padding: '10px 24px',
                  background: 'white',
                  color: '#78716c',
                  border: '1px solid #d6d3d1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f5f5f4')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
              >
                {isAr ? '🔃 إعادة تحميل الصفحة' : '🔃 Reload Page'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
