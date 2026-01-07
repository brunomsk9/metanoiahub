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
import { WeeklyDiscipleshipReport } from "./reports/WeeklyDiscipleshipReport";
import { ServiceAttendance } from "./ServiceAttendance";
import { NewsletterManager } from "./NewsletterManager";
import { LayoutDashboard, GraduationCap, Heart, Users, CalendarCheck, FileSpreadsheet, UserCheck, Calendar, Mail, UserPlus, User } from "lucide-react";

export function AdminReports() {
  const [activeTab, setActiveTab] = useState("visao-geral");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
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
          <TabsTrigger value="encontros" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Encontros</span>
            <span className="sm:hidden">Enc.</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Discipuladores</span>
            <span className="sm:hidden">Disc.</span>
          </TabsTrigger>
          <TabsTrigger value="discipulos" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Discípulos</span>
            <span className="sm:hidden">Disc.</span>
          </TabsTrigger>
          <TabsTrigger value="presenca" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Presença</span>
            <span className="sm:hidden">Pres.</span>
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
          <TabsTrigger value="newsletter" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Newsletter</span>
            <span className="sm:hidden">News</span>
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

        <TabsContent value="encontros" className="mt-6">
          <WeeklyDiscipleshipReport />
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