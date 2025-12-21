import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

export function BackButton({ fallbackPath = "/dashboard", className = "" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`text-gray-400 hover:text-white ${className}`}
      data-testid="button-back"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </Button>
  );
}
