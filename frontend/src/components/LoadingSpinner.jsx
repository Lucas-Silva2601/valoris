export default function LoadingSpinner({ size = 'md', text = 'Carregando...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-500`}
      ></div>
      {text && (
        <p className="mt-2 text-gray-400 text-sm">{text}</p>
      )}
    </div>
  );
}

