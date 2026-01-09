import { useState } from 'react';

/**
 * Componente de Tooltip para ajuda contextual
 */
export default function Tooltip({ text, children, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div
          className={`absolute z-50 ${positionClasses[position]} px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap`}
        >
          {text}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Componente de Ajuda Contextual (ícone de interrogação)
 */
export function HelpIcon({ text }) {
  return (
    <Tooltip text={text}>
      <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold text-gray-500 bg-gray-200 rounded-full cursor-help hover:bg-gray-300">
        ?
      </span>
    </Tooltip>
  );
}

