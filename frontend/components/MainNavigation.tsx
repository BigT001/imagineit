import { FileText, Activity, Image, Film } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const MainNavigation = () => {
  return (
    <TabsList className="grid w-full grid-cols-5 mb-8">
      <TabsTrigger value="create" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">Create Video</span>
      </TabsTrigger>
      <TabsTrigger value="process" className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Job Status</span>
      </TabsTrigger>
      <TabsTrigger value="script" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">Script Generator</span>
      </TabsTrigger>
      <TabsTrigger value="assets" className="flex items-center gap-2">
        <Image className="h-4 w-4" />
        <span className="hidden sm:inline">Asset Generator</span>
      </TabsTrigger>
      <TabsTrigger value="animator" className="flex items-center gap-2">
        <Film className="h-4 w-4" />
        <span className="hidden sm:inline">Blender Animator</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default MainNavigation;
