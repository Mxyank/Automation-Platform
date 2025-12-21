import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/navigation';
import { 
  Wind, 
  Download, 
  Copy, 
  Database,
  Clock,
  GitBranch,
  Play,
  Settings,
  Zap,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  type: string;
  operator: string;
  pythonCallable?: string;
  bashCommand?: string;
  sqlQuery?: string;
  dependencies: string[];
}

interface AirflowConfig {
  dagId: string;
  description: string;
  schedule: string;
  startDate: string;
  catchup: boolean;
  maxActiveRuns: number;
  retries: number;
  retryDelay: number;
  owner: string;
  email: string;
  emailOnFailure: boolean;
  emailOnRetry: boolean;
  tags: string[];
  tasks: Task[];
  defaultArgs: {
    depends_on_past: boolean;
    wait_for_downstream: boolean;
  };
}

const taskOperators = [
  { value: 'PythonOperator', label: 'Python Operator', description: 'Execute Python callables' },
  { value: 'BashOperator', label: 'Bash Operator', description: 'Execute bash commands' },
  { value: 'PostgresOperator', label: 'Postgres Operator', description: 'Execute SQL in PostgreSQL' },
  { value: 'SnowflakeOperator', label: 'Snowflake Operator', description: 'Execute SQL in Snowflake' },
  { value: 'S3ToSnowflakeOperator', label: 'S3 to Snowflake', description: 'Load S3 data to Snowflake' },
  { value: 'BigQueryOperator', label: 'BigQuery Operator', description: 'Execute queries in BigQuery' },
  { value: 'SparkSubmitOperator', label: 'Spark Submit', description: 'Submit Spark jobs' },
  { value: 'EmptyOperator', label: 'Empty Operator', description: 'Placeholder/dummy task' },
  { value: 'BranchPythonOperator', label: 'Branch Operator', description: 'Conditional branching' },
  { value: 'TriggerDagRunOperator', label: 'Trigger DAG', description: 'Trigger another DAG' },
];

const schedulePresets = [
  { value: '@once', label: 'Once', description: 'Run once only' },
  { value: '@hourly', label: 'Hourly', description: 'Every hour' },
  { value: '@daily', label: 'Daily', description: 'Midnight daily' },
  { value: '@weekly', label: 'Weekly', description: 'Sunday midnight' },
  { value: '@monthly', label: 'Monthly', description: 'First day of month' },
  { value: '0 6 * * *', label: '6 AM Daily', description: 'Every day at 6 AM' },
  { value: '0 0 * * 1-5', label: 'Weekdays', description: 'Weekdays at midnight' },
  { value: '*/15 * * * *', label: 'Every 15 min', description: 'Every 15 minutes' },
];

