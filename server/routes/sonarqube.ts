import { Router } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

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

function generateSonarQubeSetup(config: SonarQubeConfig): string {
  const {
    setupType,
    version,
    database,
    javaVersion,
    serverPort,
    serverHost,
    webContext,
    elasticsearch,
    authentication,
    plugins,
    environment
  } = config;

  let script = '';

  if (setupType === 'docker') {
    script = generateDockerSetup(config);
  } else if (setupType === 'kubernetes') {
    script = generateKubernetesSetup(config);
  } else if (setupType === 'manual') {
    script = generateManualSetup(config);
  } else if (setupType === 'zip') {
    script = generateZipSetup(config);
  } else if (setupType === 'rpm') {
    script = generateRpmSetup(config);
  }

  return script;
}

function generateDockerSetup(config: SonarQubeConfig): string {
  const { version, database, serverPort, plugins, environment } = config;
  
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
      - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true`;

  if (environment === 'production') {
    dockerCompose += `
      - SONAR_WEB_JAVAADDITIONALOPTS=-server -Xmx2g -Xms512m
      - SONAR_CE_JAVAADDITIONALOPTS=-server -Xmx2g -Xms512m`;
  }

  dockerCompose += `
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

# Setup script
# 1. Save this as docker-compose.yml
# 2. Create plugins directory: mkdir -p plugins
# 3. Download plugins if needed
# 4. Run: docker-compose up -d
# 5. Wait for startup (check logs: docker-compose logs -f sonarqube)
# 6. Access: http://${config.serverHost}:${serverPort}
# 7. Default credentials: admin/admin`;

  if (plugins.length > 0) {
    dockerCompose += `

# Plugin download script:
#!/bin/bash
cd plugins/`;

    plugins.forEach(plugin => {
      const pluginUrls: { [key: string]: string } = {
        'sonar-javascript-plugin': 'https://github.com/SonarSource/SonarJS/releases/download/10.1.0.25586/sonar-javascript-plugin-10.1.0.25586.jar',
        'sonar-python-plugin': 'https://binaries.sonarsource.com/Distribution/sonar-python-plugin/sonar-python-plugin-4.5.0.8847.jar',
        'sonar-java-plugin': 'https://binaries.sonarsource.com/Distribution/sonar-java-plugin/sonar-java-plugin-7.25.0.31298.jar',
        'sonar-php-plugin': 'https://binaries.sonarsource.com/Distribution/sonar-php-plugin/sonar-php-plugin-3.27.0.9352.jar',
        'sonar-csharp-plugin': 'https://binaries.sonarsource.com/Distribution/sonar-csharp-plugin/sonar-csharp-plugin-9.8.0.76515.jar'
      };
      
      if (pluginUrls[plugin]) {
        dockerCompose += `\nwget ${pluginUrls[plugin]}`;
      }
    });
  }

  return dockerCompose;
}

function generateKubernetesSetup(config: SonarQubeConfig): string {
  const { version, serverPort, environment } = config;
  
  return `# SonarQube Kubernetes Deployment
apiVersion: v1
kind: Namespace
metadata:
  name: sonarqube

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: sonarqube-config
  namespace: sonarqube
data:
  sonar.properties: |
    sonar.jdbc.url=jdbc:postgresql://postgres-service:5432/sonarqube
    sonar.jdbc.username=sonarqube
    sonar.jdbc.password=sonarqube_password
    sonar.web.host=0.0.0.0
    sonar.web.port=${serverPort}
    sonar.es.bootstrap.checks.disable=true

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
        resources:
          requests:
            memory: "2Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: sonar-data
          mountPath: /opt/sonarqube/data
        - name: sonar-logs
          mountPath: /opt/sonarqube/logs
      volumes:
      - name: sonar-data
        persistentVolumeClaim:
          claimName: sonar-data-pvc
      - name: sonar-logs
        persistentVolumeClaim:
          claimName: sonar-logs-pvc

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

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sonar-data-pvc
  namespace: sonarqube
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sonar-logs-pvc
  namespace: sonarqube
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi

# PostgreSQL Deployment
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: sonarqube
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:13
        env:
        - name: POSTGRES_DB
          value: "sonarqube"
        - name: POSTGRES_USER
          value: "sonarqube"
        - name: POSTGRES_PASSWORD
          value: "sonarqube_password"
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-data-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: sonarqube
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: sonarqube
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi

# Deploy with: kubectl apply -f sonarqube-k8s.yaml`;
}

