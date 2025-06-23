
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
  status: 'New' | 'Assigned' | 'In Progress' | 'Pending Closure' | 'Closed' | 'Reopened';
  districtId: string;
  branchId: string;
  officerId: string;
  location: {
    lat: number;
    lng: number;
  };
  updates: {
    text: string;
    timestamp: Date;
    author: string;
  }[];
  createdAt: Date;
  expectedSavings: number;
};
