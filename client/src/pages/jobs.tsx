import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Search,
  Filter,
  Building2,
  DollarSign,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Settings,
  Box,
  Shield,
  Cloud,
  Activity,
  BarChart,
  CheckCircle,
  Terminal,
  Loader2,
  TrendingUp,
  Users,
  Globe
} from "lucide-react";
import type { Job } from "../../../shared/jobs-types";
import type { InterviewCategory } from "../../../shared/interview-questions";
import { 
  experienceLevels, 
  jobTypes, 
  postedWithinOptions, 
  popularLocations 
} from "../../../shared/jobs-types";

const iconMap: Record<string, any> = {
  Settings: Settings,
  Box: Box,
  Container: Box,
  Shield: Shield,
  Cloud: Cloud,
  Activity: Activity,
  BarChart: BarChart,
  CheckCircle: CheckCircle,
  Search: Search,
  Terminal: Terminal,
};

function formatPostedTime(postedAt: string): string {
  const posted = new Date(postedAt);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getExperienceBadgeColor(level: string): string {
  switch (level) {
    case 'fresher': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'junior': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'mid': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'senior': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'lead': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'principal': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'bg-green-500/20 text-green-400';
    case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
    case 'advanced': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [postedWithin, setPostedWithin] = useState("all");

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (location !== "all") params.append("location", location);
    if (experienceLevel !== "all") params.append("experienceLevel", experienceLevel);
    if (jobType !== "all") params.append("type", jobType);
    if (postedWithin !== "all") params.append("postedWithin", postedWithin);
    return params.toString();
  };

  const { data: jobsData, isLoading: jobsLoading } = useQuery<{ jobs: Job[]; total: number }>({
    queryKey: ['/api/jobs', searchQuery, location, experienceLevel, jobType, postedWithin],
    queryFn: async () => {
      const queryString = buildQueryString();
      const response = await fetch(`/api/jobs${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const { data: statsData } = useQuery<{ totalJobs: number; remoteJobs: number; fresherJobs: number; companies: number }>({
    queryKey: ['/api/jobs/stats'],
  });

  const { data: interviewCategories, isLoading: categoriesLoading } = useQuery<InterviewCategory[]>({
    queryKey: ['/api/interview-questions'],
  });

  const clearFilters = () => {
    setSearchQuery("");
    setLocation("all");
    setExperienceLevel("all");
    setJobType("all");
    setPostedWithin("all");
  };

  const hasActiveFilters = searchQuery || location !== "all" || experienceLevel !== "all" || jobType !== "all" || postedWithin !== "all";

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cloud & DevOps{" "}
              <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                Careers
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Explore top DevOps and Cloud engineering opportunities from leading tech companies. 
              Prepare with our comprehensive interview questions.
            </p>
          </div>

          {statsData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-cyan/20">
                    <Briefcase className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsData.totalJobs}+</p>
                    <p className="text-sm text-gray-400">Open Positions</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Globe className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsData.remoteJobs}</p>
                    <p className="text-sm text-gray-400">Remote/Hybrid</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsData.fresherJobs}</p>
                    <p className="text-sm text-gray-400">Entry Level</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Building2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{statsData.companies}+</p>
                    <p className="text-sm text-gray-400">Companies</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-dark-card border border-dark-border mb-8">
              <TabsTrigger 
                value="jobs" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-cyan data-[state=active]:to-neon-purple data-[state=active]:text-white"
                data-testid="tab-jobs"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Job Listings
              </TabsTrigger>
              <TabsTrigger 
                value="interview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-neon-cyan data-[state=active]:to-neon-purple data-[state=active]:text-white"
                data-testid="tab-interview"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Interview Prep
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
              <Card className="bg-dark-card border-dark-border mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search jobs, skills, or companies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-dark-bg border-dark-border text-white"
                        data-testid="input-search"
                      />
                    </div>
                    
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="w-full lg:w-[180px] bg-dark-bg border-dark-border text-white" data-testid="select-location">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="all">All Locations</SelectItem>
                        {popularLocations.map((loc) => (
                          <SelectItem key={loc} value={loc.toLowerCase()}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger className="w-full lg:w-[200px] bg-dark-bg border-dark-border text-white" data-testid="select-experience">
                        <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Experience" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="all">All Levels</SelectItem>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger className="w-full lg:w-[160px] bg-dark-bg border-dark-border text-white" data-testid="select-type">
                        <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Job Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="all">All Types</SelectItem>
                        {jobTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={postedWithin} onValueChange={setPostedWithin}>
                      <SelectTrigger className="w-full lg:w-[160px] bg-dark-bg border-dark-border text-white" data-testid="select-posted">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Posted" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        {postedWithinOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Active filters:</span>
                        {searchQuery && (
                          <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                            Search: {searchQuery}
                          </Badge>
                        )}
                        {location !== "all" && (
                          <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                            {location}
                          </Badge>
                        )}
                        {experienceLevel !== "all" && (
                          <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                            {experienceLevels.find(l => l.value === experienceLevel)?.label}
                          </Badge>
                        )}
                        {jobType !== "all" && (
                          <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                            {jobTypes.find(t => t.value === jobType)?.label}
                          </Badge>
                        )}
                        {postedWithin !== "all" && (
                          <Badge variant="outline" className="text-neon-cyan border-neon-cyan/30">
                            {postedWithinOptions.find(p => p.value === postedWithin)?.label}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearFilters}
                        className="text-gray-400 hover:text-white"
                        data-testid="button-clear-filters"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {jobsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                  <span className="ml-3 text-gray-400">Loading jobs...</span>
                </div>
              ) : jobsData?.jobs && jobsData.jobs.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400">
                      Showing <span className="text-white font-medium">{jobsData.total}</span> jobs
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Updated hourly</span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {jobsData.jobs.map((job) => (
                      <Card 
                        key={job.id} 
                        className="bg-dark-card border-dark-border hover:border-neon-cyan/50 transition-all duration-300"
                        data-testid={`card-job-${job.id}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            <div className="flex-shrink-0">
                              {job.logo ? (
                                <img 
                                  src={job.logo} 
                                  alt={`${job.company} logo`}
                                  className="w-16 h-16 rounded-xl object-contain bg-white p-2"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center ${job.logo ? 'hidden' : ''}`}>
                                <Building2 className="w-8 h-8 text-neon-cyan" />
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                <div>
                                  <h3 className="text-xl font-semibold text-white mb-1" data-testid={`text-job-title-${job.id}`}>
                                    {job.title}
                                  </h3>
                                  <div className="flex items-center gap-3 text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="w-4 h-4" />
                                      {job.company}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {job.location}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getExperienceBadgeColor(job.experienceLevel)}>
                                    {experienceLevels.find(l => l.value === job.experienceLevel)?.label || job.experienceLevel}
                                  </Badge>
                                  <Badge variant="outline" className="text-gray-400 border-gray-600">
                                    {job.type}
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-gray-400 mb-4 line-clamp-2">
                                {job.description}
                              </p>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {job.skills.slice(0, 6).map((skill, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="bg-dark-bg text-gray-300 border border-dark-border"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 6 && (
                                  <Badge variant="secondary" className="bg-dark-bg text-gray-400 border border-dark-border">
                                    +{job.skills.length - 6} more
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-4 text-sm">
                                  {job.salary && (
                                    <span className="flex items-center gap-1 text-green-400">
                                      <DollarSign className="w-4 h-4" />
                                      {job.salary}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    {formatPostedTime(job.postedAt)}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    via {job.source}
                                  </span>
                                </div>
                                <Button 
                                  asChild
                                  className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/80 hover:to-neon-purple/80 text-white"
                                  data-testid={`button-apply-${job.id}`}
                                >
                                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                                    Apply Now
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
                    <p className="text-gray-400 mb-4">
                      Try adjusting your filters or search criteria
                    </p>
                    <Button onClick={clearFilters} variant="outline" className="border-dark-border text-gray-300">
                      Clear all filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="interview">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Interview Questions by Topic
                </h2>
                <p className="text-gray-400">
                  Prepare for your DevOps and Cloud interviews with our curated question bank
                </p>
              </div>

              {categoriesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                  <span className="ml-3 text-gray-400">Loading interview questions...</span>
                </div>
              ) : interviewCategories && interviewCategories.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {interviewCategories.map((category) => {
                    const IconComponent = iconMap[category.icon] || Settings;
                    return (
                      <Card 
                        key={category.id} 
                        className="bg-dark-card border-dark-border"
                        data-testid={`card-category-${category.id}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20">
                              <IconComponent className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-white">{category.name}</CardTitle>
                              <CardDescription className="text-gray-400">
                                {category.questions.length} questions
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {category.questions.map((q, index) => (
                              <AccordionItem 
                                key={q.id} 
                                value={q.id}
                                className="border-dark-border"
                              >
                                <AccordionTrigger 
                                  className="text-left text-gray-200 hover:text-white py-3"
                                  data-testid={`accordion-question-${q.id}`}
                                >
                                  <div className="flex items-start gap-3 pr-4">
                                    <span className="text-neon-cyan font-mono text-sm mt-0.5">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm">{q.question}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-400 pb-4">
                                  <div className="ml-8 space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={getDifficultyColor(q.difficulty)}>
                                        {q.difficulty}
                                      </Badge>
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                      {q.answer}
                                    </p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-dark-card border-dark-border">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No questions available</h3>
                    <p className="text-gray-400">
                      Interview questions are being loaded...
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-dark-border mt-8">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-3">
                    Ready for Your Interview?
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                    Practice these questions, review the concepts, and boost your confidence. 
                    Our AI assistant can help you understand complex topics.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => setActiveTab("jobs")}
                      variant="outline" 
                      className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
                      data-testid="button-browse-jobs"
                    >
                      Browse Jobs
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      asChild
                      className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:from-neon-cyan/80 hover:to-neon-purple/80 text-white"
                    >
                      <a href="/ai-assistant">
                        Ask AI Assistant
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="bg-dark-card border-t border-dark-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            Jobs are aggregated from multiple sources. Apply directly on company websites.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Updated every hour. Last update: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  );
}
