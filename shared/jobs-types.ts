import { z } from "zod";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid';
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  salary?: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedAt: string;
  applyUrl: string;
  source: string;
  logo?: string;
}

export interface JobFilter {
  location?: string;
  experienceLevel?: string;
  type?: string;
  postedWithin?: string;
  search?: string;
}

export const jobFilterSchema = z.object({
  location: z.string().optional(),
  experienceLevel: z.enum(['fresher', 'junior', 'mid', 'senior', 'lead', 'principal', '']).optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'remote', 'hybrid', '']).optional(),
  postedWithin: z.enum(['24h', '7d', '30d', 'all', '']).optional(),
  search: z.string().optional(),
});

export type JobFilterInput = z.infer<typeof jobFilterSchema>;

export const experienceLevels = [
  { value: 'fresher', label: 'Fresher (0-1 years)' },
  { value: 'junior', label: 'Junior (1-3 years)' },
  { value: 'mid', label: 'Mid-Level (3-5 years)' },
  { value: 'senior', label: 'Senior (5-8 years)' },
  { value: 'lead', label: 'Lead (8-12 years)' },
  { value: 'principal', label: 'Principal (12+ years)' },
];

export const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const postedWithinOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export const popularLocations = [
  'Remote',
  'Bangalore',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'United States',
  'United Kingdom',
  'Germany',
  'Singapore',
  'Canada',
  'Australia',
];
