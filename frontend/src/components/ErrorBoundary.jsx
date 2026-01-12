import React from 'react';

/**
 * ✅ FASE 19.1: Error Boundary para capturar erros do React
 * Impede que erros em um componente derrubem toda a aplicação
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  // ✅ CORREÇÃO: Método estático NÃO usa this.state
  static getDerivedStateFromError(error) {
    // Retorna novo estado sem acessar this
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para debugging
    console.error('🚨 ErrorBoundary capturou erro:', error);
    console.error('📋 Informações do erro:', errorInfo);
    
    // Atualizar estado com informações completas
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    // Recarregar a página
    window.location.reload();
  };

  handleReset = () => {
    // Resetar estado do error boundary
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '30px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #ff4444'
          }}>
            <h1 style={{ 
              color: '#ff4444', 
              marginBottom: '20px',
              fontSize: '2em'
            }}>
              ⚠️ Erro no Sistema
            </h1>
            
            <p style={{ 
              marginBottom: '20px',
              fontSize: '1.1em',
              color: '#ccc'
            }}>
              O sistema encontrou um erro inesperado.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#1a1a1a',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '20px',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <strong style={{ color: '#ff6b6b' }}>Erro:</strong>
                <pre style={{ 
                  color: '#ffdd57',
                  fontSize: '0.9em',
                  margin: '10px 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                </pre>
                
                {this.state.errorInfo && (
                  <>
                    <strong style={{ color: '#ff6b6b' }}>Stack:</strong>
                    <pre style={{ 
                      color: '#888',
                      fontSize: '0.8em',
                      margin: '10px 0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  fontSize: '1em',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                🔄 Recarregar Página
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  fontSize: '1em',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0b7dda'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
              >
                ↩️ Tentar Novamente
              </button>
            </div>

            <p style={{ 
              marginTop: '20px',
              fontSize: '0.9em',
              color: '#888'
            }}>
              💡 Dica: Verifique o console (F12) para mais detalhes
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
