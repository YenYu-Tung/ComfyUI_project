import { useState, useEffect } from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';

const buttonLabels: { [key: number]: string } = {
  1: 'Your Product',
  4: 'Composition',
  8: 'Background',
  12: 'Lighting'
};

const buttonIcons: { [key: number]: JSX.Element } = {
  1: <BrokenImageOutlinedIcon fontSize="small" />,
  4: <CameraAltOutlinedIcon fontSize="small" />,
  8: <WallpaperOutlinedIcon fontSize="small" />,
  12: <LightbulbOutlinedIcon fontSize="small" />
};

interface SelectedFiles {
  [key: number]: File;
}

export default function Dashboard() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({});
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null); 
  const [progress, setProgress] = useState<number>(0); 
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isGenerating && progress < 100) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 1 : 100)); 
      }, 1800);

      return () => clearInterval(interval); 
    }
  }, [isGenerating, progress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, nodeId: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFiles(prev => ({ ...prev, [nodeId]: file }));
      setPreviewUrls(prev => ({ ...prev, [nodeId]: URL.createObjectURL(file) })); 
    }
  };

  const handleSubmit = async () => {
    setProgress(0);
    setIsGenerating(true);

    const formData = new FormData();
    Object.keys(selectedFiles).forEach((nodeId) => {
      formData.append(`image_${nodeId}`, selectedFiles[parseInt(nodeId)]);
    });

    try {
      const response = await fetch('http://localhost:5000/process-images', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setImageUrl(`http://localhost:5000/processed_images/${result.image_url}`);
      } else {
        console.error("Failed to process the images");
      }
    } catch (error) {
      console.error("Error submitting form", error);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="w-full h-full flex justify-center items-center flex-col">
      <div className='w-3/4'>
        <div className='flex justify-center items-center flex-col w-full'>
          <h1 className="text-7xl font-bold mb-4 text-primary inline-block Chillax-Bold">Dadan!</h1>
          <h3 className='inline-block font-semibold'>Status: {isGenerating ? `Processing (${progress}%)` : 'Idle'}</h3>
        </div>

        <div className='flex justify-between mt-4 pb-10'>
          <form onSubmit={handleSubmit} className="space-y-3">
            <h2 className="text-xl font-bold">Reference Image</h2>
            <div className='flex gap-3'>
              {[1, 4, 8, 12].map((nodeId) => (
                <div className='flex flex-col justify-center items-center gap-4' key={nodeId}>
                  <div className='w-44 m-auto'>
                    <div className="w-full aspect-[1/1] rounded-lg flex justify-center items-center bg-secondary">
                      <div className='flex flex-col justify-center items-center h-full relative'>
                        {previewUrls[nodeId] ? (
                          <img src={previewUrls[nodeId]} alt={`${nodeId}`} style={{ maxHeight: '100%' }} className='rounded-md' />
                        ) : (
                          <div className="w-44 h-44 bg-secondary rounded-md flex items-center justify-center"></div>
                        )}
                        {/* Image Upload */}
                        <label
                          htmlFor={`picture-input-${nodeId}`}
                          className='w-32 text-sm px-1 py-2 rounded-lg text-center text-black absolute bg-white drop-shadow-md'
                          style={{
                            opacity: previewUrls[nodeId] ? 0 : 1,
                          }}>
                          Upload Image
                          <input
                            type="file"
                            id={`picture-input-${nodeId}`}
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, nodeId)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                    </div>
                  </div>

                  <div className="w-44 px-6 py-2 text-black rounded-xl text-center border-[1.5px] border-black flex items-center justify-center gap-2">
                    {/* {buttonIcons[nodeId]}  */}
                    {buttonLabels[nodeId]}
                  </div>

                </div>
              ))}
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">Result</h2>
            <div className='flex flex-col justify-center items-center gap-4'>
              {imageUrl ? 
                <div className='w-44 h-44 bg-secondary rounded-md'>
                  <img src={imageUrl} alt="Result" style={{ maxHeight: '100%' }} className='rounded-md' />
                </div>
               : <div className='w-44 h-44 bg-secondary rounded-md'></div>}

              <button onClick={handleSubmit} className="w-44 px-6 py-2 bg-primary text-white rounded-xl flex gap-2 justify-center items-center">
                {/* <AutoAwesomeOutlinedIcon fontSize="small" /> */}
                Generate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
