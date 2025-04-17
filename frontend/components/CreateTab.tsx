import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { createJob } from '@/services/api';
import { PLATFORMS } from '@/types';

interface CreateTabProps {
  onJobCreated: (jobId: string) => void;
}

const CreateTab: React.FC<CreateTabProps> = ({ onJobCreated }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('youtube');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt for your video');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Add platform to prompt if selected
      const fullPrompt = selectedPlatform 
        ? `Create a video for ${selectedPlatform}: ${prompt}` 
        : prompt;
        
      const response = await createJob(fullPrompt);
      
      if (response.status === 'success' && response.job_id) {
        onJobCreated(response.job_id);
      } else {
        setError(response.message || 'Failed to create job');
      }
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err instanceof Error ? err.message : 'Error creating job');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    "Create a tutorial on how to make a delicious chocolate cake",
    "Make an explainer video about quantum computing for beginners",
    "Create a product showcase for a new smartphone with amazing camera features",
    "Generate a travel video highlighting the top 5 destinations in Europe"
  ];

  const handleUseExample = (example: string) => {
    setPrompt(example);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Video</CardTitle>
          <CardDescription>
            Describe the video you want to generate. Be as specific as possible about the content, style, and purpose.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform.id}
                    type="button"
                    variant={selectedPlatform === platform.id ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => setSelectedPlatform(platform.id)}
                  >
                    <span className={`i-${platform.icon} h-4 w-4`}></span>
                    {platform.name}
                  </Button>
                ))}
              </div>
              
              <Textarea
                placeholder="Describe your video here... (e.g., 'Create a product showcase for a new eco-friendly water bottle')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none"
                disabled={loading}
              />
              
              <p className="text-xs text-muted-foreground">
                {prompt.length} characters
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full flex items-center gap-2"
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
            
            <div className="w-full">
              <p className="text-sm font-medium mb-2">Example prompts:</p>
              <div className="space-y-2">
                {examplePrompts.map((example, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left text-sm h-auto py-2"
                    onClick={() => handleUseExample(example)}
                    disabled={loading}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateTab;
