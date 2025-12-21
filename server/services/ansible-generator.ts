interface AnsibleTask {
  name: string;
  module: string;
  parameters: { [key: string]: string };
  when?: string;
  tags?: string[];
}

interface AnsibleConfig {
  playbookName: string;
  targetHosts: string;
  user: string;
  becomeUser: string;
  tasks: AnsibleTask[];
  variables: { key: string; value: string }[];
  handlers: { name: string; module: string; parameters: { [key: string]: string } }[];
  playbookType: string;
}

export function generateAnsiblePlaybook(config: AnsibleConfig): string {
  const {
    playbookName,
    targetHosts,
    user,
    becomeUser,
    tasks,
    variables,
    handlers,
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
  if (handlers && handlers.length > 0) {
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
        enabled: yes`;
      break;
      
    default:
      tasks += `
    - name: Update system packages
      apt:
        update_cache: yes
        upgrade: safe`;
  }
  
  return tasks;
}