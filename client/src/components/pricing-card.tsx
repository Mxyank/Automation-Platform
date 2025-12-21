import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  popular?: boolean;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  buttonText,
  onClick,
  popular = false,
}: PricingCardProps) {
  return (
    <Card 
      className={`relative bg-dark-card border-gray-800 rounded-xl p-6 ${
        popular 
          ? 'border-2 border-neon-cyan transform scale-105' 
          : 'border border-gray-800'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg px-4 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <div className="text-3xl font-bold mb-2">{price}</div>
          <p className="text-gray-400">{description}</p>
        </div>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-neon-green flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          onClick={onClick}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            popular
              ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg hover:opacity-90'
              : 'border border-gray-600 text-white hover:border-neon-cyan hover:text-neon-cyan bg-transparent'
          }`}
          variant={popular ? "default" : "outline"}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