function generateManualSetup(config: SonarQubeConfig): string {
  const { version, javaVersion, database, serverPort, serverHost, authentication } = config;
  
  return `#!/bin/bash
# SonarQube Manual Installation Script

set -e

echo "Starting SonarQube ${version} installation..."

# System requirements check
echo "Checking system requirements..."
if [ "$(ulimit -n)" -lt 131072 ]; then
    echo "Warning: File descriptor limit too low. Increase with: ulimit -n 131072"
fi

if [ "$(sysctl -n vm.max_map_count)" -lt 524288 ]; then
    echo "Setting vm.max_map_count..."
    sudo sysctl -w vm.max_map_count=524288
    echo "vm.max_map_count=524288" | sudo tee -a /etc/sysctl.conf
fi

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

# Database setup (PostgreSQL)
if [ "${database}" = "postgresql" ]; then
    echo "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    
    echo "Creating SonarQube database..."
    sudo -u postgres psql << EOF
CREATE DATABASE sonarqube;
CREATE USER sonaruser WITH ENCRYPTED PASSWORD 'sonarpass';
GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonaruser;
ALTER USER sonaruser CREATEDB;
\\q
EOF
fi

# Configure SonarQube
echo "Configuring SonarQube..."
sudo -u sonarqube tee /opt/sonarqube/conf/sonar.properties << EOF
# Database configuration
sonar.jdbc.username=sonaruser
sonar.jdbc.password=sonarpass
sonar.jdbc.url=jdbc:postgresql://localhost/sonarqube

# Web server configuration
sonar.web.host=${serverHost}
sonar.web.port=${serverPort}
sonar.web.context=${config.webContext}

# Elasticsearch configuration
sonar.search.javaOpts=-Xmx2g -Xms2g

# Application server configuration
sonar.ce.javaOpts=-Xmx2g -Xms512m
sonar.web.javaOpts=-Xmx2g -Xms512m

# Security configuration
sonar.forceAuthentication=true
EOF

# Create systemd service
echo "Creating systemd service..."
sudo tee /etc/systemd/system/sonarqube.service << EOF
[Unit]
Description=SonarQube service
After=syslog.target network.target

[Service]
Type=forking
ExecStart=/opt/sonarqube/bin/linux-x86-64/sonar.sh start
ExecStop=/opt/sonarqube/bin/linux-x86-64/sonar.sh stop
User=sonarqube
Group=sonarqube
Restart=always
LimitNOFILE=131072
LimitNPROC=8192

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow ${serverPort}/tcp

# Start services
echo "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable sonarqube
sudo systemctl start sonarqube

echo "SonarQube installation completed!"
echo "Access SonarQube at: http://${serverHost}:${serverPort}"
echo "Default credentials: admin/admin"
echo ""
echo "Check status with: sudo systemctl status sonarqube"
echo "View logs with: sudo journalctl -u sonarqube -f"
echo ""
echo "Important: Change default password after first login!"`;
}

