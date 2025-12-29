import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralReport } from "./reports/VisaoGeralReport";
import { CursosTrillhasReport } from "./reports/CursosTrillhasReport";
import { DiscipuladoReport } from "./reports/DiscipuladoReport";
import { PerformanceDiscipuladoresReport } from "./reports/PerformanceDiscipuladoresReport";
import { VolunteerEngagementReport } from "./reports/VolunteerEngagementReport";
import { VolunteersExportReport } from "./reports/VolunteersExportReport";
import { MultiMinistryVolunteersReport } from "./reports/MultiMinistryVolunteersReport";
import { LayoutDashboard, GraduationCap, Heart, Users, CalendarCheck, FileSpreadsheet, UserCheck } from "lucide-react";

export function AdminReports() {
  const [activeTab, setActiveTab] = useState("visao-geral");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="visao-geral" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="cursos" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Cursos e Trilhas</span>
            <span className="sm:hidden">Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="discipulado" className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Discipulado</span>
            <span className="sm:hidden">Disc.</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf.</span>
          </TabsTrigger>
          <TabsTrigger value="voluntarios" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Voluntários</span>
            <span className="sm:hidden">Vol.</span>
          </TabsTrigger>
          <TabsTrigger value="multi-ministerio" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Multi-Ministério</span>
            <span className="sm:hidden">Multi</span>
          </TabsTrigger>
          <TabsTrigger value="exportar" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exp.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          <VisaoGeralReport />
        </TabsContent>

        <TabsContent value="cursos" className="mt-6">
          <CursosTrillhasReport />
        </TabsContent>

        <TabsContent value="discipulado" className="mt-6">
          <DiscipuladoReport />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceDiscipuladoresReport />
        </TabsContent>

        <TabsContent value="voluntarios" className="mt-6">
          <VolunteerEngagementReport />
        </TabsContent>

        <TabsContent value="multi-ministerio" className="mt-6">
          <MultiMinistryVolunteersReport />
        </TabsContent>

        <TabsContent value="exportar" className="mt-6">
          <VolunteersExportReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
