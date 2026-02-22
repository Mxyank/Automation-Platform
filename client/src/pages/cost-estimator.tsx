import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  DollarSign,
  Cloud,
  Server,
  Database as DatabaseIcon,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Calculator,
  TrendingDown,
  Loader2,
  Zap,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";

interface CostEstimate {
  compute: number;
  storage: number;
  database: number;
  network: number;
  total: number;
  savings: number;
  recommendations: string[];
}

const cloudProviders = [
  { value: "aws", label: "Amazon Web Services", icon: "🟠" },
  { value: "azure", label: "Microsoft Azure", icon: "🔵" },
  { value: "gcp", label: "Google Cloud Platform", icon: "🔴" },
];

const instanceTypes = [
  { value: "small", label: "Small (2 vCPU, 4GB RAM)", compute: 30 },
  { value: "medium", label: "Medium (4 vCPU, 8GB RAM)", compute: 60 },
  { value: "large", label: "Large (8 vCPU, 16GB RAM)", compute: 120 },
  { value: "xlarge", label: "X-Large (16 vCPU, 32GB RAM)", compute: 240 },
];

const databaseTypes = [
  { value: "none", label: "No Database", cost: 0 },
  { value: "postgres-small", label: "PostgreSQL Small", cost: 25 },
  { value: "postgres-medium", label: "PostgreSQL Medium", cost: 50 },
  { value: "mysql-small", label: "MySQL Small", cost: 20 },
  { value: "mysql-medium", label: "MySQL Medium", cost: 45 },
  { value: "mongodb-small", label: "MongoDB Small", cost: 30 },
  { value: "redis", label: "Redis Cache", cost: 15 },
];

export default function CostEstimator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('cost_estimator');

  const [provider, setProvider] = useState("aws");
  const [instanceType, setInstanceType] = useState("medium");
  const [instanceCount, setInstanceCount] = useState([2]);
  const [storageGB, setStorageGB] = useState([100]);
  const [database, setDatabase] = useState("postgres-small");
  const [bandwidthGB, setBandwidthGB] = useState([500]);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);

  const calculateEstimate = () => {
    const instance = instanceTypes.find(i => i.value === instanceType);
    const db = databaseTypes.find(d => d.value === database);

    const computeCost = (instance?.compute || 60) * instanceCount[0];
    const storageCost = storageGB[0] * 0.1;
    const databaseCost = db?.cost || 0;
    const networkCost = bandwidthGB[0] * 0.09;

    const total = computeCost + storageCost + databaseCost + networkCost;
    const optimizedTotal = total * 0.7;

    const recommendations = [];
    if (instanceCount[0] > 3) {
      recommendations.push("Consider using auto-scaling to reduce costs during low traffic periods");
    }
    if (storageGB[0] > 500) {
      recommendations.push("Use lifecycle policies to move old data to cheaper storage tiers");
    }
    if (provider === "aws") {
      recommendations.push("Use Reserved Instances for 30-40% savings on compute costs");
    }
    recommendations.push("Enable spot instances for non-critical workloads to save up to 90%");

    setEstimate({
      compute: computeCost,
      storage: storageCost,
      database: databaseCost,
      network: networkCost,
      total,
      savings: total - optimizedTotal,
      recommendations
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <Card className="p-8 text-center bg-dark-card border-dark-border">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-neon-cyan" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to use the Cost Estimator.</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-dark-bg text-white">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Infrastructure Cost Estimator" />}
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Infrastructure Cost Estimator</h1>
                <p className="text-sm text-gray-400">Estimate your monthly cloud costs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-neon-cyan" />
                  Cloud Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="bg-gray-800 border-gray-700" data-testid="select-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cloudProviders.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-neon-purple" />
                  Compute Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-400">Instance Type</Label>
                  <Select value={instanceType} onValueChange={setInstanceType}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 mt-2" data-testid="select-instance">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instanceTypes.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-400">Number of Instances</Label>
                    <span className="text-neon-cyan font-bold">{instanceCount[0]}</span>
                  </div>
                  <Slider
                    value={instanceCount}
                    onValueChange={setInstanceCount}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-neon-green" />
                  Storage & Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-gray-400">Storage (GB)</Label>
                    <span className="text-neon-green font-bold">{storageGB[0]} GB</span>
                  </div>
                  <Slider
                    value={storageGB}
                    onValueChange={setStorageGB}
                    min={10}
                    max={2000}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-gray-400">Database</Label>
                  <Select value={database} onValueChange={setDatabase}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 mt-2" data-testid="select-database">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {databaseTypes.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <Label className="text-gray-400">Monthly Bandwidth (GB)</Label>
                  <span className="text-blue-500 font-bold">{bandwidthGB[0]} GB</span>
                </div>
                <Slider
                  value={bandwidthGB}
                  onValueChange={setBandwidthGB}
                  min={10}
                  max={5000}
                  step={10}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Button
              onClick={calculateEstimate}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-lg"
              data-testid="button-calculate"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Estimate
            </Button>
          </div>

          <div className="space-y-6">
            {estimate ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl">Estimated Monthly Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white mb-2">
                        ${estimate.total.toFixed(2)}
                      </div>
                      <p className="text-gray-400">per month</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-neon-purple" />
                        <span>Compute</span>
                      </div>
                      <span className="font-bold">${estimate.compute.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-neon-green" />
                        <span>Storage</span>
                      </div>
                      <span className="font-bold">${estimate.storage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DatabaseIcon className="w-4 h-4 text-neon-cyan" />
                        <span>Database</span>
                      </div>
                      <span className="font-bold">${estimate.database.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span>Network</span>
                      </div>
                      <span className="font-bold">${estimate.network.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-yellow-500" />
                      Potential Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-yellow-500">
                        Save up to ${estimate.savings.toFixed(2)}/month
                      </div>
                      <p className="text-gray-400 text-sm mt-1">with optimization recommendations</p>
                    </div>
                    <div className="space-y-2">
                      {estimate.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="bg-dark-card border-dark-border h-full flex items-center justify-center">
                <CardContent className="text-center py-20">
                  <Calculator className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Configure Your Infrastructure
                  </h3>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Select your cloud provider, compute resources, storage, and network requirements to get an accurate cost estimate.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
