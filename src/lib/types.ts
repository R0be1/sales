
export type District = {
  id: string;
  name: string;
};

export type Officer = {
  id: string;
  name: string;
};

export type Branch = {
  id: string;
  name: string;
  districtId: string;
  officers: Officer[];
};

export type SalesLead = {
  id: string;
  title: string;
  description: string;
  status: 'New' | 'Assigned' | 'In Progress' | 'Pending Closure' | 'Pending District Approval' | 'Closed' | 'Reopened';
  districtId: string;
  branchId?: string;
  officerId?: string;
  location: {
    lat: number;
    lng: number;
  };
  updates: {
    text: string;
    timestamp: Date;
    author: string;
    attachment?: {
        name: string;
        dataUrl: string;
    },
    generatedSavings?: number;
    reportingLocation?: {
        lat: number;
        lng: number;
    }
  }[];
  createdAt: Date;
  expectedSavings: number;
  deadline: Date;
};

export type BranchPlan = {
  id: string;
  branchId: string;
  quarter: string;
  savingsTarget: number;
  entries: PlanEntry[];
};

export type PlanEntry = {
  id: string;
  date: Date;
  type: 'collection' | 'withdrawal';
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: string;
  reviewedBy?: string;
  rejectionReason?: string;
};
