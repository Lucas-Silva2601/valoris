import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../hooks/useToast';

describe('useToast', () => {
  it('deve inicializar com array vazio de toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('deve adicionar toast quando showToast é chamado', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Teste', 'info');
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].message).toBe('Teste');
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('deve remover toast quando removeToast é chamado', () => {
    const { result } = renderHook(() => useToast());

    let toastId;
    act(() => {
      toastId = result.current.showToast('Teste', 'info');
    });

    expect(result.current.toasts.length).toBe(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts.length).toBe(0);
  });

  it('deve ter helpers para tipos específicos', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Sucesso!');
      result.current.showError('Erro!');
      result.current.showWarning('Aviso!');
      result.current.showInfo('Info!');
    });

    expect(result.current.toasts.length).toBe(4);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('warning');
    expect(result.current.toasts[3].type).toBe('info');
  });
});

