import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import WalletDisplay from '../../components/WalletDisplay';

// Mock do fetch
global.fetch = vi.fn();

describe('WalletDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('userId', 'test-user-id');
    localStorage.setItem('username', 'testuser');
  });

  it('deve renderizar componente de carteira', () => {
    render(<WalletDisplay />);
    expect(screen.getByText(/Carteira/i)).toBeInTheDocument();
  });

  it('deve exibir saldo quando carregado', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ balance: 10000 })
    });

    render(<WalletDisplay />);

    await waitFor(() => {
      expect(screen.getByText(/10.000/i)).toBeInTheDocument();
    });
  });

  it('deve exibir estado de loading inicialmente', () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // Nunca resolve

    render(<WalletDisplay />);
    // Verificar se há indicador de loading
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
  });
});

