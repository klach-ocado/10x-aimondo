import { useState } from 'react';

export const useHeatmap = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return {
    isLoading,
    error,
  };
};