function generateZipSetup(config: SonarQubeConfig): string {
  return `#!/bin/bash
# SonarQube ZIP Distribution Setup

echo "SonarQube ZIP Installation Guide"
echo "================================"

# Download SonarQube
echo "1. Download SonarQube ${config.version}"
echo "   wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-${config.version.replace('-community', '')}.zip"

echo ""
echo "2. Extract the archive"
echo "   unzip sonarqube-${config.version.replace('-community', '')}.zip"

echo ""
echo "3. Move to installation directory"
echo "   sudo mv sonarqube-${config.version.replace('-community', '')} /opt/sonarqube"

echo ""
echo "4. Create sonarqube user"
echo "   sudo useradd -m -s /bin/bash sonarqube"
echo "   sudo chown -R sonarqube:sonarqube /opt/sonarqube"

echo ""
echo "5. Configure database connection (edit conf/sonar.properties)"
echo "   sonar.jdbc.username=sonaruser"
echo "   sonar.jdbc.password=sonarpass"
echo "   sonar.jdbc.url=jdbc:postgresql://localhost/sonarqube"

echo ""
echo "6. Set system limits"
echo "   echo 'vm.max_map_count=524288' | sudo tee -a /etc/sysctl.conf"
echo "   sudo sysctl -w vm.max_map_count=524288"

echo ""
echo "7. Start SonarQube"
echo "   sudo -u sonarqube /opt/sonarqube/bin/linux-x86-64/sonar.sh start"

echo ""
echo "8. Check logs"
echo "   tail -f /opt/sonarqube/logs/sonar.log"

echo ""
echo "Access URL: http://${config.serverHost}:${config.serverPort}"
echo "Default credentials: admin/admin"`;
}

function generateRpmSetup(config: SonarQubeConfig): string {
  return `#!/bin/bash
# SonarQube RPM Installation Script

echo "Installing SonarQube via RPM package..."

# Add SonarSource repository
echo "Adding SonarSource repository..."
sudo tee /etc/yum.repos.d/sonar.repo << EOF
[sonar]
name=SonarQube Repository
baseurl=https://binaries.sonarsource.com/Distribution/rpm/
enabled=1
gpgcheck=0
EOF

# Install Java
echo "Installing Java ${config.javaVersion}..."
sudo yum install -y java-${config.javaVersion}-openjdk

# Install PostgreSQL
echo "Installing PostgreSQL..."
sudo yum install -y postgresql-server postgresql-contrib

# Initialize PostgreSQL
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create SonarQube database
echo "Creating SonarQube database..."
sudo -u postgres psql << EOF
CREATE DATABASE sonarqube;
CREATE USER sonaruser WITH PASSWORD 'sonarpass';
GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonaruser;
\\q
EOF

# Install SonarQube
echo "Installing SonarQube..."
sudo yum install -y sonarqube

# Configure SonarQube
echo "Configuring SonarQube..."
sudo tee -a /opt/sonarqube/conf/sonar.properties << EOF
sonar.jdbc.username=sonaruser
sonar.jdbc.password=sonarpass
sonar.jdbc.url=jdbc:postgresql://localhost/sonarqube
sonar.web.host=${config.serverHost}
sonar.web.port=${config.serverPort}
EOF

# Set system limits
echo "Setting system limits..."
echo 'vm.max_map_count=524288' | sudo tee -a /etc/sysctl.conf
sudo sysctl -w vm.max_map_count=524288

# Configure firewall
echo "Configuring firewall..."
sudo firewall-cmd --permanent --add-port=${config.serverPort}/tcp
sudo firewall-cmd --reload

# Start SonarQube
echo "Starting SonarQube..."
sudo systemctl enable sonarqube
sudo systemctl start sonarqube

echo "Installation completed!"
echo "Access SonarQube at: http://${config.serverHost}:${config.serverPort}"
echo "Default credentials: admin/admin"`;
}

router.post('/setup',
  [
    body('setupType').isIn(['docker', 'kubernetes', 'manual', 'zip', 'rpm']).withMessage('Invalid setup type'),
    body('version').notEmpty().withMessage('Version is required'),
    body('database').isIn(['postgresql', 'mssql', 'oracle', 'h2']).withMessage('Invalid database type'),
    body('javaVersion').isIn(['11', '17', '21']).withMessage('Invalid Java version'),
    body('serverPort').isPort().withMessage('Invalid port number')
  ],
  (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const config: SonarQubeConfig = req.body;
      const script = generateSonarQubeSetup(config);

      res.json({
        script,
        filename: `sonarqube-setup-${config.setupType}.${config.setupType === 'kubernetes' ? 'yaml' : 'sh'}`,
        type: 'sonarqube-setup'
      });
    } catch (error) {
      console.error('SonarQube setup generation error:', error);
      res.status(500).json({ error: 'Failed to generate SonarQube setup' });
    }
  }
);

export default router;