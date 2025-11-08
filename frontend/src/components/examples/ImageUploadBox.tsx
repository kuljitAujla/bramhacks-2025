import ImageUploadBox from "../ImageUploadBox";

export default function ImageUploadBoxExample() {
  return (
    <div className="p-6">
      <ImageUploadBox
        title="Before Image"
        onImageUpload={(file) => console.log("File uploaded:", file.name)}
        testId="upload-before"
      />
    </div>
  );
}
