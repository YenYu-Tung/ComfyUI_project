import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Group, Box3, Vector3, MeshBasicMaterial } from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Center, OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import UpgradeRoundedIcon from '@mui/icons-material/UpgradeRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

import styleImage from "../assets/style.jpg";

type SubSidebarProps = {
  isVisible: boolean;
  toggleSubSidebar: () => void;
  currentStage: string;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFiles: any[];
  onModelAdd: (url: string) => void;
  onModelDelete: (url: string) => void;
};

type UploadedFile = {
  file: File;
  url: string; // URL for the 3D model
};

const CarouselRows = ({ rows }: { rows: number }) => {
  // 處理滑動的功能
  const handleScrollRight = (carouselRef: React.RefObject<HTMLDivElement>) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: "smooth" }); // 滑動距離調整
    }
  };

  return (
    <div className="carousel-container space-y-2 py-4 px-1">
      {Array.from({ length: rows }).map((_, rowIndex) => {
        const carouselRef = useRef<HTMLDivElement>(null);

        return (
          <div key={rowIndex} className="carousel-row space-y-1">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-base Chillax-Medium">Style {rowIndex + 1}</h2>
              <button className="text-black50 text-base">View all</button>
            </div>
            <div className="relative">
              <div
                ref={carouselRef}
                className="carousel flex gap-2 overflow-x-auto scrollbar-hide px-4"
              >
                {Array.from({ length: 10 }).map((_, imageIndex) => (
                  <img
                    key={imageIndex}
                    src={styleImage}
                    alt={`Image Row ${rowIndex + 1} Image ${imageIndex + 1}`}
                    className="w-28 h-28 rounded-xl object-cover"
                  />
                ))}
              </div>
              {/* 右側模糊遮罩與按鈕 */}
              <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-r from-transparent from-0% via-white/75 via-70% to-white to-100% flex items-center justify-end">
                <button
                  className="text-[#8d8d8f]"
                  onClick={() => handleScrollRight(carouselRef)}
                >
                  <ChevronRightRoundedIcon fontSize="large" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface ModelProps {
  url: string;
}

const Model: React.FC<ModelProps> = ({ url }) => {
  const [model, setModel] = useState<Group | null>(null);
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        // Apply MeshBasicMaterial to all meshes
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.material = new MeshBasicMaterial({
              map: child.material.map,
              transparent: true,
              opacity: 1,
            });
          }
        });

        // Calculate weighted center based on mesh volumes
        let totalVolume = 0;
        const weightedCenter = new Vector3();

        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            // Get mesh bounding box
            const meshBox = new Box3().setFromObject(child);
            const meshCenter = meshBox.getCenter(new Vector3());
            const meshSize = meshBox.getSize(new Vector3());

            // Calculate approximate volume of the mesh
            const volume = meshSize.x * meshSize.y * meshSize.z;
            totalVolume += volume;

            // Add weighted contribution to center
            weightedCenter.add(
              meshCenter.multiplyScalar(volume)
            );
          }
        });

        // Get final weighted center
        if (totalVolume > 0) {
          weightedCenter.divideScalar(totalVolume);
        }

        // Calculate overall bounding box for camera positioning
        const box = new Box3().setFromObject(gltf.scene);
        const size = box.getSize(new Vector3());

        // Create container group
        const modelGroup = new Group();
        modelGroup.add(gltf.scene);

        // Center model using weighted center
        gltf.scene.position.sub(weightedCenter);

        // 修改相機位置和角度
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5;

        // 設置相機位置在模型前方略微上方
        camera.position.set(0, distance * 0.5, distance);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        setModel(modelGroup);
      },
      undefined,
      (error) => console.error("Failed to load model:", error)
    );
  }, [url, camera]);

  return model ? (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  ) : null;
};

