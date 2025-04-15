import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ImageUploader from '@/components/ImageUploader';
import VideoGenerator from '@/components/VideoGenerator';

interface CreateVideoTabProps {
  onJobCreated: (jobId: string) => void;
}

const CreateVideoTab = ({ onJobCreated }: CreateVideoTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Reference Image</CardTitle>
          <CardDescription>
            Upload an image to use as a reference for your video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Generate Video</CardTitle>
          <CardDescription>
            Enter a prompt to generate a video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoGenerator onJobCreated={onJobCreated} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateVideoTab;
