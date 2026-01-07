import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TabGroup {
  label: string;
  tabs: TabItem[];
}

interface TabItem {
  value: string;
  label: string;
  icon: React.ElementType;
}

const tabGroups: TabGroup[] = [
  {
    label: "Geral",
    tabs: [
      { value: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
    ]
  },
  {
    label: "Discipulado",
    tabs: [
      { value: "discipulado", label: "Rede de Discipulado", icon: Heart },
      { value: "performance", label: "Discipuladores", icon: Users },
      { value: "discipulos", label: "Discípulos", icon: User },
      { value: "encontros", label: "Encontros", icon: MessageCircle },
    ]
  },
  {
    label: "Ministérios",
    tabs: [
      { value: "voluntarios", label: "Engajamento", icon: CalendarCheck },
      { value: "multi-ministerio", label: "Multi-Ministério", icon: UserCheck },
      { value: "presenca", label: "Presença em Cultos", icon: Calendar },
    ]
  },
  {
    label: "Conteúdo",
    tabs: [
      { value: "cursos", label: "Cursos e Trilhas", icon: GraduationCap },
    ]
  },
  {
    label: "Comunicação",
    tabs: [
      { value: "newsletter", label: "Newsletter", icon: Mail },
      { value: "exportar", label: "Exportar Dados", icon: FileSpreadsheet },
    ]
  }
];

// Flatten tabs for quick lookup
const allTabs = tabGroups.flatMap(g => g.tabs);

function getTabInfo(value: string) {
  return allTabs.find(t => t.value === value);
}

export function AdminReports() {
  const [activeTab, setActiveTab] = useState("visao-geral");
  
  const activeTabInfo = getTabInfo(activeTab);

  const renderTabIcon = (IconComponent: React.ElementType) => {
    return <IconComponent className="h-4 w-4" />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "visao-geral":
        return <VisaoGeralReport />;
      case "cursos":
        return <CursosTrillhasReport />;
      case "discipulado":
        return <DiscipuladoReport />;
      case "encontros":
        return <MeetingsReport />;
      case "performance":
        return <PerformanceDiscipuladoresReport />;
      case "discipulos":
        return <DiscipulosReport />;
      case "presenca":
        return <ServiceAttendance />;
      case "voluntarios":
        return <VolunteerEngagementReport />;
      case "multi-ministerio":
        return <MultiMinistryVolunteersReport />;
      case "newsletter":
        return <NewsletterManager />;
      case "exportar":
        return <VolunteersExportReport />;
      default:
        return <VisaoGeralReport />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
          {tabGroups.map((group, groupIndex) => (
            <div key={group.label} className="flex items-center">
              {groupIndex > 0 && (
                <div className="w-px h-6 bg-border/50 mx-1" />
              )}
              {group.tabs.length === 1 ? (
                <Button
                  variant={activeTab === group.tabs[0].value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(group.tabs[0].value)}
                  className={cn(
                    "gap-2 h-9",
                    activeTab === group.tabs[0].value && "shadow-sm"
                  )}
                >
                  {renderTabIcon(group.tabs[0].icon)}
                  <span>{group.tabs[0].label}</span>
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={group.tabs.some(t => t.value === activeTab) ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2 h-9",
                        group.tabs.some(t => t.value === activeTab) && "shadow-sm"
                      )}
                    >
                      {group.tabs.some(t => t.value === activeTab) && activeTabInfo ? (
                        <>
                          {renderTabIcon(activeTabInfo.icon)}
                          <span>{activeTabInfo.label}</span>
                        </>
                      ) : (
                        <>
                          {renderTabIcon(group.tabs[0].icon)}
                          <span>{group.label}</span>
                        </>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px] bg-popover z-50">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {group.tabs.map((tab) => (
                      <DropdownMenuItem 
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                          "gap-2 cursor-pointer",
                          activeTab === tab.value && "bg-primary/10 text-primary"
                        )}
                      >
                        {renderTabIcon(tab.icon)}
                        <span>{tab.label}</span>
                        {activeTab === tab.value && (
                          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                            Ativo
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2">
              <div className="flex items-center gap-2">
                {activeTabInfo && renderTabIcon(activeTabInfo.icon)}
                <span>{activeTabInfo?.label || "Selecionar relatório"}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm bg-popover z-50">
            {tabGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  {group.label}
                </DropdownMenuLabel>
                {group.tabs.map((tab) => (
                  <DropdownMenuItem 
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "gap-2 cursor-pointer",
                      activeTab === tab.value && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {renderTabIcon(tab.icon)}
                    <span>{tab.label}</span>
                    {activeTab === tab.value && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-6"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
