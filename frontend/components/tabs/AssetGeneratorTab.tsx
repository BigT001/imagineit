import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Image, Activity } from "lucide-react";

const AssetGeneratorTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Generator</CardTitle>
        <CardDescription>
          How the system creates visual assets for your video
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Scene Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Each scene from the script is analyzed to determine visual requirements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Stability AI</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses advanced image generation models to create high-quality visuals for each scene.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Style Consistency</h4>
                  <p className="text-sm text-muted-foreground">
                    Maintains visual consistency across all generated assets to ensure a cohesive video.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <div className="p-2 text-center text-sm text-muted-foreground">
                Scene 1 Example
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <div className="p-2 text-center text-sm text-muted-foreground">
                Scene 2 Example
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <div className="p-2 text-center text-sm text-muted-foreground">
                Scene 3 Example
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <div className="p-2 text-center text-sm text-muted-foreground">
                Scene 4 Example
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetGeneratorTab;
