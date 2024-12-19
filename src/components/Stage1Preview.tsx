import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { CircularProgress } from '@mui/material';

// 新增截圖相關的interface
interface Stage1PreviewProps {
    modelUrl: string;
    screenshotUrl?: string; // 新增截圖URL屬性
}

const ModelComponent = React.memo(({ url, onLoad }: { url: string; onLoad?: () => void }) => {
    const { scene } = useGLTF(url);

    useEffect(() => {
        onLoad?.();

        scene.traverse((node: any) => {
            if (node.isMesh) {
                // 優化網格，但避免不必要的克隆
                if (!node.geometry.attributes.normal) {
                    node.geometry.computeVertexNormals();
                }
                node.frustumCulled = true;
                node.castShadow = false;
                node.receiveShadow = false;
            }
        });

        return () => {
            // 清理資源
            scene.traverse((node: any) => {
                if (node.isMesh) {
                    node.geometry.dispose();
                    if (node.material.dispose) {
                        node.material.dispose();
                    }
                }
            });
        };
    }, [scene, onLoad]);

    return <primitive object={scene} />;
});

const Stage1Preview = React.memo(({ modelUrl, screenshotUrl }: Stage1PreviewProps) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
    }, [modelUrl]);

    // 如果有截圖，直接顯示截圖
    if (screenshotUrl) {
        return (
            <div className="stage1-preview" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                    src={screenshotUrl}
                    alt="Stage 1 Preview"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
            </div>
        );
    }

    // 如果沒有截圖，顯示3D模型
    return (
        <div className="stage1-preview" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000
                }}>
                    <CircularProgress />
                </div>
            )}
            <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                style={{ background: '#f0f0f0' }}
                gl={{
                    antialias: true,
                    powerPreference: 'high-performance',
                    alpha: true,
                }}
                onCreated={({ gl }) => {
                    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                }}
            >
                <Suspense fallback={null}>
                    <ModelComponent
                        url={modelUrl}
                        onLoad={() => setIsLoading(false)}
                    />
                </Suspense>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
            </Canvas>
        </div>
    );
});

export default Stage1Preview;
