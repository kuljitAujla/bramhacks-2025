import { Upload, X } from "lucide-react";
import { useState } from "react";

interface ImageUploadBoxProps {
  title: string;
  onImageUpload?: (file: File) => void;
  testId?: string;
}

export default function ImageUploadBox({ title, onImageUpload, testId }: ImageUploadBoxProps) {
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [isDrag, setIsDrag] = useState(false);

  // handle drag
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(true);
  };

  const handleDragLeave = () => {
    setIsDrag(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }

  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      setImgPreview(e.target?.result as string);
    };

    reader.readAsDataURL(file);
    onImageUpload?.(file);
  };

  const handleRemove = () => {
    setImgPreview(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 h-96
          flex flex-col items-center justify-center
          transition-colors
          ${isDrag ? "border-primary bg-accent" : "border-border bg-card"}
          ${imgPreview ? "" : "hover-elevate cursor-pointer"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid={testId}
      >
        {imgPreview ? (
          <>
            <img src={imgPreview} alt={title} className="w-full h-full object-contain rounded-lg"/>
            <button onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-md hover-elevate active-elevate-2"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-2">
              Drag and drop your satellite image here
            </p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <label className="px-6 py-3 bg-primary text-primary-foreground rounded-md cursor-pointer hover-elevate active-elevate-2 font-medium">
              Browse Files
              <input type="file" className="hidden" accept="image/*" onChange={handleFileInput} />
            </label>
          </>
        )}

      </div>
    </div>
  );
}
