import React, { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import { Group, Box3, Vector3, MeshBasicMaterial } from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Center, OrbitControls, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import * as THREE from 'three';

import style1Image1 from "../assets/style1/image1.png";
import style1Image2 from "../assets/style1/image2.jpg";
import style1Image3 from "../assets/style1/image3.png";
import style1Image4 from "../assets/style1/image4.png";

import style2Image1 from "../assets/style2/image1.png";
import style2Image2 from "../assets/style2/image2.jpg";
import style2Image3 from "../assets/style2/image3.jpg";
import style2Image4 from "../assets/style2/image4.webp";

// import stage2Style1Image1 from "../assets/stage2style1/image1.png";
// import stage2Style2Image1 from "../assets/stage2style2/image1.png";
// import stage2Style3Image1 from "../assets/stage2style3/image1.png";
// import stage2Style4Image1 from "../assets/stage2style4/image1.webp";
// import stage2Style5Image1 from "../assets/stage2style5/image1.jpg";

// import stage3Style1Image1 from "../assets/stage3style1/image1.png";
// import stage3Style1Image2 from "../assets/stage3style1/image2.png";

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
  url: string;
  thumbnail?: string;
};

// 新增：每個 Style 的資料結構
type CarouselRowData = {
  title: string;
  images: string[];
};

// 更新：CarouselRows 接收 carouselData，並依照每個 style 的資料進行渲染
function CarouselRows({
  carouselData,
}: {
  carouselData: CarouselRowData[];
}) {
  // Handle horizontal scroll
  const handleScrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollBy({ left: 120, behavior: "smooth" });
  };
  const handleScrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollBy({ left: -120, behavior: "smooth" });
  };

  return (
    <div className="carousel-container space-y-2 py-4 px-1">
      {carouselData.map((row, rowIndex) => (
        <CarouselRow
          key={rowIndex}
          handleScrollLeft={handleScrollLeft}
          handleScrollRight={handleScrollRight}
          title={row.title}
          images={row.images}
        />
      ))}
    </div>
  );
}

function CarouselRow({
  title,
  images,
  handleScrollLeft,
  handleScrollRight,
}: {
  title: string;
  images: string[];
  handleScrollLeft: (ref: React.RefObject<HTMLDivElement>) => void;
  handleScrollRight: (ref: React.RefObject<HTMLDivElement>) => void;
}) {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    const ref = carouselRef.current;
    if (!ref) return;

    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = ref;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    };

    ref.addEventListener("scroll", onScroll);
    onScroll();
    return () => ref.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="carousel-row space-y-1">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-base Chillax-Medium">{title}</h2>
        <button className="text-black50 text-base">View all</button>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <>
            <div className="absolute top-0 left-0 w-4 h-full bg-white" />
            <div className="absolute top-0 left-4 h-full w-12 bg-gradient-to-l from-transparent from-0% via-white/75 via-70% to-white to-100% flex items-center justify-start">
              <button
                className="text-[#8d8d8f]"
                onClick={() => handleScrollLeft(carouselRef)}
              >
                <ChevronLeftRoundedIcon fontSize="large" />
              </button>
            </div>
          </>
        )}

        <div
          ref={carouselRef}
          className="carousel flex gap-2 overflow-x-auto scrollbar-hide px-4"
        >
          {/* 如果有圖就顯示圖片 */}
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`img-${index}`}
              className="w-28 h-28 shrink-0 rounded-xl bg-[#F4F4F4]"
            />
          ))}

          {/* 若圖片不足十張，就用原本的方框遞補 */}
          {Array.from({ length: Math.max(0, 10 - images.length) }).map(
            (_, placeholderIndex) => (
              <div
                key={`placeholder-${placeholderIndex}`}
                className="w-28 h-28 shrink-0 rounded-xl bg-[#F4F4F4]"
              />
            )
          )}
        </div>

        {canScrollRight && (
          <>
            <div className="absolute top-0 right-0 w-4 h-full bg-white" />
            <div className="absolute top-0 right-4 h-full w-12 bg-gradient-to-r from-transparent from-0% via-white/75 via-70% to-white to-100% flex items-center justify-end">
              <button
                className="text-[#8d8d8f]"
                onClick={() => handleScrollRight(carouselRef)}
              >
                <ChevronRightRoundedIcon fontSize="large" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.material = new MeshBasicMaterial({
              map: child.material.map,
              transparent: true,
              opacity: 1,
            });
          }
        });

        let totalVolume = 0;
        const weightedCenter = new Vector3();

        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            const meshBox = new Box3().setFromObject(child);
            const meshCenter = meshBox.getCenter(new Vector3());
            const meshSize = meshBox.getSize(new Vector3());

            const volume = meshSize.x * meshSize.y * meshSize.z;
            totalVolume += volume;

            weightedCenter.add(
              meshCenter.multiplyScalar(volume)
            );
          }
        });

        if (totalVolume > 0) {
          weightedCenter.divideScalar(totalVolume);
        }

        const box = new Box3().setFromObject(gltf.scene);
        const size = box.getSize(new Vector3());

        const modelGroup = new Group();
        modelGroup.add(gltf.scene);
        gltf.scene.position.sub(weightedCenter);

        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5;

        camera.position.set(0, distance * 0.5, distance);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        setModel(modelGroup);
      },
      undefined,
      (error) => console.error("Failed to load model:", error)
    );

    return () => {
      if (model) {
        model.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }
    };
  }, [url, camera]);

  return model ? (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  ) : null;
};

