import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import { BannedPopup } from "@/components/banned-popup";
import { ImpersonationBanner } from "@/components/impersonation-banner";

import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ApiGenerator from "@/pages/api-generator";
import DockerGenerator from "@/pages/docker-generator";
import JenkinsGenerator from "@/pages/jenkins-generator";
import AnsibleGenerator from "@/pages/ansible-generator";
import SonarQubeSetup from "@/pages/sonarqube-setup";
import AiAssistant from "@/pages/ai-assistant";
import Checkout from "@/pages/checkout";
import LogsDashboard from "@/pages/logs-dashboard";
import SecurityDashboard from "@/pages/security-dashboard";
import SonarDashboard from "@/pages/sonar-dashboard";
import FeaturesPage from "@/pages/features";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import CostEstimator from "@/pages/cost-estimator";
import MigrationAssistant from "@/pages/migration-assistant";
import PipelineBuilder from "@/pages/pipeline-builder";
import DeploymentSimulator from "@/pages/deployment-simulator";
import IaCAutofix from "@/pages/iac-autofix";
import ReleaseNotesGenerator from "@/pages/release-notes";
import SecretScanner from "@/pages/secret-scanner";
import CloudOptimizer from "@/pages/cloud-optimizer";
import InfraChat from "@/pages/infra-chat";
import BlueprintGenerator from "@/pages/blueprint-generator";
import PostmortemGenerator from "@/pages/postmortem";
import EnvReplicator from "@/pages/env-replicator";
import DatabaseOptimizer from "@/pages/database-optimizer";
import WebsiteMonitor from "@/pages/website-monitor";
import CaseStudies from "@/pages/case-studies";
import About from "@/pages/about";
import Community from "@/pages/community";
import Blog from "@/pages/blog";
import AdminDashboard from "@/pages/admin-dashboard";
import Jobs from "@/pages/jobs";
import SnowflakeSetup from "@/pages/snowflake-setup";
import AirflowGenerator from "@/pages/airflow-generator";
import Helpdesk from "@/pages/helpdesk";
import CloudSearch from "@/pages/cloud-search";
import ProjectDetail from "@/pages/project-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/case-studies" component={CaseStudies} />
      <Route path="/about" component={About} />
      <Route path="/community" component={Community} />
      <Route path="/blog" component={Blog} />
      <Route path="/jobs" component={Jobs} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/api-generator" component={ApiGenerator} />
      <ProtectedRoute path="/docker-generator" component={DockerGenerator} />
      <ProtectedRoute path="/jenkins-generator" component={JenkinsGenerator} />
      <ProtectedRoute path="/ansible-generator" component={AnsibleGenerator} />
      <ProtectedRoute path="/sonarqube-setup" component={SonarQubeSetup} />
      <ProtectedRoute path="/ai-assistant" component={AiAssistant} />
      <ProtectedRoute path="/logs" component={LogsDashboard} />
      <ProtectedRoute path="/security" component={SecurityDashboard} />
      <ProtectedRoute path="/sonar" component={SonarDashboard} />
      <ProtectedRoute path="/cost-estimator" component={CostEstimator} />
      <ProtectedRoute path="/migration-assistant" component={MigrationAssistant} />
      <ProtectedRoute path="/pipeline-builder" component={PipelineBuilder} />
      <ProtectedRoute path="/deployment-simulator" component={DeploymentSimulator} />
      <ProtectedRoute path="/iac-autofix" component={IaCAutofix} />
      <ProtectedRoute path="/release-notes" component={ReleaseNotesGenerator} />
      <ProtectedRoute path="/secret-scanner" component={SecretScanner} />
      <ProtectedRoute path="/cloud-optimizer" component={CloudOptimizer} />
      <ProtectedRoute path="/infra-chat" component={InfraChat} />
      <ProtectedRoute path="/blueprint-generator" component={BlueprintGenerator} />
      <ProtectedRoute path="/postmortem" component={PostmortemGenerator} />
      <ProtectedRoute path="/env-replicator" component={EnvReplicator} />
      <ProtectedRoute path="/database-optimizer" component={DatabaseOptimizer} />
      <ProtectedRoute path="/website-monitor" component={WebsiteMonitor} />
      <ProtectedRoute path="/checkout/:packageId" component={Checkout} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/snowflake-setup" component={SnowflakeSetup} />
      <ProtectedRoute path="/airflow-generator" component={AirflowGenerator} />
      <ProtectedRoute path="/helpdesk" component={Helpdesk} />
      <ProtectedRoute path="/cloud-search" component={CloudSearch} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="prometix-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <ImpersonationBanner />
            <BannedPopup />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
