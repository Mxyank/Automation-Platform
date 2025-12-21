import { Router } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

interface AnsibleTask {
  name: string;
  module: string;
  parameters: { [key: string]: string };
  when?: string;
  tags?: string[];
}

interface AnsibleHandler {
  name: string;
  module: string;
  parameters: { [key: string]: string };
}

interface AnsibleConfig {
  playbookName: string;
  targetHosts: string;
  user: string;
  becomeUser: string;
  tasks: AnsibleTask[];
  variables: { key: string; value: string }[];
  handlers: AnsibleHandler[];
  roles: string[];
  playbookType: string;
}

function generateAnsiblePlaybook(config: AnsibleConfig): string {
  const {
    playbookName,
    targetHosts,
    user,
    becomeUser,
    tasks,
    variables,
    handlers,
    roles,
    playbookType
  } = config;

  let playbook = `---
- name: ${playbookName}
  hosts: ${targetHosts}
  remote_user: ${user}
  become: yes
  become_user: ${becomeUser}`;

  // Add variables if any
  if (variables.length > 0) {
    playbook += `\n  vars:`;
    variables.forEach(variable => {
      if (variable.key && variable.value) {
        playbook += `\n    ${variable.key}: ${variable.value}`;
      }
    });
  }

  // Add roles if any
  if (roles.length > 0) {
    playbook += `\n  roles:`;
    roles.forEach(role => {
      playbook += `\n    - ${role}`;
    });
  }

  // Add tasks
  if (tasks.length > 0) {
    playbook += `\n  tasks:`;
    
    tasks.forEach(task => {
      playbook += `\n    - name: ${task.name}`;
      playbook += `\n      ${task.module}:`;
      
      // Add parameters
      Object.entries(task.parameters).forEach(([key, value]) => {
        if (value) {
          playbook += `\n        ${key}: ${value}`;
        }
      });
      
      // Add conditions if any
      if (task.when) {
        playbook += `\n      when: ${task.when}`;
      }
      
      // Add tags if any
      if (task.tags && task.tags.length > 0) {
        playbook += `\n      tags:`;
        task.tags.forEach(tag => {
          playbook += `\n        - ${tag}`;
        });
      }
      
      playbook += '\n';
    });
  } else {
    // Add default tasks based on playbook type
    playbook += generateDefaultTasks(playbookType);
  }

  // Add handlers if any
  if (handlers.length > 0) {
    playbook += `\n  handlers:`;
    handlers.forEach(handler => {
      playbook += `\n    - name: ${handler.name}`;
      playbook += `\n      ${handler.module}:`;
      
      Object.entries(handler.parameters).forEach(([key, value]) => {
        if (value) {
          playbook += `\n        ${key}: ${value}`;
        }
      });
    });
  }

  return playbook;
}

