/**
 * ✅ FASE 18.7: Função de Debounce
 * Evita execução excessiva de funções durante interações rápidas
 */

/**
 * Debounce function
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em milissegundos
 * @param {boolean} immediate - Se true, executa imediatamente na primeira chamada
 * @returns {Function} Função com debounce aplicado
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function
 * @param {Function} func - Função a ser executada
 * @param {number} limit - Intervalo mínimo entre execuções em milissegundos
 * @returns {Function} Função com throttle aplicado
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

