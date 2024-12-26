import React, { useState } from 'react';
import Navbar from './Navbar';
import SubSidebar from './SubSidebar';
import ContentArea from './ContentArea';

type MainContentProps = {
  isVisible: boolean;
  isSubSidebarVisible: boolean;
  toggleSidebar: () => void;
  toggleSubSidebar: () => void;
  selectedProject: string;
  selectedPhotoSet: string;
};

const MainContent: React.FC<MainContentProps> = ({
  isVisible,
  selectedProject,
  selectedPhotoSet,
  isSubSidebarVisible,
  toggleSidebar,
  toggleSubSidebar,
}) => {
  const [currentStage, setCurrentStage] = useState('stage1');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadedImageFiles, setUploadedImageFiles] = useState<any[]>([]);
  const [navbarImageUrl, setNavbarImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const models = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setUploadedFiles((prev) => [...prev, ...models]);
    }
  };

  const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const Images = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setUploadedFiles((prev) => [...prev, ...Images]);
    }
  };

  const onModelAdd = (model: any) => {
    setUploadedFiles(prev => [...prev, model]);
  };

  const handleImageGenerated = (image: any) => {
    setUploadedFiles(prev => [...prev, image]);
  };

  const handleModelDelete = (urlToDelete: string) => {
    setUploadedFiles(prevFiles =>
      prevFiles.filter(file => file.url !== urlToDelete)
    );
    URL.revokeObjectURL(urlToDelete);
  };

  return (
    <div className="flex-1 h-full">
      <Navbar
        toggleSidebar={toggleSidebar}
        selectedProject={selectedProject}
        selectedPhotoSet={selectedPhotoSet}
        currentStage={currentStage}
        setCurrentStage={setCurrentStage}
        generatedImageUrl={generatedImageUrl}
      />
      <div className="flex h-[92%]">
        <SubSidebar
          isVisible={isSubSidebarVisible}
          toggleSubSidebar={toggleSubSidebar}
          currentStage={currentStage}
          handleFileUpload={handleFileUpload}
          uploadedFiles={uploadedFiles}
          handleImageFileUpload={handleImageFileUpload}
          uploadedImageFiles={uploadedImageFiles}
          setUploadedImageFiles={setUploadedImageFiles}
          setSelectedImage={setSelectedImage}
          onModelAdd={onModelAdd}
          onModelDelete={handleModelDelete}
        />
        <ContentArea
          currentStage={currentStage}
          setCurrentStage={setCurrentStage}
          uploadedFiles={uploadedFiles}
          isVisible={isSubSidebarVisible}
          onImageGenerated={handleImageGenerated}
          generatedImageUrl={generatedImageUrl}
          setGeneratedImageUrl={setGeneratedImageUrl}
          selectedImage={selectedImage}
        />
      </div>
    </div>
  );
};

export default MainContent;