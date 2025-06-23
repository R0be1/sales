import type { SalesLead, Branch, Officer, District } from '@/lib/types';

export const districts: District[] = [
    { id: 'dist-1', name: 'Metro Area' },
    { id: 'dist-2', name: 'Suburban Area' },
];

export const branches: Branch[] = [
  { id: 'branch-1', name: 'North Branch', districtId: 'dist-1', officers: [{ id: 'officer-1', name: 'John Doe' }, { id: 'officer-2', name: 'Jane Smith' }] },
  { id: 'branch-2', name: 'South Branch', districtId: 'dist-1', officers: [{ id: 'officer-3', name: 'Peter Jones' }, { id: 'officer-4', name: 'Mary Williams' }] },
  { id: 'branch-3', name: 'West Branch', districtId: 'dist-2', officers: [{ id: 'officer-5', name: 'Sam Brown' }, { id: 'officer-6', name: 'Patricia Green' }] },
];

export const initialLeads: SalesLead[] = [
  {
    id: 'lead-1',
    title: 'New Client Inquiry - TechCorp',
    description: 'TechCorp is interested in our new software suite. Follow up required.',
    status: 'In Progress',
    districtId: 'dist-1',
    branchId: 'branch-1',
    officerId: 'officer-1',
    location: { lat: 34.0522, lng: -118.2437 },
    expectedSavings: 50000,
    updates: [
        { text: 'Assigned to John Doe', timestamp: new Date(), author: 'Branch Manager' },
        { text: 'Initial meeting held. Client is very interested.', timestamp: new Date(), author: 'John Doe', generatedSavings: 25000 }
    ],
    createdAt: new Date(),
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
  {
    id: 'lead-2',
    title: 'Partnership Opportunity - Innovate LLC',
    description: 'Potential partnership to integrate our platforms.',
    status: 'Assigned',
    districtId: 'dist-1',
    branchId: 'branch-2',
    location: { lat: 40.7128, lng: -74.0060 },
    expectedSavings: 120000,
    updates: [{ text: 'Initial contact made.', timestamp: new Date(), author: 'District Manager' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)),
  },
  {
    id: 'lead-3',
    title: 'Renewal - Global Solutions',
    description: 'Contract renewal due next month. Need to discuss new terms.',
    status: 'New',
    districtId: 'dist-2',
    location: { lat: 51.5074, lng: -0.1278 },
    expectedSavings: 75000,
    updates: [],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)),
  },
];

export const leadStatusOptions: SalesLead['status'][] = ['New', 'Assigned', 'In Progress', 'Pending Closure', 'Closed', 'Reopened'];
