interface ApiConfig {
  name: string;
  database: 'postgresql' | 'mongodb' | 'mysql';
  authentication: boolean;
  oauth: boolean;
  framework: 'express' | 'fastapi' | 'nestjs';
}

interface DockerConfig {
  language: string;
  framework: string;
  port: number;
  baseImage?: string;
  envVars?: string[];
}

export function generateCrudApi(config: ApiConfig): string {
  const { name, database, authentication, framework } = config;
  
  if (framework === 'express') {
    return generateExpressApi(config);
  } else if (framework === 'fastapi') {
    return generateFastApiCode(config);
  } else {
    return generateNestJsApi(config);
  }
}

function generateExpressApi(config: ApiConfig): string {
  const { name, database, authentication } = config;
  
  return `// Auto-generated API for ${name}
const express = require('express');
const cors = require('cors');
${authentication ? `const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');` : ''}
${database === 'postgresql' ? `const { Pool } = require('pg');` : ''}
${database === 'mongodb' ? `const mongoose = require('mongoose');` : ''}
${database === 'mysql' ? `const mysql = require('mysql2/promise');` : ''}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

${database === 'postgresql' ? `
// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});` : ''}

${authentication ? `
// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save user to database
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});` : ''}

// CRUD routes
app.get('/api/${name.toLowerCase()}', ${authentication ? 'authenticateToken, ' : ''}async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ${name.toLowerCase()} ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/${name.toLowerCase()}/:id', ${authentication ? 'authenticateToken, ' : ''}async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ${name.toLowerCase()} WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '${name} not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/${name.toLowerCase()}', ${authentication ? 'authenticateToken, ' : ''}async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO ${name.toLowerCase()} (name, description${authentication ? ', user_id' : ''}) VALUES ($1, $2${authentication ? ', $3' : ''}) RETURNING *',
      [name, description${authentication ? ', req.user.userId' : ''}]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/${name.toLowerCase()}/:id', ${authentication ? 'authenticateToken, ' : ''}async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const result = await pool.query(
      'UPDATE ${name.toLowerCase()} SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '${name} not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/${name.toLowerCase()}/:id', ${authentication ? 'authenticateToken, ' : ''}async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ${name.toLowerCase()} WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '${name} not found' });
    }
    
    res.json({ message: '${name} deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`;
}

function generateFastApiCode(config: ApiConfig): string {
  return `# Auto-generated FastAPI for ${config.name}
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import jwt
import bcrypt
import os
from datetime import datetime, timedelta

app = FastAPI(title="${config.name} API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

# Models
class ${config.name}Base(BaseModel):
    name: str
    description: str

class ${config.name}Create(${config.name}Base):
    pass

class ${config.name}Response(${config.name}Base):
    id: int
    created_at: datetime

${config.authentication ? `
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/register", response_model=dict)
async def register(user: UserCreate):
    # Hash password and save user
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    # Database logic here
    token = jwt.encode({"user_id": 1}, JWT_SECRET, algorithm="HS256")
    return {"user": {"id": 1, "username": user.username, "email": user.email}, "token": token}

@app.post("/api/auth/login", response_model=dict)
async def login(user: UserLogin):
    # Verify credentials
    token = jwt.encode({"user_id": 1}, JWT_SECRET, algorithm="HS256")
    return {"user": {"id": 1, "email": user.email}, "token": token}` : ''}

# CRUD endpoints
@app.get("/api/${config.name.toLowerCase()}", response_model=List[${config.name}Response])
async def get_${config.name.toLowerCase()}s(${config.authentication ? 'current_user: int = Depends(get_current_user)' : ''}):
    # Database query logic
    return []

@app.get("/api/${config.name.toLowerCase()}/{item_id}", response_model=${config.name}Response)
async def get_${config.name.toLowerCase()}(item_id: int, ${config.authentication ? 'current_user: int = Depends(get_current_user)' : ''}):
    # Database query logic
    raise HTTPException(status_code=404, detail="${config.name} not found")

@app.post("/api/${config.name.toLowerCase()}", response_model=${config.name}Response)
async def create_${config.name.toLowerCase()}(item: ${config.name}Create, ${config.authentication ? 'current_user: int = Depends(get_current_user)' : ''}):
    # Database insert logic
    return ${config.name}Response(id=1, name=item.name, description=item.description, created_at=datetime.now())

@app.put("/api/${config.name.toLowerCase()}/{item_id}", response_model=${config.name}Response)
async def update_${config.name.toLowerCase()}(item_id: int, item: ${config.name}Create, ${config.authentication ? 'current_user: int = Depends(get_current_user)' : ''}):
    # Database update logic
    return ${config.name}Response(id=item_id, name=item.name, description=item.description, created_at=datetime.now())

@app.delete("/api/${config.name.toLowerCase()}/{item_id}")
async def delete_${config.name.toLowerCase()}(item_id: int, ${config.authentication ? 'current_user: int = Depends(get_current_user)' : ''}):
    # Database delete logic
    return {"message": "${config.name} deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`;
}

function generateNestJsApi(config: ApiConfig): string {
  return `// Auto-generated NestJS API for ${config.name}
// This is a basic structure - implement the full NestJS modules as needed

// app.module.ts
import { Module } from '@nestjs/common';
import { ${config.name}Module } from './${config.name.toLowerCase()}/${config.name.toLowerCase()}.module';
${config.authentication ? `import { AuthModule } from './auth/auth.module';` : ''}

@Module({
  imports: [${config.name}Module${config.authentication ? ', AuthModule' : ''}],
})
export class AppModule {}

// ${config.name.toLowerCase()}.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param${config.authentication ? ', UseGuards' : ''} } from '@nestjs/common';
${config.authentication ? `import { JwtAuthGuard } from '../auth/jwt-auth.guard';` : ''}

@Controller('api/${config.name.toLowerCase()}')
${config.authentication ? '@UseGuards(JwtAuthGuard)' : ''}
export class ${config.name}Controller {
  
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  create(@Body() data: any) {
    return {};
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return {};
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { message: '${config.name} deleted successfully' };
  }
}`;
}

export function generateDockerfile(config: DockerConfig): string {
  const { language, framework, port, baseImage, envVars = [] } = config;
  
  if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'node') {
    return generateNodeDockerfile(framework, port, baseImage, envVars);
  } else if (language.toLowerCase() === 'python') {
    return generatePythonDockerfile(framework, port, baseImage, envVars);
  } else if (language.toLowerCase() === 'java') {
    return generateJavaDockerfile(framework, port, baseImage, envVars);
  } else {
    return generateGenericDockerfile(language, port, baseImage, envVars);
  }
}

function generateNodeDockerfile(framework: string, port: number, baseImage?: string, envVars: string[] = []): string {
  const base = baseImage || 'node:18-alpine';
  
  return `# Auto-generated Dockerfile for ${framework}
FROM ${base}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Environment variables
${envVars.map(env => `ENV ${env}`).join('\n')}
ENV NODE_ENV=production
ENV PORT=${port}

# Expose port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

# Start application
CMD ["npm", "start"]`;
}

function generatePythonDockerfile(framework: string, port: number, baseImage?: string, envVars: string[] = []): string {
  const base = baseImage || 'python:3.11-slim';
  
  return `# Auto-generated Dockerfile for ${framework}
FROM ${base}

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' python

# Change ownership
RUN chown -R python:python /app
USER python

# Environment variables
${envVars.map(env => `ENV ${env}`).join('\n')}
ENV PYTHONUNBUFFERED=1
ENV PORT=${port}

# Expose port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]`;
}

function generateJavaDockerfile(framework: string, port: number, baseImage?: string, envVars: string[] = []): string {
  const base = baseImage || 'openjdk:17-jdk-slim';
  
  return `# Auto-generated Dockerfile for ${framework}
FROM ${base}

# Set working directory
WORKDIR /app

# Copy build files
COPY target/*.jar app.jar

# Environment variables
${envVars.map(env => `ENV ${env}`).join('\n')}
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SERVER_PORT=${port}

# Expose port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/actuator/health || exit 1

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]`;
}

function generateGenericDockerfile(language: string, port: number, baseImage?: string, envVars: string[] = []): string {
  return `# Auto-generated Dockerfile for ${language}
FROM ${baseImage || 'ubuntu:20.04'}

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Environment variables
${envVars.map(env => `ENV ${env}`).join('\n')}
ENV PORT=${port}

# Expose port
EXPOSE ${port}

# TODO: Add specific build and run commands for ${language}
CMD ["echo", "Please configure the startup command for ${language}"]`;
}

export function generateDockerCompose(services: { name: string; port: number; envFile?: string }[]): string {
  return `# Auto-generated docker-compose.yml
version: '3.8'

services:
${services.map(service => `  ${service.name}:
    build: .
    ports:
      - "${service.port}:${service.port}"
    environment:
      - NODE_ENV=production
      - PORT=${service.port}
    ${service.envFile ? `env_file:
      - ${service.envFile}` : ''}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${service.port}/health"]
      interval: 30s
      timeout: 10s
      retries: 3`).join('\n\n')}

  # Database service (uncomment and configure as needed)
  # postgres:
  #   image: postgres:15-alpine
  #   environment:
  #     POSTGRES_DB: myapp
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   ports:
  #     - "5432:5432"

  # Redis service (uncomment if needed)
  # redis:
  #   image: redis:7-alpine
  #   ports:
  #     - "6379:6379"

# volumes:
#   postgres_data:`;
}

export function generateGitHubActions(config: { language: string; framework: string; testCommand?: string }): string {
  const { language, framework, testCommand } = config;
  
  return `# Auto-generated GitHub Actions workflow
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    ${language.toLowerCase() === 'javascript' || language.toLowerCase() === 'node' ? `
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: ${testCommand || 'npm test'}
    
    - name: Run linting
      run: npm run lint
      continue-on-error: true` : ''}
    
    ${language.toLowerCase() === 'python' ? `
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: ${testCommand || 'pytest'}` : ''}

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: \${{ secrets.DOCKER_USERNAME }}
        password: \${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          \${{ secrets.DOCKER_USERNAME }}/${framework}-app:latest
          \${{ secrets.DOCKER_USERNAME }}/${framework}-app:\${{ github.sha }}
    
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        echo "Add your deployment script here"
        # Example: kubectl set image deployment/app app=\${{ secrets.DOCKER_USERNAME }}/${framework}-app:\${{ github.sha }}`;
}
