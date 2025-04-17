"use client";

import { useState, useEffect } from 'react';
import { Loader2, Clock, Film, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Script as ScriptType } from '@/types';

interface ScriptViewerProps {
  jobId: string;
  script?: ScriptType;
}

const ScriptViewer = ({ jobId, script: propScript }: ScriptViewerProps) => {
  const [script, setScript] = useState<ScriptType | null>(propScript || null);
  const [loading, setLoading] = useState<boolean>(!propScript);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If script is provided as a prop, use it
    if (propScript) {
      setScript(propScript);
      setLoading(false);
      return;
    }

    const fetchScript = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/script/${jobId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setScript(data.script);
        } else {
          setError(data.message || 'Failed to load script');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching script');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [jobId, propScript]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-muted-foreground">Loading script...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Film className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-medium">Script Not Available</h3>
          <p className="text-sm max-w-md text-muted-foreground">
            The script will appear here once it has been generated. This typically happens during the first phase of video creation.
          </p>
        </div>
      </div>
    );
  }

  const totalDuration = script.scenes.reduce((total, scene) => total + scene.duration, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-primary mb-2">
          {script.title}
        </h3>
        
        <div className="mb-4 p-3 bg-muted/30 rounded-md border">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Original Prompt:</h4>
          <p className="text-foreground italic border-l-4 border-primary/20 pl-3 py-1">
            "{script.prompt}"
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">Scenes</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalDuration}s
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Film className="h-3 w-3" />
            {script.scenes.length} scenes
          </Badge>
        </div>
      </div>
      
      <div className="space-y-4">
        {script.scenes.map((scene, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h5 className="font-medium text-foreground flex items-center">
                Scene {index + 1}
                {scene.camera && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {scene.camera}
                  </Badge>
                )}
              </h5>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                {scene.duration}s
              </Badge>
            </div>
            
            <p className="text-foreground mb-3">
              {scene.description}
            </p>
            
            {scene.effects && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                <span>Effects: {scene.effects}</span>
              </div>
            )}
                    </Card>
        ))}
      </div>
    </div>
  );
};

export default ScriptViewer;