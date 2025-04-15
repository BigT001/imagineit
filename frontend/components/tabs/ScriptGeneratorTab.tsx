import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Server } from "lucide-react";

const ScriptGeneratorTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Script Generator</CardTitle>
        <CardDescription>
          How the system generates video scripts from your prompts
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
                  <h4 className="font-medium">Text Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Your prompt is analyzed to understand the key themes and visual elements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Hugging Face API</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses advanced language models to generate a structured video script.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Scene Breakdown</h4>
                  <p className="text-sm text-muted-foreground">
                    Divides the narrative into distinct scenes with descriptions for visualization.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-medium mb-4">Example Script</h3>
            <pre className="text-sm overflow-auto p-4 bg-muted rounded-md max-h-[300px]">
              {`# Scene 1
Description: A serene mountain landscape at dawn
Duration: 3 seconds
Camera: Wide establishing shot

# Scene 2
Description: Close-up of morning dew on pine needles
Duration: 2 seconds
Camera: Macro shot with shallow depth of field

# Scene 3
Description: A deer emerges from the forest
Duration: 4 seconds
Camera: Medium tracking shot, following the deer's movement`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScriptGeneratorTab;
