interface SonarQubeConfig {
  setupType: string;
  version: string;
  database: string;
  javaVersion: string;
  serverPort: string;
  serverHost: string;
  webContext: string;
  elasticsearch: boolean;
  authentication: string;
  plugins: string[];
  environment: string;
}

export function generateSonarQubeSetup(config: SonarQubeConfig): string {
  const { setupType } = config;

  if (setupType === 'docker') {
    return generateDockerSetup(config);
  } else if (setupType === 'kubernetes') {
    return generateKubernetesSetup(config);
  } else if (setupType === 'manual') {
    return generateManualSetup(config);
  } else {
    return generateDockerSetup(config); // Default to Docker
  }
}

function generateDockerSetup(config: SonarQubeConfig): string {
  const { version, serverPort, plugins } = config;
  
  let dockerCompose = `version: '3.8'

services:
  sonarqube:
    image: sonarqube:${version}
    container_name: sonarqube
    ports:
      - "${serverPort}:9000"
    environment:
      - SONAR_JDBC_URL=jdbc:postgresql://db:5432/sonarqube
      - SONAR_JDBC_USERNAME=sonarqube
      - SONAR_JDBC_PASSWORD=sonarqube_password
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
      - sonarqube_extensions:/opt/sonarqube/extensions`;

  if (plugins.length > 0) {
    dockerCompose += `
      - ./plugins:/opt/sonarqube/extensions/plugins`;
  }

  dockerCompose += `
    depends_on:
      - db
    networks:
      - sonarqube_network

  db:
    image: postgres:13
    container_name: sonarqube_db
    environment:
      - POSTGRES_USER=sonarqube
      - POSTGRES_PASSWORD=sonarqube_password
      - POSTGRES_DB=sonarqube
    volumes:
      - postgresql_data:/var/lib/postgresql/data
    networks:
      - sonarqube_network

volumes:
  sonarqube_data:
  sonarqube_logs:
  sonarqube_extensions:
  postgresql_data:

networks:
  sonarqube_network:
    driver: bridge

# Setup Instructions:
# 1. Save this as docker-compose.yml
# 2. Run: docker-compose up -d
# 3. Access: http://${config.serverHost}:${serverPort}
# 4. Default credentials: admin/admin`;

  return dockerCompose;
}

function generateKubernetesSetup(config: SonarQubeConfig): string {
  const { version, serverPort } = config;
  
  return `# SonarQube Kubernetes Deployment
apiVersion: v1
kind: Namespace
metadata:
  name: sonarqube

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sonarqube
  namespace: sonarqube
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sonarqube
  template:
    metadata:
      labels:
        app: sonarqube
    spec:
      containers:
      - name: sonarqube
        image: sonarqube:${version}
        ports:
        - containerPort: 9000
        env:
        - name: SONAR_JDBC_URL
          value: "jdbc:postgresql://postgres-service:5432/sonarqube"
        - name: SONAR_JDBC_USERNAME
          value: "sonarqube"
        - name: SONAR_JDBC_PASSWORD
          value: "sonarqube_password"

---
apiVersion: v1
kind: Service
metadata:
  name: sonarqube-service
  namespace: sonarqube
spec:
  selector:
    app: sonarqube
  ports:
  - port: 9000
    targetPort: 9000
  type: LoadBalancer

# Deploy with: kubectl apply -f sonarqube-k8s.yaml`;
}

function generateManualSetup(config: SonarQubeConfig): string {
  const { version, javaVersion, serverPort, serverHost } = config;
  
  return `#!/bin/bash
# SonarQube Manual Installation Script

set -e

echo "Starting SonarQube ${version} installation..."

# Install Java ${javaVersion}
echo "Installing Java ${javaVersion}..."
sudo apt update
sudo apt install -y openjdk-${javaVersion}-jdk

# Create SonarQube user
echo "Creating sonarqube user..."
sudo useradd -m -d /opt/sonarqube -s /bin/bash sonarqube

# Download and install SonarQube
echo "Downloading SonarQube ${version}..."
cd /tmp
wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-${version.replace('-community', '')}.zip
unzip sonarqube-${version.replace('-community', '')}.zip
sudo mv sonarqube-${version.replace('-community', '')} /opt/sonarqube
sudo chown -R sonarqube:sonarqube /opt/sonarqube

# Configure SonarQube
echo "Configuring SonarQube..."
sudo -u sonarqube tee /opt/sonarqube/conf/sonar.properties << EOF
sonar.web.host=${serverHost}
sonar.web.port=${serverPort}
EOF

echo "SonarQube installation completed!"
echo "Access SonarQube at: http://${serverHost}:${serverPort}"
echo "Default credentials: admin/admin"`;
}