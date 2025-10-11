import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import React from "react";

interface RefreshButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick, isDisabled }) => {
  return (
    <Button onClick={onClick} disabled={isDisabled}>
      <RefreshCw className={`mr-2 h-4 w-4 ${isDisabled ? 'animate-spin' : ''}`} />
      Refresh Data
    </Button>
  );
};

export default RefreshButton;
