
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { initialLeads, branches } from '@/lib/data';

type OffsiteReport = {
  lead: SalesLead;
  update: SalesLead['updates'][0];
  distance: number;
};

export default function OffsiteReportsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [distanceThreshold, setDistanceThreshold] = useState(1);
  
  useEffect(() => {
    const storedLeadsJSON = localStorage.getItem('salesLeads');
    let leadsData: SalesLead[];
    if (storedLeadsJSON) {
        leadsData = JSON.parse(storedLeadsJSON).map((lead: any) => ({
            ...lead,
            createdAt: new Date(lead.createdAt),
            deadline: lead.deadline ? new Date(lead.deadline) : null,
            updates: (lead.updates || []).map((update: any) => ({
                ...update,
                timestamp: new Date(update.timestamp),
            })),
        }));
    } else {
        leadsData = initialLeads;
        localStorage.setItem('salesLeads', JSON.stringify(initialLeads));
    }
    setLeads(leadsData);

    const storedThreshold = localStorage.getItem('offsiteDistanceThreshold');
    if (storedThreshold) {
        const parsedThreshold = parseFloat(storedThreshold);
        if (!isNaN(parsedThreshold)) {
            setDistanceThreshold(parsedThreshold);
        }
    }
  }, []);

  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const offsiteReports = useMemo((): OffsiteReport[] => {
    const reports: OffsiteReport[] = [];
    leads.forEach(lead => {
      if (lead.location) {
        lead.updates.forEach(update => {
          if (update.reportingLocation) {
            const distance = getDistanceInKm(
              lead.location.lat,
              lead.location.lng,
              update.reportingLocation.lat,
              update.reportingLocation.lng
            );
            if (distance > distanceThreshold) { // Check if distance is greater than the threshold
              reports.push({ lead, update, distance });
            }
          }
        });
      }
    });
    return reports.sort((a, b) => b.update.timestamp.getTime() - a.update.timestamp.getTime());
  }, [leads, distanceThreshold]);
  
  const getOfficerName = (officerId?: string) => {
      if (!officerId) return 'N/A';
      return branches.flatMap(b => b.officers).find(o => o.id === officerId)?.name || 'N/A';
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <Icons.workflow className="w-6 h-6 text-primary" />
                <h2 className="font-semibold text-lg">SalesFlow</h2>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard"><SidebarMenuButton><Icons.dashboard className="mr-2" />Dashboard</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/"><SidebarMenuButton><Icons.clipboardList className="mr-2" />My Assignments</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/district-assignments"><SidebarMenuButton><Icons.building className="mr-2" />District View</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/branch-assignments"><SidebarMenuButton><Icons.building2 className="mr-2" />Branch View</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/offsite-reports"><SidebarMenuButton isActive><Icons.alertTriangle className="mr-2" />Off-site Reports</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/settings"><SidebarMenuButton><Icons.settings className="mr-2" />Settings</SidebarMenuButton></Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Off-site Reports</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Flagged Reports</CardTitle>
                    <CardDescription>
                      This list shows all updates reported from a location further than the configured on-site distance threshold. You can change the threshold on the <Link href="/settings" className="text-primary underline">Settings page</Link>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Officer</TableHead>
                        <TableHead>Reported Date</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Update Text</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {offsiteReports.map(({ lead, update, distance }, index) => (
                        <TableRow key={`${lead.id}-${index}`}>
                            <TableCell className="font-medium">{lead.title}</TableCell>
                            <TableCell>{getOfficerName(lead.officerId)}</TableCell>
                            <TableCell>{format(new Date(update.timestamp), "PPp")}</TableCell>
                            <TableCell>
                                <Badge variant="destructive">{distance.toFixed(2)} km away</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{update.text}</TableCell>
                            <TableCell>
                                <Link href={`/assignments/${lead.id}`}>
                                    <Button variant="outline" size="sm">View Lead</Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                 {offsiteReports.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No off-site reports found based on the current threshold.
                    </div>
                )}
                </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
