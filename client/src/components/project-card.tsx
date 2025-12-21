import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Container, GitBranch, ExternalLink, Calendar } from "lucide-react";
import { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "api":
        return Database;
      case "docker":
        return Container;
      case "ci-cd":
        return GitBranch;
      default:
        return Database;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "api":
        return "from-neon-cyan to-blue-500";
      case "docker":
        return "from-neon-green to-green-500";
      case "ci-cd":
        return "from-neon-purple to-purple-500";
      default:
        return "from-gray-600 to-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-neon-green/20 text-neon-green border-neon-green/50";
      case "deploying":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "draft":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/50";
    }
  };

  const TypeIcon = getTypeIcon(project.type);
  
  return (
    <Card className="bg-dark-card border-gray-800 hover:border-gray-600 transition-colors duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 bg-gradient-to-br ${getTypeColor(project.type)} rounded-lg flex items-center justify-center`}>
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">{project.name}</h3>
              <p className="text-sm text-gray-400 capitalize">
                {project.type === "ci-cd" ? "CI/CD Pipeline" : project.type} • {(project.config as any)?.framework || "Generated"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(project.status)} border`}>
              {project.status}
            </Badge>
            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-neon-cyan">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          Created {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
