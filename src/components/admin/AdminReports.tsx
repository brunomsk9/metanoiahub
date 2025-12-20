import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralReport } from "./reports/VisaoGeralReport";
import { CursosTrillhasReport } from "./reports/CursosTrillhasReport";
import { DiscipuladoReport } from "./reports/DiscipuladoReport";
import { PerformanceDiscipuladoresReport } from "./reports/PerformanceDiscipuladoresReport";
import { LayoutDashboard, GraduationCap, Heart, Users } from "lucide-react";

export function AdminReports() {
  const [activeTab, setActiveTab] = useState("visao-geral");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
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
      </Tabs>
    </div>
  );
}
