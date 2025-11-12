export interface AnalyticsData {
  projects: {
    total: number;
    byStatus: { status: string; count: number }[];
    byProgress: { range: string; count: number }[];
    byLecturer: { lecturer: string; count: number }[];
  };
  tasks: {
    total: number;
    byStatus: { status: string; count: number }[];
    byPriority: { priority: string; count: number }[];
    overdue: number;
    completed: number;
  };
  documents: {
    total: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    totalSize: number;
  };
  users: {
    total: number;
    byRole: { role: string; count: number }[];
    active: number;
  };
  activity: {
    recentProjects: any[];
    recentTasks: any[];
    recentDocuments: any[];
  };
  performance: {
    completionRate: number;
    averageProjectProgress: number;
    tasksCompletedThisPeriod: number;
    documentsUploadedThisPeriod: number;
    overdueTaskRate: number;
    activeProjectRate: number;
  };
  trends: {
    projectsCreated: { date: string; count: number }[];
    tasksCompleted: { date: string; count: number }[];
    documentsUploaded: { date: string; count: number }[];
  };
  timeRange: {
    start: string;
    end: string;
    period: string;
  };
}

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