function generateDefaultTasks(playbookType: string): string {
  let tasks = `\n  tasks:`;
  
  switch (playbookType) {
    case 'web-server':
      tasks += `
    - name: Update apt package cache
      apt:
        update_cache: yes
        
    - name: Install Nginx
      apt:
        name: nginx
        state: present
        
    - name: Start and enable Nginx
      systemd:
        name: nginx
        state: started
        enabled: yes
        
    - name: Configure firewall for HTTP and HTTPS
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - '80'
        - '443'
        
    - name: Create web directory
      file:
        path: /var/www/html
        state: directory
        owner: www-data
        group: www-data
        mode: '0755'`;
      break;
      
    case 'database':
      tasks += `
    - name: Update apt package cache
      apt:
        update_cache: yes
        
    - name: Install PostgreSQL and dependencies
      apt:
        name:
          - postgresql
          - postgresql-contrib
          - python3-psycopg2
        state: present
        
    - name: Start and enable PostgreSQL
      systemd:
        name: postgresql
        state: started
        enabled: yes
        
    - name: Create application database
      postgresql_db:
        name: "{{ app_db_name | default('myapp') }}"
        state: present
      become_user: postgres
      
    - name: Create database user
      postgresql_user:
        name: "{{ app_db_user | default('appuser') }}"
        password: "{{ app_db_password | default('changeme') }}"
        priv: "{{ app_db_name | default('myapp') }}:ALL"
        state: present
      become_user: postgres`;
      break;
      
    case 'docker':
      tasks += `
    - name: Update apt package cache
      apt:
        update_cache: yes
        
    - name: Install dependencies
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - gnupg
          - lsb-release
        state: present
        
    - name: Add Docker's official GPG key
      apt_key:
        url: https://download.docker.com/linux/ubuntu/gpg
        state: present
        
    - name: Add Docker repository
      apt_repository:
        repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
        
    - name: Install Docker
      apt:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
        state: present
        
    - name: Start and enable Docker
      systemd:
        name: docker
        state: started
        enabled: yes
        
    - name: Add user to docker group
      user:
        name: "{{ ansible_user }}"
        groups: docker
        append: yes`;
      break;
      
    case 'security':
      tasks += `
    - name: Update all packages
      apt:
        upgrade: dist
        update_cache: yes
        
    - name: Install security packages
      apt:
        name:
          - fail2ban
          - ufw
          - unattended-upgrades
        state: present
        
    - name: Configure SSH security
      lineinfile:
        path: /etc/ssh/sshd_config
        regexp: "{{ item.regexp }}"
        line: "{{ item.line }}"
        backup: yes
      loop:
        - { regexp: '^PasswordAuthentication', line: 'PasswordAuthentication no' }
        - { regexp: '^PermitRootLogin', line: 'PermitRootLogin no' }
        - { regexp: '^X11Forwarding', line: 'X11Forwarding no' }
      notify: restart ssh
      
    - name: Enable UFW firewall
      ufw:
        state: enabled
        policy: deny
        direction: incoming
        
    - name: Allow SSH through firewall
      ufw:
        rule: allow
        port: '22'
        proto: tcp
        
    - name: Configure fail2ban
      copy:
        dest: /etc/fail2ban/jail.local
        content: |
          [DEFAULT]
          bantime = 3600
          findtime = 600
          maxretry = 3
          
          [sshd]
          enabled = true
      notify: restart fail2ban`;
      break;
      
    case 'monitoring':
      tasks += `
    - name: Update apt package cache
      apt:
        update_cache: yes
        
    - name: Install monitoring tools
      apt:
        name:
          - htop
          - iotop
          - netstat-nat
          - tcpdump
          - nmap
        state: present
        
    - name: Install Node Exporter
      get_url:
        url: https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
        dest: /tmp/node_exporter.tar.gz
        
    - name: Extract Node Exporter
      unarchive:
        src: /tmp/node_exporter.tar.gz
        dest: /tmp
        remote_src: yes
        
    - name: Copy Node Exporter binary
      copy:
        src: /tmp/node_exporter-1.6.1.linux-amd64/node_exporter
        dest: /usr/local/bin/
        mode: '0755'
        remote_src: yes
        
    - name: Create Node Exporter service
      copy:
        dest: /etc/systemd/system/node_exporter.service
        content: |
          [Unit]
          Description=Node Exporter
          After=network.target
          
          [Service]
          Type=simple
          ExecStart=/usr/local/bin/node_exporter
          
          [Install]
          WantedBy=multi-user.target
      notify: restart node_exporter`;
      break;
      
    default:
      tasks += `
    - name: Update system packages
      apt:
        update_cache: yes
        upgrade: safe
        
    - name: Ensure common packages are installed
      apt:
        name:
          - curl
          - wget
          - git
          - vim
          - htop
        state: present`;
  }
  
  return tasks;
}

router.post('/generate',
  [
    body('playbookName').notEmpty().withMessage('Playbook name is required'),
    body('targetHosts').notEmpty().withMessage('Target hosts are required'),
    body('user').notEmpty().withMessage('Remote user is required'),
    body('playbookType').isIn(['server-setup', 'web-server', 'database', 'docker', 'security', 'monitoring', 'backup', 'custom']).withMessage('Invalid playbook type')
  ],
  (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const config: AnsibleConfig = req.body;
      const playbook = generateAnsiblePlaybook(config);

      res.json({
        playbook,
        filename: `${config.playbookName}.yml`,
        type: 'ansible-playbook'
      });
    } catch (error) {
      console.error('Ansible generation error:', error);
      res.status(500).json({ error: 'Failed to generate Ansible playbook' });
    }
  }
);

export default router;