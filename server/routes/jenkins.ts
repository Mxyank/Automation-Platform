import { Router } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

interface JenkinsConfig {
  projectName: string;
  projectType: string;
  gitRepository: string;
  branch: string;
  buildTool: string;
  nodeVersion?: string;
  javaVersion?: string;
  pythonVersion?: string;
  testCommand: string;
  buildCommand: string;
  deploymentTarget: string;
  dockerEnabled: boolean;
  sonarEnabled: boolean;
  slackNotifications: boolean;
  emailNotifications: string;
  stages: string[];
  environmentVariables: { key: string; value: string }[];
}

function generateJenkinsPipeline(config: JenkinsConfig): string {
  const {
    projectName,
    projectType,
    gitRepository,
    branch,
    buildTool,
    nodeVersion,
    javaVersion,
    pythonVersion,
    testCommand,
    buildCommand,
    deploymentTarget,
    dockerEnabled,
    sonarEnabled,
    slackNotifications,
    emailNotifications,
    stages,
    environmentVariables
  } = config;

  let pipeline = `pipeline {
    agent any
    
    environment {`;

  // Add environment variables
  environmentVariables.forEach(env => {
    if (env.key && env.value) {
      pipeline += `\n        ${env.key} = '${env.value}'`;
    }
  });

  pipeline += `
    }
    
    tools {`;

  // Add tools based on project type
  if (projectType === 'nodejs' && nodeVersion) {
    pipeline += `\n        nodejs '${nodeVersion}'`;
  } else if (projectType === 'java' && javaVersion) {
    pipeline += `\n        maven 'Maven-3.8'`;
    pipeline += `\n        jdk 'JDK-${javaVersion}'`;
  } else if (projectType === 'python' && pythonVersion) {
    pipeline += `\n        python '${pythonVersion}'`;
  }

  pipeline += `
    }
    
    stages {`;

  // Add stages based on configuration
  if (stages.includes('checkout')) {
    pipeline += `
        stage('Checkout') {
            steps {
                git branch: '${branch}', url: '${gitRepository}'
            }
        }`;
  }

  if (stages.includes('build')) {
    let buildSteps = '';
    if (projectType === 'nodejs') {
      buildSteps = buildTool === 'yarn' ? 'yarn install' : 'npm ci';
    } else if (projectType === 'java') {
      buildSteps = 'mvn clean compile';
    } else if (projectType === 'python') {
      buildSteps = 'pip install -r requirements.txt';
    }

    pipeline += `
        stage('Build') {
            steps {
                sh '${buildSteps}'`;
    
    if (buildCommand && buildCommand !== 'npm run build') {
      pipeline += `\n                sh '${buildCommand}'`;
    }
    
    pipeline += `
            }
        }`;
  }

  if (stages.includes('test') && testCommand) {
    pipeline += `
        stage('Test') {
            steps {
                sh '${testCommand}'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                }
            }
        }`;
  }

  if (stages.includes('lint')) {
    let lintCommand = '';
    if (projectType === 'nodejs') {
      lintCommand = 'npm run lint';
    } else if (projectType === 'python') {
      lintCommand = 'flake8 .';
    } else if (projectType === 'java') {
      lintCommand = 'mvn checkstyle:check';
    }

    if (lintCommand) {
      pipeline += `
        stage('Lint') {
            steps {
                sh '${lintCommand}'
            }
        }`;
    }
  }

  if (stages.includes('security-scan')) {
    pipeline += `
        stage('Security Scan') {
            steps {
                sh 'npm audit --audit-level moderate'
            }
        }`;
  }

  if (sonarEnabled && stages.includes('sonar-analysis')) {
    pipeline += `
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {`;
    
    if (projectType === 'nodejs') {
      pipeline += `
                    sh 'sonar-scanner'`;
    } else if (projectType === 'java') {
      pipeline += `
                    sh 'mvn sonar:sonar'`;
    }
    
    pipeline += `
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }`;
  }

  if (dockerEnabled && stages.includes('docker-build')) {
    pipeline += `
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("${projectName}:${branch}-\${BUILD_NUMBER}")
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }`;
  }

  if (stages.includes('deploy-staging')) {
    pipeline += `
        stage('Deploy to Staging') {
            steps {`;
    
    if (dockerEnabled) {
      pipeline += `
                sh 'docker run -d -p 3000:3000 --name ${projectName}-staging ${projectName}:latest'`;
    } else {
      pipeline += `
                sh 'echo "Deploying to staging environment..."'
                // Add your deployment script here`;
    }
    
    pipeline += `
            }
        }`;
  }

  if (stages.includes('integration-tests')) {
    pipeline += `
        stage('Integration Tests') {
            steps {
                sh 'npm run test:integration'
            }
        }`;
  }

  if (stages.includes('deploy-production') && deploymentTarget === 'production') {
    pipeline += `
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh 'echo "Deploying to production..."'
                // Add your production deployment script here
            }
        }`;
  }

  if (stages.includes('smoke-tests')) {
    pipeline += `
        stage('Smoke Tests') {
            steps {
                sh 'curl -f http://localhost:3000/health || exit 1'
            }
        }`;
  }

  if (stages.includes('cleanup')) {
    pipeline += `
        stage('Cleanup') {
            steps {
                sh 'docker system prune -f'
            }
        }`;
  }

  pipeline += `
    }
    
    post {
        always {
            cleanWs()
        }
        success {`;

  if (emailNotifications) {
    pipeline += `
            emailext (
                subject: "SUCCESS: Job '\${env.JOB_NAME} [\${env.BUILD_NUMBER}]'",
                body: "Good news! Build \${env.BUILD_NUMBER} was successful.",
                to: "${emailNotifications}"
            )`;
  }

  if (slackNotifications) {
    pipeline += `
            slackSend (
                color: 'good',
                message: "SUCCESS: Job '\${env.JOB_NAME} [\${env.BUILD_NUMBER}]' completed successfully."
            )`;
  }

  pipeline += `
        }
        failure {`;

  if (emailNotifications) {
    pipeline += `
            emailext (
                subject: "FAILED: Job '\${env.JOB_NAME} [\${env.BUILD_NUMBER}]'",
                body: "Build \${env.BUILD_NUMBER} failed. Please check the console output.",
                to: "${emailNotifications}"
            )`;
  }

  if (slackNotifications) {
    pipeline += `
            slackSend (
                color: 'danger',
                message: "FAILED: Job '\${env.JOB_NAME} [\${env.BUILD_NUMBER}]' failed!"
            )`;
  }

  pipeline += `
        }
    }
}`;

  return pipeline;
}

router.post('/generate',
  [
    body('projectName').notEmpty().withMessage('Project name is required'),
    body('gitRepository').isURL().withMessage('Valid Git repository URL is required'),
    body('projectType').isIn(['nodejs', 'java', 'python', 'dotnet', 'go', 'php', 'ruby', 'scala']).withMessage('Invalid project type'),
    body('buildTool').notEmpty().withMessage('Build tool is required'),
    body('testCommand').optional().isString(),
    body('buildCommand').optional().isString(),
    body('stages').isArray().withMessage('Stages must be an array')
  ],
  (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const config: JenkinsConfig = req.body;
      const script = generateJenkinsPipeline(config);

      res.json({
        script,
        filename: `Jenkinsfile-${config.projectName}`,
        type: 'jenkins-pipeline'
      });
    } catch (error) {
      console.error('Jenkins generation error:', error);
      res.status(500).json({ error: 'Failed to generate Jenkins pipeline' });
    }
  }
);

export default router;