export default function AirflowGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AirflowConfig>({
    dagId: '',
    description: '',
    schedule: '@daily',
    startDate: new Date().toISOString().split('T')[0],
    catchup: false,
    maxActiveRuns: 1,
    retries: 2,
    retryDelay: 5,
    owner: 'airflow',
    email: '',
    emailOnFailure: true,
    emailOnRetry: false,
    tags: ['data-pipeline'],
    tasks: [],
    defaultArgs: {
      depends_on_past: false,
      wait_for_downstream: false,
    }
  });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');
  const [newTag, setNewTag] = useState('');

  const generateMutation = useMutation({
    mutationFn: async (config: AirflowConfig) => {
      const response = await apiRequest('POST', '/api/airflow/generate', config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.script);
      setActiveTab('code');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "DAG Generated",
        description: "Your Airflow DAG has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Airflow DAG",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!config.dagId) {
      toast({
        title: "Missing Configuration",
        description: "Please provide a DAG ID.",
        variant: "destructive",
      });
      return;
    }
    if (config.tasks.length === 0) {
      toast({
        title: "Missing Tasks",
        description: "Please add at least one task to your DAG.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: "Copied to Clipboard",
      description: "Airflow DAG code copied to clipboard.",
    });
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.dagId || 'dag'}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addTask = () => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      name: `task_${config.tasks.length + 1}`,
      type: 'python',
      operator: 'PythonOperator',
      pythonCallable: '',
      dependencies: []
    };
    setConfig(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const updateTask = (index: number, updates: Partial<Task>) => {
    setConfig(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, ...updates } : task
      )
    }));
  };

  const removeTask = (index: number) => {
    const taskId = config.tasks[index].id;
    setConfig(prev => ({
      ...prev,
      tasks: prev.tasks
        .filter((_, i) => i !== index)
        .map(task => ({
          ...task,
          dependencies: task.dependencies.filter(dep => dep !== taskId)
        }))
    }));
  };

  const addTag = () => {
    if (newTag && !config.tags.includes(newTag)) {
      setConfig(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setConfig(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-teal-500 to-green-600 rounded-lg">
                <Wind className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">
                  Airflow DAG Generator
                </h1>
                <p className="text-gray-400">Create data pipeline DAGs with visual task configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Operators</p>
                      <p className="text-lg font-semibold">10+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Schedule Presets</p>
                      <p className="text-lg font-semibold">8 Options</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Task Dependencies</p>
                      <p className="text-lg font-semibold">Visual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Best Practices</p>
                      <p className="text-lg font-semibold">Built-in</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-dark-card border border-dark-border">
              <TabsTrigger value="config" className="data-[state=active]:bg-teal-600">
                DAG Configuration
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-teal-600">
                Tasks ({config.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-teal-600">
                Generated Code
              </TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-teal-600">
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Basic Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your DAG's basic settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dagId">DAG ID</Label>
                      <Input
                        id="dagId"
                        value={config.dagId}
                        onChange={(e) => setConfig(prev => ({ ...prev, dagId: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        placeholder="my_data_pipeline"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-dag-id"
                      />
                      <p className="text-xs text-gray-500">Unique identifier for your DAG</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={config.description}
                        onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this DAG does..."
                        className="bg-dark-input border-dark-border text-white"
                        rows={3}
                        data-testid="input-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="owner">Owner</Label>
                      <Input
                        id="owner"
                        value={config.owner}
                        onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                        placeholder="airflow"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-owner"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag..."
                          className="bg-dark-input border-dark-border text-white flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          data-testid="input-new-tag"
                        />
                        <Button variant="outline" onClick={addTag} data-testid="button-add-tag">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {config.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Schedule Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure when and how your DAG runs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule">Schedule Interval</Label>
                      <Select 
                        value={config.schedule} 
                        onValueChange={(value) => setConfig(prev => ({ ...prev, schedule: value }))}
                      >
                        <SelectTrigger className="bg-dark-input border-dark-border text-white" data-testid="select-schedule">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          {schedulePresets.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                              <div>
                                <span>{preset.label}</span>
                                <span className="text-gray-500 ml-2 text-xs">({preset.description})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={config.startDate}
                        onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-start-date"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxActiveRuns">Max Active Runs</Label>
                        <Input
                          id="maxActiveRuns"
                          type="number"
                          min={1}
                          value={config.maxActiveRuns}
                          onChange={(e) => setConfig(prev => ({ ...prev, maxActiveRuns: parseInt(e.target.value) || 1 }))}
                          className="bg-dark-input border-dark-border text-white"
                          data-testid="input-max-active-runs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="retries">Retries</Label>
                        <Input
                          id="retries"
                          type="number"
                          min={0}
                          value={config.retries}
                          onChange={(e) => setConfig(prev => ({ ...prev, retries: parseInt(e.target.value) || 0 }))}
                          className="bg-dark-input border-dark-border text-white"
                          data-testid="input-retries"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
                      <Input
                        id="retryDelay"
                        type="number"
                        min={1}
                        value={config.retryDelay}
                        onChange={(e) => setConfig(prev => ({ ...prev, retryDelay: parseInt(e.target.value) || 5 }))}
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-retry-delay"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="catchup"
                        checked={config.catchup}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, catchup: !!checked }))}
                        data-testid="checkbox-catchup"
                      />
                      <Label htmlFor="catchup" className="text-sm">Enable Catchup (backfill missed runs)</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure email alerts for your DAG
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Notification Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={config.email}
                        onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="alerts@example.com"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-email"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emailOnFailure"
                        checked={config.emailOnFailure}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emailOnFailure: !!checked }))}
                        data-testid="checkbox-email-failure"
                      />
                      <Label htmlFor="emailOnFailure" className="text-sm">Email on failure</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emailOnRetry"
                        checked={config.emailOnRetry}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emailOnRetry: !!checked }))}
                        data-testid="checkbox-email-retry"
                      />
                      <Label htmlFor="emailOnRetry" className="text-sm">Email on retry</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Options */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Advanced Options
                    </CardTitle>
                    <CardDescription>
                      Configure advanced DAG behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dependsOnPast"
                        checked={config.defaultArgs.depends_on_past}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          defaultArgs: { ...prev.defaultArgs, depends_on_past: !!checked }
                        }))}
                        data-testid="checkbox-depends-on-past"
                      />
                      <Label htmlFor="dependsOnPast" className="text-sm">Depends on past (tasks wait for previous run)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="waitForDownstream"
                        checked={config.defaultArgs.wait_for_downstream}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          defaultArgs: { ...prev.defaultArgs, wait_for_downstream: !!checked }
                        }))}
                        data-testid="checkbox-wait-downstream"
                      />
                      <Label htmlFor="waitForDownstream" className="text-sm">Wait for downstream (wait for child tasks)</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Task Configuration
                      </CardTitle>
                      <CardDescription>
                        Add and configure tasks for your DAG
                      </CardDescription>
                    </div>
                    <Button onClick={addTask} className="bg-teal-600 hover:bg-teal-700" data-testid="button-add-task">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {config.tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No tasks added yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click "Add Task" to start building your pipeline
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {config.tasks.map((task, index) => (
                        <Card key={task.id} className="bg-gray-800/50 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="outline" className="text-teal-400 border-teal-400">
                                Task {index + 1}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeTask(index)}
                                className="text-red-400 hover:text-red-300"
                                data-testid={`button-remove-task-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Task Name</Label>
                                <Input
                                  value={task.name}
                                  onChange={(e) => updateTask(index, { name: e.target.value.replace(/\s+/g, '_') })}
                                  placeholder="extract_data"
                                  className="bg-dark-input border-dark-border text-white"
                                  data-testid={`input-task-name-${index}`}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Operator</Label>
                                <Select 
                                  value={task.operator} 
                                  onValueChange={(value) => updateTask(index, { operator: value })}
                                >
                                  <SelectTrigger className="bg-dark-input border-dark-border text-white" data-testid={`select-operator-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-dark-card border-dark-border">
                                    {taskOperators.map((op) => (
                                      <SelectItem key={op.value} value={op.value}>
                                        <div>
                                          <span>{op.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {task.operator === 'PythonOperator' && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Python Callable</Label>
                                  <Input
                                    value={task.pythonCallable || ''}
                                    onChange={(e) => updateTask(index, { pythonCallable: e.target.value })}
                                    placeholder="my_function"
                                    className="bg-dark-input border-dark-border text-white"
                                    data-testid={`input-python-callable-${index}`}
                                  />
                                </div>
                              )}

                              {task.operator === 'BashOperator' && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Bash Command</Label>
                                  <Textarea
                                    value={task.bashCommand || ''}
                                    onChange={(e) => updateTask(index, { bashCommand: e.target.value })}
                                    placeholder="echo 'Hello World'"
                                    className="bg-dark-input border-dark-border text-white"
                                    rows={2}
                                    data-testid={`input-bash-command-${index}`}
                                  />
                                </div>
                              )}

                              {(task.operator === 'PostgresOperator' || task.operator === 'SnowflakeOperator' || task.operator === 'BigQueryOperator') && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>SQL Query</Label>
                                  <Textarea
                                    value={task.sqlQuery || ''}
                                    onChange={(e) => updateTask(index, { sqlQuery: e.target.value })}
                                    placeholder="SELECT * FROM table"
                                    className="bg-dark-input border-dark-border text-white font-mono"
                                    rows={3}
                                    data-testid={`input-sql-query-${index}`}
                                  />
                                </div>
                              )}

                              {config.tasks.length > 1 && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Dependencies (upstream tasks)</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {config.tasks
                                      .filter((_, i) => i !== index)
                                      .map((t) => (
                                        <Button
                                          key={t.id}
                                          variant={task.dependencies.includes(t.id) ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => {
                                            const deps = task.dependencies.includes(t.id)
                                              ? task.dependencies.filter(d => d !== t.id)
                                              : [...task.dependencies, t.id];
                                            updateTask(index, { dependencies: deps });
                                          }}
                                          className={task.dependencies.includes(t.id) ? "bg-teal-600" : ""}
                                          data-testid={`button-dep-${t.name}`}
                                        >
                                          {t.name}
                                          {task.dependencies.includes(t.id) && <ArrowRight className="h-3 w-3 ml-1" />}
                                        </Button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {config.tasks.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="bg-gradient-to-r from-teal-500 to-green-500 text-white px-8 py-6 text-lg"
                    data-testid="button-generate-dag"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Wind className="h-5 w-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wind className="h-5 w-5 mr-2" />
                        Generate DAG
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="code">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Generated Python Code
                    </CardTitle>
                    {generatedCode && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy-code">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadCode} data-testid="button-download-code">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedCode ? (
                    <ScrollArea className="h-[600px]">
                      <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                        {generatedCode}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Wind className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No code generated yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Configure your DAG and add tasks, then click "Generate DAG"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-dark-card border-dark-border hover:border-teal-500/50 cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">ETL Pipeline</CardTitle>
                    <CardDescription>Extract, Transform, Load workflow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Badge variant="secondary">3 tasks</Badge>
                      <Badge variant="secondary">PostgreSQL</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          dagId: 'etl_pipeline',
                          description: 'Extract, Transform, Load pipeline',
                          tasks: [
                            { id: 'extract', name: 'extract_data', type: 'python', operator: 'PythonOperator', pythonCallable: 'extract_from_source', dependencies: [] },
                            { id: 'transform', name: 'transform_data', type: 'python', operator: 'PythonOperator', pythonCallable: 'transform_data', dependencies: ['extract'] },
                            { id: 'load', name: 'load_data', type: 'python', operator: 'PostgresOperator', sqlQuery: 'INSERT INTO target_table SELECT * FROM staging', dependencies: ['transform'] },
                          ]
                        }));
                        setActiveTab('tasks');
                      }}
                      data-testid="button-template-etl"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border hover:border-teal-500/50 cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Data Warehouse Sync</CardTitle>
                    <CardDescription>S3 to Snowflake data sync</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Badge variant="secondary">4 tasks</Badge>
                      <Badge variant="secondary">Snowflake</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          dagId: 'dw_sync_pipeline',
                          description: 'S3 to Snowflake data synchronization',
                          tasks: [
                            { id: 'check_files', name: 'check_s3_files', type: 'python', operator: 'PythonOperator', pythonCallable: 'check_s3_for_new_files', dependencies: [] },
                            { id: 'stage', name: 'stage_data', type: 'sql', operator: 'SnowflakeOperator', sqlQuery: 'COPY INTO staging_table FROM @s3_stage', dependencies: ['check_files'] },
                            { id: 'merge', name: 'merge_data', type: 'sql', operator: 'SnowflakeOperator', sqlQuery: 'MERGE INTO target_table USING staging_table ON ...', dependencies: ['stage'] },
                            { id: 'cleanup', name: 'cleanup_staging', type: 'sql', operator: 'SnowflakeOperator', sqlQuery: 'TRUNCATE TABLE staging_table', dependencies: ['merge'] },
                          ]
                        }));
                        setActiveTab('tasks');
                      }}
                      data-testid="button-template-dw"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border hover:border-teal-500/50 cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">ML Training Pipeline</CardTitle>
                    <CardDescription>Data prep and model training</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Badge variant="secondary">5 tasks</Badge>
                      <Badge variant="secondary">Spark</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          dagId: 'ml_training_pipeline',
                          description: 'Machine learning model training pipeline',
                          tasks: [
                            { id: 'fetch_data', name: 'fetch_training_data', type: 'python', operator: 'PythonOperator', pythonCallable: 'fetch_data_from_warehouse', dependencies: [] },
                            { id: 'preprocess', name: 'preprocess_data', type: 'spark', operator: 'SparkSubmitOperator', dependencies: ['fetch_data'] },
                            { id: 'train', name: 'train_model', type: 'python', operator: 'PythonOperator', pythonCallable: 'train_model', dependencies: ['preprocess'] },
                            { id: 'evaluate', name: 'evaluate_model', type: 'python', operator: 'PythonOperator', pythonCallable: 'evaluate_model', dependencies: ['train'] },
                            { id: 'deploy', name: 'deploy_model', type: 'python', operator: 'PythonOperator', pythonCallable: 'deploy_to_production', dependencies: ['evaluate'] },
                          ]
                        }));
                        setActiveTab('tasks');
                      }}
                      data-testid="button-template-ml"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border hover:border-teal-500/50 cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Report Generation</CardTitle>
                    <CardDescription>Daily business reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Badge variant="secondary">3 tasks</Badge>
                      <Badge variant="secondary">BigQuery</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          dagId: 'daily_reports',
                          description: 'Daily business report generation',
                          schedule: '@daily',
                          tasks: [
                            { id: 'aggregate', name: 'aggregate_metrics', type: 'sql', operator: 'BigQueryOperator', sqlQuery: 'CREATE OR REPLACE TABLE reports.daily_metrics AS SELECT ...', dependencies: [] },
                            { id: 'generate', name: 'generate_report', type: 'python', operator: 'PythonOperator', pythonCallable: 'generate_pdf_report', dependencies: ['aggregate'] },
                            { id: 'notify', name: 'send_notification', type: 'python', operator: 'PythonOperator', pythonCallable: 'send_email_notification', dependencies: ['generate'] },
                          ]
                        }));
                        setActiveTab('tasks');
                      }}
                      data-testid="button-template-reports"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border hover:border-teal-500/50 cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Data Quality Checks</CardTitle>
                    <CardDescription>Automated data validation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Badge variant="secondary">4 tasks</Badge>
                      <Badge variant="secondary">Python</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          dagId: 'data_quality_checks',
                          description: 'Automated data quality validation pipeline',
                          tasks: [
                            { id: 'schema_check', name: 'validate_schema', type: 'python', operator: 'PythonOperator', pythonCallable: 'validate_schema', dependencies: [] },
                            { id: 'null_check', name: 'check_null_values', type: 'python', operator: 'PythonOperator', pythonCallable: 'check_nulls', dependencies: ['schema_check'] },
                            { id: 'range_check', name: 'validate_ranges', type: 'python', operator: 'PythonOperator', pythonCallable: 'validate_value_ranges', dependencies: ['null_check'] },
                            { id: 'report', name: 'generate_quality_report', type: 'python', operator: 'PythonOperator', pythonCallable: 'generate_dq_report', dependencies: ['range_check'] },
                          ]
                        }));
                        setActiveTab('tasks');
                      }}
                      data-testid="button-template-dq"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border hover:border-teal-500/50 cursor-pointer transition-all">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">API Data Ingestion</CardTitle>
                    <CardDescription>REST API to data warehouse</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Badge variant="secondary">3 tasks</Badge>
                      <Badge variant="secondary">REST API</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          dagId: 'api_data_ingestion',
                          description: 'REST API data ingestion to data warehouse',
                          schedule: '@hourly',
                          tasks: [
                            { id: 'fetch_api', name: 'fetch_from_api', type: 'python', operator: 'PythonOperator', pythonCallable: 'fetch_api_data', dependencies: [] },
                            { id: 'transform', name: 'transform_api_data', type: 'python', operator: 'PythonOperator', pythonCallable: 'transform_and_validate', dependencies: ['fetch_api'] },
                            { id: 'load', name: 'load_to_warehouse', type: 'python', operator: 'PythonOperator', pythonCallable: 'load_to_snowflake', dependencies: ['transform'] },
                          ]
                        }));
                        setActiveTab('tasks');
                      }}
                      data-testid="button-template-api"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
