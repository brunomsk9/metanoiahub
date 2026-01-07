import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralReport } from "./reports/VisaoGeralReport";
import { CursosTrillhasReport } from "./reports/CursosTrillhasReport";
import { DiscipuladoReport } from "./reports/DiscipuladoReport";
import { PerformanceDiscipuladoresReport } from "./reports/PerformanceDiscipuladoresReport";
import { DiscipulosReport } from "./reports/DiscipulosReport";
import { VolunteerEngagementReport } from "./reports/VolunteerEngagementReport";
import { VolunteersExportReport } from "./reports/VolunteersExportReport";
import { MultiMinistryVolunteersReport } from "./reports/MultiMinistryVolunteersReport";
import { MeetingsReport } from "./reports/MeetingsReport";
import { ServiceAttendance } from "./ServiceAttendance";
import { NewsletterManager } from "./NewsletterManager";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Heart, 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  UserCheck, 
  Calendar, 
  Mail, 
  User,
  MessageCircle
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function AdminReports() {
  const [activeTab, setActiveTab] = useState("visao-geral");

  const tabs = [
    { value: "visao-geral", label: "Visão Geral", shortLabel: "Geral", icon: LayoutDashboard },
    { value: "cursos", label: "Cursos e Trilhas", shortLabel: "Cursos", icon: GraduationCap },
    { value: "discipulado", label: "Discipulado", shortLabel: "Disc.", icon: Heart },
    { value: "encontros", label: "Encontros", shortLabel: "Enc.", icon: MessageCircle },
    { value: "performance", label: "Discipuladores", shortLabel: "Disc.", icon: Users },
    { value: "discipulos", label: "Discípulos", shortLabel: "Disc.", icon: User },
    { value: "presenca", label: "Presença", shortLabel: "Pres.", icon: Calendar },
    { value: "voluntarios", label: "Voluntários", shortLabel: "Vol.", icon: CalendarCheck },
    { value: "multi-ministerio", label: "Multi-Ministério", shortLabel: "Multi", icon: UserCheck },
    { value: "newsletter", label: "Newsletter", shortLabel: "News", icon: Mail },
    { value: "exportar", label: "Exportar", shortLabel: "Exp.", icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto gap-1 p-1 w-max min-w-full">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        <TabsContent value="visao-geral" className="mt-6">
          <VisaoGeralReport />
        </TabsContent>

        <TabsContent value="cursos" className="mt-6">
          <CursosTrillhasReport />
        </TabsContent>

        <TabsContent value="discipulado" className="mt-6">
          <DiscipuladoReport />
        </TabsContent>

        <TabsContent value="encontros" className="mt-6">
          <MeetingsReport />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceDiscipuladoresReport />
        </TabsContent>

        <TabsContent value="discipulos" className="mt-6">
          <DiscipulosReport />
        </TabsContent>

        <TabsContent value="presenca" className="mt-6">
          <ServiceAttendance />
        </TabsContent>

        <TabsContent value="voluntarios" className="mt-6">
          <VolunteerEngagementReport />
        </TabsContent>

        <TabsContent value="multi-ministerio" className="mt-6">
          <MultiMinistryVolunteersReport />
        </TabsContent>

        <TabsContent value="newsletter" className="mt-6">
          <NewsletterManager />
        </TabsContent>

        <TabsContent value="exportar" className="mt-6">
          <VolunteersExportReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}