const ModelScreenshot: React.FC<{ url: string; onScreenshotTaken: (thumbnail: string) => void }> = ({ url, onScreenshotTaken }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.material = new MeshBasicMaterial({
              map: child.material.map,
              transparent: true,
              opacity: 1,
            });
          }
        });

        // 設算模型的包圍盒
        const box = new Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());

        // 計算合適的相機距離
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;

        // 設置相機位置為等角視圖（isometric view）
        const cameraX = distance * Math.cos(Math.PI / 6) * Math.cos(Math.PI / 4);
        const cameraY = distance * Math.sin(Math.PI / 6);
        const cameraZ = distance * Math.cos(Math.PI / 6) * Math.sin(Math.PI / 4);

        // 將模型置於中心
        gltf.scene.position.sub(center);

        // 設置相機
        camera.position.set(cameraX, cameraY, cameraZ);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        // 添加燈光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(cameraX, cameraY, cameraZ);
        gltf.scene.add(ambientLight, directionalLight);

        // 渲染並截圖
        gl.render(gltf.scene, camera);
        const screenshot = gl.domElement.toDataURL('image/png');
        onScreenshotTaken(screenshot);

        // 清理燈光
        gltf.scene.remove(ambientLight, directionalLight);
      },
      undefined,
      (error) => console.error("Failed to load model:", error)
    );
  }, [url, camera, gl, onScreenshotTaken]);

  return null;
};