const SubSidebar: React.FC<SubSidebarProps> = ({ isVisible, toggleSubSidebar, currentStage, handleFileUpload, uploadedFiles, onModelAdd, onModelDelete }) => {

  const handleDragStart = (event: React.DragEvent, url: string) => {
    event.dataTransfer.setData("modelUrl", url);
  };

  const handleDoubleClick = (url: string) => {
    onModelAdd(url);
  };

  const [inputText, setInputText] = useState<string>('');

  return (
    <div
      className={`
        relative flex-none transition-all duration-300 ease-in-out
        ${isVisible ? 'w-[370px]' : 'w-0'}
        border-l-2 border-tint z-50
      `}
    >
      {/* 右邊框 - 向外延伸 */}
      <div className={`absolute top-0 bottom-0 w-[2px] border-r-2 border-tint ${isVisible ? 'right-[-2px]' : 'right-[2px]'}`} />

      <div
        className={`
          absolute top-0 left-0 w-[370px] h-full
          transition-transform duration-300 ease-in-out
          ${isVisible ? '' : '-translate-x-[370px]'}
        `}
      >
        <div className="w-full h-full overflow-auto">
          {currentStage === 'stage1' && (
            <>
              <div className="py-4 px-4">
                <span className="text-lg text-black Chillax-Semibold">Asset Library</span>
              </div>

              <div className="px-4 flex flex-col gap-3">
                <div className="h-[114px] p-2.5 border border-[#E6E5FF] bg-[#F4F5F7] text-black25 rounded-[10px]">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder=" Describe your dream object"
                    className="w-full bg-secondary border-none outline-none text-8D8D8F resize-none Chillax-Medium placeholder:text-[#C7C7C7]"
                    rows={4}
                  />
                </div>

                <button className="w-full h-11 rounded-[10px] flex justify-center items-center gap-2 bg-tint text-primary Chillax-Medium">
                  <AutoAwesomeRoundedIcon sx={{ fontSize: '16px' }} />
                  AI 3D Generate
                </button>

                <label className="w-full h-11 rounded-[10px] flex justify-center items-center gap-1 bg-primary text-secondary Chillax-Medium cursor-pointer">
                  <UpgradeRoundedIcon sx={{ fontSize: '24px' }} />
                  Upload Your Object
                  <input
                    id="upload-button"
                    type="file"
                    multiple
                    accept=".gltf,.glb"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 grid grid-cols-3 gap-3">
                {uploadedFiles.map((uploaded, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-square border border-tint rounded-[14px] mb-4 group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, uploaded.url)}
                    onDoubleClick={() => handleDoubleClick(uploaded.url)}
                  >
                    {/* Canvas */}
                    <Canvas
                      className="rounded-lg"
                      camera={{ position: [0, 2, 5], fov: 45 }}
                      gl={{ preserveDrawingBuffer: true }}
                    >
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 10]} intensity={1} />
                      <Suspense fallback={null}>
                        <Model url={uploaded.url} />
                      </Suspense>
                      <OrbitControls
                        enableZoom={false}
                        enableRotate={false}
                        enablePan={false}
                      />
                    </Canvas>

                    {/* 刪除按鈕 */}
                    <button
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#E6E5FF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Deleting model:', uploaded.url);
                        onModelDelete(uploaded.url);
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 1L13 13M1 13L13 1"
                          stroke="#8885FF"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {(currentStage === 'stage2' || currentStage === 'stage3') && (
            <>
              <div className="py-4 px-4">
                <span className="text-lg text-black Chillax-Semibold">Reference Image</span>
              </div>

              <div className="px-4 flex flex-col gap-3 text-base">
                <div className='w-full h-11 rounded-[14px] flex justify-between items-center bg-secondary border border-tint px-1'>
                  <button
                    className="w-1/2 h-8 rounded-[9px] flex justify-center items-center gap-2 bg-primary text-tint Chillax-Medium"
                  >
                    Recommend
                  </button>
                  <button
                    className="w-1/2 h-8 rounded-[9px] flex justify-center items-center gap-2 text-black50 Chillax-Medium"
                  >
                    Uploaded
                  </button>
                </div>
                <button
                  className="w-full h-10 rounded-[14px] flex justify-start items-center gap-1 bg-secondary text-black50 Chillax-Medium border border-tint px-3"
                >
                  <SearchRoundedIcon />
                  Search
                </button>
              </div>

              <CarouselRows rows={5} />
            </>
          )}
        </div>
      </div>

      <button
        onClick={toggleSubSidebar}
        className={`
          absolute top-1/2 transform -translate-y-1/2
          right-[-16px] w-[16px] h-16 
          bg-white border-2 border-l-0 border-tint 
          rounded-tr-2xl rounded-br-2xl 
          flex items-center justify-center
          transition-transform duration-300 ease-in-out
          ${isVisible ? '' : 'translate-x-[0px]'}
        `}
      >
        <div className="w-[3px] h-5 bg-tint rounded-full"></div>
      </button>
    </div>
  );
};

export default SubSidebar;