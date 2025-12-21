import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  Database,
  Container,
  Brain,
  Zap,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Terminal,
  GitBranch
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to CloudForge!",
    description: "Your AI-powered DevOps platform. Let's take a quick tour to help you get started with building backends and automating DevOps workflows.",
    icon: <Rocket className="w-12 h-12 text-neon-cyan" />,
  },
  {
    title: "Generate APIs Instantly",
    description: "Create production-ready CRUD APIs in seconds. Choose your framework (Express, FastAPI, NestJS) and database, and let AI generate the code for you.",
    icon: <Database className="w-12 h-12 text-blue-400" />,
    highlight: "api-generator",
  },
  {
    title: "Docker Made Easy",
    description: "Generate optimized Dockerfiles and docker-compose configurations. Perfect for containerizing your applications with best practices.",
    icon: <Container className="w-12 h-12 text-cyan-400" />,
    highlight: "docker-generator",
  },
  {
    title: "CI/CD Pipelines",
    description: "Create Jenkins pipelines, GitHub Actions, and Ansible playbooks. Automate your entire deployment workflow with AI-generated scripts.",
    icon: <GitBranch className="w-12 h-12 text-green-400" />,
    highlight: "jenkins-generator",
  },
  {
    title: "AI DevOps Assistant",
    description: "Get help with error analysis, YAML generation, and Dockerfile optimization. Ask anything about DevOps and get instant AI-powered answers.",
    icon: <Brain className="w-12 h-12 text-purple-400" />,
    highlight: "ai-assistant",
  },
  {
    title: "Advanced AI Features",
    description: "Explore deployment simulation, secret scanning, cost optimization, infrastructure chat, and more advanced AI-powered tools.",
    icon: <Sparkles className="w-12 h-12 text-yellow-400" />,
    highlight: "advanced-ai",
  },
  {
    title: "You're All Set!",
    description: "Start building with 2 free credits. Each feature use costs 1 credit. Upgrade to premium for unlimited access and priority support.",
    icon: <CheckCircle2 className="w-12 h-12 text-neon-green" />,
  },
];

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ProductTour({ isOpen, onClose, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const completeTourMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/user/tour-complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsExiting(true);
    completeTourMutation.mutate();
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleComplete = () => {
    setIsExiting(true);
    completeTourMutation.mutate();
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const step = tourSteps[currentStep];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ 
              scale: isExiting ? 0.9 : 1, 
              opacity: isExiting ? 0 : 1, 
              y: isExiting ? 20 : 0 
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg"
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700 shadow-2xl overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple" />
              
              {/* Skip button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
                data-testid="btn-skip-tour"
              >
                <X className="w-5 h-5" />
              </button>

              <CardContent className="p-8">
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Step {currentStep + 1} of {tourSteps.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-gray-800" />
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700">
                        {step.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-4" data-testid="text-tour-title">
                      {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-300 leading-relaxed mb-8" data-testid="text-tour-description">
                      {step.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                  {currentStep > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={handlePrev}
                      className="text-gray-400 hover:text-white"
                      data-testid="btn-tour-prev"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-gray-400 hover:text-white"
                      data-testid="btn-tour-skip"
                    >
                      Skip Tour
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-semibold px-6 hover:shadow-lg hover:shadow-neon-cyan/25 transition-all duration-300"
                    data-testid="btn-tour-next"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      <>
                        Get Started
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Step indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "bg-neon-cyan w-6"
                          : index < currentStep
                          ? "bg-neon-green"
                          : "bg-gray-600"
                      }`}
                      data-testid={`btn-tour-step-${index}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TourWelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export function TourWelcomeModal({ isOpen, onStartTour, onSkip }: TourWelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700 shadow-2xl overflow-hidden">
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple" />

          <CardContent className="p-8 text-center">
            {/* Welcome icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative p-5 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3" data-testid="text-welcome-title">
              Welcome to CloudForge!
            </h2>

            {/* Description */}
            <p className="text-gray-300 mb-8">
              Would you like a quick tour of the platform? It only takes a minute and will help you get the most out of CloudForge.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={onStartTour}
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-semibold py-5 hover:shadow-lg hover:shadow-neon-cyan/25 transition-all duration-300"
                data-testid="btn-start-tour"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Take the Tour
              </Button>
              <Button
                variant="ghost"
                onClick={onSkip}
                className="w-full text-gray-400 hover:text-white"
                data-testid="btn-skip-welcome"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