const GenerateIcon = () => (
  <svg
    width="16"
    height="18"
    viewBox="0 0 14 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.91357 5.81957C3.05736 5.81957 3.15574 5.72119 3.17087 5.58497C3.44331 3.56439 3.51142 3.56439 5.60011 3.1633C5.72876 3.1406 5.82714 3.04979 5.82714 2.906C5.82714 2.76978 5.72876 2.6714 5.60011 2.65627C3.51142 2.36113 3.43574 2.29302 3.17087 0.242167C3.15574 0.0983803 3.05736 0 2.91357 0C2.77735 0 2.67897 0.0983803 2.65627 0.249735C2.4141 2.27031 2.30058 2.26275 0.227031 2.65627C0.0983803 2.67897 0 2.76978 0 2.906C0 3.05736 0.0983803 3.1406 0.257302 3.1633C2.31572 3.49628 2.4141 3.54926 2.65627 5.56984C2.67897 5.72119 2.77735 5.81957 2.91357 5.81957Z"
      fill="currentColor"
    />
    <path
      d="M8.04368 14.1892C8.24044 14.1892 8.38423 14.0454 8.42207 13.8411C8.95937 9.70152 9.54209 9.06583 13.6438 8.61176C13.8557 8.58906 13.9995 8.43771 13.9995 8.23338C13.9995 8.03662 13.8557 7.88526 13.6438 7.86256C9.54209 7.4085 8.95937 6.77281 8.42207 2.6257C8.38423 2.42138 8.24044 2.28516 8.04368 2.28516C7.84692 2.28516 7.70313 2.42138 7.67286 2.6257C7.13556 6.77281 6.54527 7.4085 2.45114 7.86256C2.23168 7.88526 2.08789 8.03662 2.08789 8.23338C2.08789 8.43771 2.23168 8.58906 2.45114 8.61176C6.53771 9.14907 7.10528 9.70152 7.67286 13.8411C7.70313 14.0454 7.84692 14.1892 8.04368 14.1892Z"
      fill="currentColor"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 9.04297C1.41421 9.04297 1.75 9.37876 1.75 9.79297V11.1119C1.75 12.1546 2.59525 12.9999 3.63793 12.9999H11.1121C12.1548 12.9999 13 12.1546 13 11.1119V9.79297C13 9.37876 13.3358 9.04297 13.75 9.04297C14.1642 9.04297 14.5 9.37876 14.5 9.79297V11.1119C14.5 12.9831 12.9832 14.4999 11.1121 14.4999H3.63793C1.76684 14.4999 0.25 12.9831 0.25 11.1119V9.79297C0.25 9.37876 0.585786 9.04297 1 9.04297Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.375 10.1035C6.96079 10.1035 6.625 9.76773 6.625 9.35352L6.625 1.00007C6.625 0.585854 6.96079 0.250068 7.375 0.250068C7.78921 0.250068 8.125 0.585855 8.125 1.00007L8.125 9.35352C8.125 9.76773 7.78921 10.1035 7.375 10.1035Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.7428 4.62772C10.4392 4.90957 9.96468 4.89199 9.68282 4.58846L7.37466 2.10275L5.0665 4.58846C4.78464 4.89199 4.31009 4.90957 4.00656 4.62772C3.70303 4.34586 3.68545 3.87132 3.96731 3.56778L6.82507 0.490197C6.96697 0.337372 7.16611 0.250535 7.37466 0.250535C7.58321 0.250535 7.78235 0.337372 7.92425 0.490197L10.782 3.56778C11.0639 3.87132 11.0463 4.34586 10.7428 4.62772Z"
      fill="currentColor"
    />
  </svg>
);

// 新增：在檔案最上方增加一個 defaultLocalModels，預設讀取 models 資料夾內的模型
const defaultLocalModels = [
  { url: 'src/assets/model/model1.glb', file: null },
  { url: 'src/assets/model/model2.gltf', file: null },
  // 如有更多模型可在此加入
];

// 新增：Define separate carousel data for stage2 and stage3
const stage2CarouselData: CarouselRowData[] = [
  {
    title: 'Style 1',
    images: [
      // stage2Style1Image1,
      // stage2Style1Image2,
      // ... more stage2style1 images ...
    ],
  },
  // ... stage2 styles 2~5 ...
  {
    title: 'Style 2',
    images: [
      // stage2Style2Image1,
      // stage2Style1Image2,
      // ... more stage2style1 images ...
    ],
  },

  {
    title: 'Style 3',
    images: [
      // stage2Style3Image1,
      // stage2Style1Image2,
      // ... more stage2style1 images ...
    ],
  },

  {
    title: 'Style 4',
    images: [
      // stage2Style4Image1,
      // stage2Style1Image2,
      // ... more stage2style1 images ...
    ],
  },

  {
    title: 'Style 5',
    images: [
      // stage2Style5Image1,
      // stage2Style1Image2,
      // ... more stage2style1 images ...
    ],
  },
];

