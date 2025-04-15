import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Film, Activity, Server } from "lucide-react";

const BlenderAnimatorTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blender Animator</CardTitle>
        <CardDescription>
          How the system uses Blender to create animations from your assets
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Film className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Scene Setup</h4>
                  <p className="text-sm text-muted-foreground">
                    Generated assets are imported into Blender and arranged according to the script.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Camera Animation</h4>
                  <p className="text-sm text-muted-foreground">
                    Camera movements are programmatically created based on scene descriptions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Automated Rendering</h4>
                  <p className="text-sm text-muted-foreground">
                    Blender renders each scene with appropriate lighting and effects.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Film className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Video Compilation</h4>
                  <p className="text-sm text-muted-foreground">
                    Individual scenes are compiled into a final video with smooth transitions.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-medium mb-4">Blender Pipeline</h3>
            <div className="relative">
              <div className="aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                <Film className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Import</span>
                  <span>Setup</span>
                  <span>Animate</span>
                  <span>Render</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>Current Blender version: <span className="font-mono">3.6.0</span></p>
              <p className="mt-1">Rendering engine: <span className="font-mono">Cycles</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlenderAnimatorTab;
