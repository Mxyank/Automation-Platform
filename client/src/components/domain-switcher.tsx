import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Container, Database, Shield, ChevronDown, Check, Loader2 } from "lucide-react";
import type { Domain } from "@shared/feature-registry";

interface DomainSwitcherProps {
  currentDomain: Domain;
  variant?: "default" | "compact";
}

const domainConfig = {
  devops: {
    name: "DevOps",
    icon: Container,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    gradient: "from-cyan-500 to-blue-600",
  },
  "data-engineering": {
    name: "Data Engineering",
    icon: Database,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500 to-teal-600",
  },
  cybersecurity: {
    name: "Cybersecurity",
    icon: Shield,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    gradient: "from-red-500 to-orange-600",
  },
} as const;

export function DomainSwitcher({ currentDomain, variant = "default" }: DomainSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateDomainMutation = useMutation({
    mutationFn: async (domain: Domain) => {
      return apiRequest("PATCH", "/api/user/domain", { domain });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const currentConfig = domainConfig[currentDomain];
  const CurrentIcon = currentConfig.icon;

  const handleDomainChange = (domain: Domain) => {
    if (domain !== currentDomain) {
      updateDomainMutation.mutate(domain);
    }
    setIsOpen(false);
  };

  if (variant === "compact") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${currentConfig.bgColor} ${currentConfig.borderColor} ${currentConfig.color} hover:opacity-80`}
            data-testid="domain-switcher-compact"
          >
            <CurrentIcon className="w-4 h-4 mr-1" />
            {currentConfig.name}
            {updateDomainMutation.isPending ? (
              <Loader2 className="w-3 h-3 ml-1 animate-spin" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-dark-card border-dark-border">
          {Object.entries(domainConfig).map(([domain, config]) => {
            const Icon = config.icon;
            const isSelected = domain === currentDomain;
            return (
              <DropdownMenuItem
                key={domain}
                onClick={() => handleDomainChange(domain as Domain)}
                className={`cursor-pointer ${isSelected ? config.color : "text-gray-300"}`}
                data-testid={`domain-option-${domain}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {config.name}
                {isSelected && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="domain-switcher">
      <span className="text-sm text-gray-400">Domain:</span>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`${currentConfig.bgColor} ${currentConfig.borderColor} ${currentConfig.color} hover:opacity-80`}
            data-testid="domain-switcher-trigger"
          >
            <CurrentIcon className="w-4 h-4 mr-2" />
            {currentConfig.name}
            {updateDomainMutation.isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-dark-card border-dark-border">
          {Object.entries(domainConfig).map(([domain, config]) => {
            const Icon = config.icon;
            const isSelected = domain === currentDomain;
            return (
              <DropdownMenuItem
                key={domain}
                onClick={() => handleDomainChange(domain as Domain)}
                className={`cursor-pointer ${isSelected ? config.color : "text-gray-300 hover:text-white"}`}
                data-testid={`domain-option-${domain}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <div className="flex flex-col">
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-gray-500">
                    {domain === "devops" && "CI/CD, Containers, IaC"}
                    {domain === "data-engineering" && "Pipelines, ETL, Warehousing"}
                    {domain === "cybersecurity" && "Security, Compliance, Scanning"}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DomainBadge({ domain }: { domain: Domain }) {
  const config = domainConfig[domain];
  const Icon = config.icon;

  return (
    <Badge className={`${config.bgColor} ${config.borderColor} ${config.color} border`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.name}
    </Badge>
  );
}
