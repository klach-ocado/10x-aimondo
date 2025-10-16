import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React from "react";

interface BackButtonProps {
  onClick: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return (
    <Button variant="outline" size="icon" onClick={onClick} data-testid="back-button">
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
};

export default BackButton;
