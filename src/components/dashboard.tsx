"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarTrigger className="md:hidden"/>
          <CardTitle>LeadTrack Pro</CardTitle>
          <CardDescription>Manage your sales leads effectively</CardDescription>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.home className="mr-2 h-4 w-4"/>
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.workflow className="mr-2 h-4 w-4"/>
                  <span>Task Assignment</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.mapPin className="mr-2 h-4 w-4"/>
                  <span>Location Setting</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.messageSquare className="mr-2 h-4 w-4"/>
                  <span>Task Reporting</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.shield className="mr-2 h-4 w-4"/>
                  <span>Location Verification</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.file className="mr-2 h-4 w-4"/>
                  <span>Case Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" className="w-full">
            <Icons.settings className="mr-2 h-4 w-4"/>
            Settings
          </Button>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to LeadTrack Pro</CardTitle>
            <CardDescription>
              Manage your sales leads and track progress effectively.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Use the sidebar to navigate through the different sections of the
              application.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