const stage3CarouselData: CarouselRowData[] = [
  {
    title: 'Style 1',
    images: [

    ],
  },
  {
    title: 'Style 2',
    images: [

    ],
  },
  {
    title: 'Style 3',
    images: [

    ],
  },
  {
    title: 'Style 4',
    images: [

    ],
  },
  {
    title: 'Style 5',
    images: [

    ],
  },
  // ... stage3 styles 2~5 ...
];

const SubSidebar: React.FC<SubSidebarProps> = ({ isVisible, toggleSubSidebar, currentStage, handleFileUpload, uploadedFiles, onModelAdd, onModelDelete }) => {
  const [screenshotUrls, setScreenshotUrls] = useState<{ [key: string]: string }>({});

  const handleScreenshotTaken = useCallback((url: string, thumbnail: string) => {
    setScreenshotUrls(prev => ({
      ...prev,
      [url]: thumbnail
    }));
  }, []);

  const handleDragStart = (event: React.DragEvent, url: string) => {
    event.dataTransfer.setData("modelUrl", url);
  };

  const handleDoubleClick = (url: string) => {
    onModelAdd(url);
  };

  const [inputText, setInputText] = useState<string>('');

  // 1) 改用 useState 儲存本地模型
  const [localModels, setLocalModels] = useState<{ url: string; file: File | null }[]>([
    { url: 'src/assets/model/model1.glb', file: null },
    { url: 'src/assets/model/model2.glb', file: null },
    // 如有更多模型可在此加入
  ]);

  // 將本地模型與已上傳模型合併
  const allModels = [...localModels, ...uploadedFiles];

  // 2) 自訂模型刪除邏輯
  const handleDeleteModel = (url: string) => {
    // 先判斷要刪除的模型是否在 localModels
    if (localModels.some((model) => model.url === url)) {
      setLocalModels(prev => prev.filter(model => model.url !== url));
    } else {
      // 否則刪除上傳的
      onModelDelete(url);
    }
    // 同步刪除在 screenshotUrls 中的預覽圖
    setScreenshotUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[url];
      return newUrls;
    });
  };

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
        <div className="w-full h-full overflow-auto scrollbar-hide">
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

                <button className="w-full h-11 rounded-[10px] flex justify-center items-center gap-3 bg-tint text-primary Chillax-Medium">
                  <GenerateIcon />
                  AI 3D Generate
                </button>

                <label className="w-full h-11 rounded-[10px] flex justify-center items-center gap-3 bg-primary text-secondary Chillax-Medium cursor-pointer">
                  <UploadIcon />
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
                {allModels.map((uploaded, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-square border border-tint rounded-[14px] mb-4 group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, uploaded.url)}
                    onDoubleClick={() => handleDoubleClick(uploaded.url)}
                  >
                    {screenshotUrls[uploaded.url] ? (
                      <img
                        src={screenshotUrls[uploaded.url]}
                        alt="Model preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Canvas
                        className="rounded-lg"
                        camera={{ position: [0, 2, 5], fov: 45 }}
                        gl={{ preserveDrawingBuffer: true }}
                      >
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 10]} intensity={1} />
                        <Suspense fallback={null}>
                          <ModelScreenshot
                            url={uploaded.url}
                            onScreenshotTaken={(thumbnail) => handleScreenshotTaken(uploaded.url, thumbnail)}
                          />
                        </Suspense>
                      </Canvas>
                    )}

                    {/* 刪除按鈕 - 呼叫 handleDeleteModel */}
                    <button
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#E6E5FF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModel(uploaded.url);
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

          {currentStage === 'stage2' && (
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

              <CarouselRows carouselData={stage2CarouselData} />
            </>
          )}
          {currentStage === 'stage3' && (
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

              <CarouselRows carouselData={stage3CarouselData} />
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