import { Group, Box3, Vector3, WebGLRenderer, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, PresentationControls } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Rnd, RndResizeCallback } from "react-rnd";
import { useLoader } from "@react-three/fiber";
import html2canvas from "html2canvas";

import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';

import Divider from '@mui/material/Divider';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';

import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';

import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

import UpgradeRoundedIcon from '@mui/icons-material/UpgradeRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// drawing canvas
import { Square, Circle, Pencil, Eraser, ZoomIn, ZoomOut, Undo2, Redo2, RotateCcw } from 'lucide-react';
import ToolButton from '../canvasComponents/ToolButton';
import LayerPanel from '../canvasComponents/LayerPanel';
import { LayerData } from '../types';
import {
  createOffscreenCanvas,
  clearCanvas,
  compositeLayersToCanvas,
  getCanvasImageData,
  putImageDataToCanvas
} from '../utils/canvas';

import styled from 'styled-components';

// 在文件頂部導入
import PencilIcon from './icons/PencilIcon';

type Tool = 'pencil' | 'rectangle' | 'circle' | 'eraser';
type DrawingShape = { startX: number; startY: number; endX: number; endY: number };

type ContentAreaProps = {
  currentStage: string;
  setCurrentStage: (stage: string) => void;
  uploadedFiles: any[];
  isVisible: boolean;
  isHistoryVisible?: boolean;
  onImageGenerated: (hasImage: boolean) => void;
  generatedImageUrl: string | null;
  setGeneratedImageUrl: (url: string | null) => void;
};

type StageState = {
  history: ImageData[];
  thumbnailUrl: string | null;  // 添加 thumbnailUrl 屬性
  historyIndex: number;
  layers: LayerData[];
};

// 修改 DropdownIcon 組件，調整大小
const DropdownIcon = () => (
  <svg
    width="12"
    height="7"
    viewBox="0 0 12 7"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5017 0.442536C10.8096 0.71963 10.8346 1.19385 10.5575 1.50173L6.05746 6.50173C5.91523 6.65977 5.71261 6.75001 5.49999 6.75001C5.28738 6.75001 5.08475 6.65977 4.94252 6.50173L0.442522 1.50173C0.165428 1.19385 0.190387 0.71963 0.49827 0.442535C0.806152 0.165441 1.28037 0.1904 1.55746 0.498283L5.49999 4.87887L9.44252 0.498283C9.71962 0.1904 10.1938 0.165442 10.5017 0.442536Z"
      fill="black"
    />
  </svg>
);

const Container = styled.div<{ $isVisible: boolean; $isHistoryVisible: boolean }>`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #fff;
  overflow: hidden;

  // 主内容区域容器
  > div:first-child {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: relative;
  }
`;

const StyledRnd = styled(Rnd)`
  .react-draggable-handle {
    position: absolute;
    z-index: 1000;
    pointer-events: auto;
  }
  .react-rnd-resizer {
    z-index: 1000;
    pointer-events: auto;
    &:hover {
      opacity: 1;
    }
  }
  
  // 移除 overflow 限制
  position: absolute;
  
  // 確保 Canvas 容器可���超出
  > div {
    overflow: visible !important;
  }
`;

// 在文件頂部添加��的 SVG icon 組件
const GenerateIcon = () => (
  <svg
    width="18"
    height="19"
    viewBox="0 0 14 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.91357 5.81957C3.05736 5.81957 3.15574 5.72119 3.17087 5.58497C3.44331 3.56439 3.51142 3.56439 5.60011 3.1633C5.72876 3.1406 5.82714 3.04979 5.82714 2.906C5.82714 2.76978 5.72876 2.6714 5.60011 2.65627C3.51142 2.36113 3.43574 2.29302 3.17087 0.242167C3.15574 0.0983803 3.05736 0 2.91357 0C2.77735 0 2.67897 0.0983803 2.65627 0.249735C2.4141 2.27031 2.30058 2.26275 0.227031 2.65627C0.0983803 2.67897 0 2.76978 0 2.906C0 3.05736 0.0983803 3.1406 0.257302 3.1633C2.31572 3.49628 2.4141 3.54926 2.65627 5.56984C2.67897 5.72119 2.77735 5.81957 2.91357 5.81957Z" fill="currentColor" />
    <path d="M8.04368 14.1892C8.24044 14.1892 8.38423 14.0454 8.42207 13.8411C8.95937 9.70152 9.54209 9.06583 13.6438 8.61176C13.8557 8.58906 13.9995 8.43771 13.9995 8.23338C13.9995 8.03662 13.8557 7.88526 13.6438 7.86256C9.54209 7.4085 8.95937 6.77281 8.42207 2.6257C8.38423 2.42138 8.24044 2.28516 8.04368 2.28516C7.84692 2.28516 7.70313 2.42138 7.67286 2.6257C7.13556 6.77281 6.54527 7.4085 2.45114 7.86256C2.23168 7.88526 2.08789 8.03662 2.08789 8.23338C2.08789 8.43771 2.23168 8.58906 2.45114 8.61176C6.53771 9.14907 7.10528 9.70152 7.67286 13.8411C7.70313 14.0454 7.84692 14.1892 8.04368 14.1892Z" fill="currentColor" />
  </svg>
);

// 添加新的 SVG icon 組件
const ShowResultIcon = () => (
  <svg
    width="20"
    height="18"
    viewBox="0 0 16 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M1.78461 5.576C1.56267 6.13779 1.5 6.51764 1.5 6.61207C1.5 6.70649 1.56267 7.08635 1.78461 7.64814C1.99664 8.18485 2.32928 8.82326 2.80615 9.4326C3.74997 10.6386 5.2471 11.7241 7.55 11.7241C9.8529 11.7241 11.35 10.6386 12.2939 9.4326C12.7707 8.82326 13.1034 8.18485 13.3154 7.64814C13.5373 7.08635 13.6 6.70649 13.6 6.61207C13.6 6.51764 13.5373 6.13779 13.3154 5.576C13.1034 5.03929 12.7707 4.40087 12.2939 3.79154C11.35 2.58554 9.8529 1.5 7.55 1.5C5.2471 1.5 3.74997 2.58554 2.80615 3.79154C2.32928 4.40087 1.99664 5.03929 1.78461 5.576ZM1.62489 2.86708C2.79141 1.37653 4.69428 0 7.55 0C10.4057 0 12.3086 1.37653 13.4751 2.86708C14.0534 3.60602 14.4535 4.37451 14.7105 5.02486C14.9575 5.65014 15.1 6.23753 15.1 6.61207C15.1 6.98661 14.9575 7.574 14.7105 8.19928C14.4535 8.84963 14.0534 9.61812 13.4751 10.3571C12.3086 11.8476 10.4057 13.2241 7.55 13.2241C4.69428 13.2241 2.79141 11.8476 1.62489 10.3571C1.04659 9.61812 0.64646 8.84963 0.38953 8.19928C0.142505 7.574 0 6.98661 0 6.61207C0 6.23753 0.142505 5.65014 0.38953 5.02486C0.64646 4.37451 1.04659 3.60602 1.62489 2.86708Z" fill="currentColor" />
    <path fillRule="evenodd" clipRule="evenodd" d="M7.5498 5.25195C6.7985 5.25195 6.18945 5.861 6.18945 6.6123C6.18945 7.3636 6.7985 7.97264 7.5498 7.97264C8.3011 7.97264 8.91014 7.3636 8.91014 6.6123C8.91014 5.861 8.3011 5.25195 7.5498 5.25195ZM4.68945 6.6123C4.68945 5.03257 5.97007 3.75195 7.5498 3.75195C9.12952 3.75195 10.4101 5.03257 10.4101 6.6123C10.4101 8.19202 9.12952 9.47264 7.5498 9.47264C5.97007 9.47264 4.68945 8.19202 4.68945 6.6123Z" fill="currentColor" />
  </svg>
);

// First, add the new ResetIcon component near the other icon components at the top
const ResetIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="translate-y-[1px]"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.7715 2.84815L2.75659 2.86501C-0.927478 6.57704 -0.918843 12.5727 2.7825 16.274C6.49247 19.984 12.5075 19.984 16.2175 16.274C19.9275 12.564 19.9275 6.54899 16.2175 2.83901C15.8958 2.51728 15.5564 2.22328 15.2025 1.95708L18.4996 1.95708C18.9967 1.95708 19.3996 1.55414 19.3996 1.05708C19.3996 0.560024 18.9967 0.157081 18.4996 0.157081L13.4996 0.157081C13.0142 0.157081 12.4651 0.298538 12.1205 0.81489C11.8429 1.23086 11.8242 1.73242 11.8242 2.05755L11.8242 6.55689C11.8242 7.05395 12.2272 7.45689 12.7242 7.45689C13.2213 7.45689 13.6242 7.05395 13.6242 6.55689L13.6242 3.29026C14.0406 3.56501 14.4359 3.88589 14.8033 4.25323C17.7322 7.18216 17.7322 11.9309 14.8033 14.8598C11.8743 17.7887 7.12564 17.7887 4.19671 14.8598C1.26776 11.9309 1.26776 7.18216 4.19671 4.25323C4.217 4.23293 4.23596 4.21231 4.25444 4.19034L4.25375 4.19117L4.26604 4.17719C4.27884 4.1628 4.30075 4.13859 4.33152 4.10608C4.39313 4.04099 4.48976 3.94317 4.61931 3.82466C4.87937 3.58676 5.26647 3.27066 5.76394 2.9685C6.75875 2.36425 8.16061 1.83436 9.87597 2.04878C10.424 2.11728 10.9238 1.72856 10.9923 1.18054C11.0608 0.632517 10.6721 0.132727 10.124 0.0642243C7.83939 -0.221357 5.98605 0.493559 4.72566 1.25912C4.09553 1.64186 3.60503 2.04192 3.26939 2.34895C3.10109 2.5029 2.97034 2.63474 2.87904 2.73119C2.83336 2.77946 2.79743 2.81899 2.7715 2.84815Z"
      fill="currentColor"
    />
  </svg>
);

// 首先添加新的 CameraIcon 組件
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.28316 1.20317C4.58674 0.474594 5.29863 0 6.08793 0L11.012 0C11.8014 0 12.5132 0.474607 12.8168 1.20311L13.5947 3.06997C13.5947 3.06999 13.5947 3.06995 13.5947 3.06997C13.6188 3.12783 13.6754 3.16552 13.738 3.16552H14.0897C15.7523 3.16552 17.1 4.5133 17.1 6.17586L17.1 14.0897C17.1 15.7523 15.7523 17.1 14.0897 17.1L3.01034 17.1C1.34779 17.1 0 15.7523 0 14.0897L0 6.17586C0 4.51329 1.34778 3.16552 3.01034 3.16552H3.36207C3.42471 3.16552 3.48121 3.12785 3.5053 3.07003C3.5053 3.07003 3.5053 3.07003 3.5053 3.07003L4.28316 1.20317ZM5.94469 1.89549C5.94469 1.89549 5.94469 1.89549 5.94469 1.89549L5.16684 3.76234C4.86326 4.49092 4.15137 4.96552 3.36207 4.96552H3.01034C2.34189 4.96552 1.8 5.50741 1.8 6.17586L1.8 14.0897C1.8 14.7581 2.34188 15.3 3.01034 15.3L14.0897 15.3C14.7581 15.3 15.3 14.7581 15.3 14.0897V6.17586C15.3 5.5074 14.7581 4.96552 14.0897 4.96552L13.738 4.96552C12.9486 4.96552 12.2368 4.49091 11.9332 3.7624L11.1553 1.89555C11.1553 1.89553 11.1553 1.89557 11.1553 1.89555C11.1312 1.83769 11.0746 1.8 11.012 1.8L6.08793 1.8C6.02529 1.8 5.96879 1.83768 5.94469 1.89549Z" fill="currentColor" />
    <path fillRule="evenodd" clipRule="evenodd" d="M8.55001 7.07539C7.15314 7.07539 6.0207 8.20783 6.0207 9.6047C6.0207 11.0016 7.15314 12.134 8.55001 12.134C9.94689 12.134 11.0793 11.0016 11.0793 9.6047C11.0793 8.20783 9.94689 7.07539 8.55001 7.07539ZM4.2207 9.6047C4.2207 7.21372 6.15903 5.27539 8.55001 5.27539C10.941 5.27539 12.8793 7.21372 12.8793 9.6047C12.8793 11.9957 10.941 13.934 8.55001 13.934C6.15903 13.934 4.2207 11.9957 4.2207 9.6047Z" fill="currentColor" />
  </svg>
);

// 添加新的 PhotoIcon 組件
const PhotoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M0.0996476 3.20651C0.0996476 1.49061 1.49065 0.0996094 3.20654 0.0996094L14.7928 0.0996094C16.5087 0.0996094 17.8996 1.49062 17.8996 3.20651L17.8996 14.7927C17.8996 16.5086 16.5087 17.8996 14.7928 17.8996L3.20654 17.8996C1.49066 17.8996 0.0996476 16.5086 0.0996476 14.7927L0.0996476 13.4211C0.0995966 13.4156 0.0995966 13.41 0.0996476 13.4045L0.0996476 3.20651ZM1.89965 13.7248L1.89965 14.7927C1.89965 15.5145 2.48476 16.0996 3.20654 16.0996L14.7928 16.0996C15.5146 16.0996 16.0996 15.5145 16.0996 14.7927L16.0996 9.92398C16.0794 9.90442 16.0598 9.88373 16.0411 9.86194L13.377 6.76068C12.8418 6.13774 11.872 6.15718 11.362 6.79963L11.3572 6.80607L11.3571 6.80604L11.3364 6.83285C11.1494 7.07459 9.98828 8.57567 8.96654 9.88166L10.7858 11.9993C11.1097 12.3764 11.0666 12.9446 10.6896 13.2685C10.3125 13.5924 9.74431 13.5493 9.42041 13.1723L7.13188 10.5083C7.12313 10.4986 7.11463 10.4887 7.10637 10.4786L6.75625 10.071L6.75624 10.071C6.2197 9.44645 5.24632 9.46764 4.73748 10.1149L4.73747 10.1149L1.89965 13.7248ZM7.74228 8.5251C6.42705 7.43543 4.42006 7.60615 3.32238 9.0025C3.32238 9.00251 3.32238 9.00251 3.32237 9.00252L1.89965 10.8123L1.89965 3.20651C1.89965 2.48473 2.48476 1.89961 3.20654 1.89961L14.7928 1.89961C15.5146 1.89961 16.0996 2.48472 16.0996 3.20651V7.16777L14.7423 5.58773L14.7423 5.58771C13.4695 4.10624 11.163 4.15316 9.95098 5.68208L9.94965 5.68376C9.94438 5.69045 9.93822 5.69832 9.93139 5.70728L9.91266 5.73148C9.73676 5.95888 8.7085 7.2882 7.74228 8.5251Z" fill="currentColor" />
  </svg>
);

// 添加新的 LightIcon 組件
const LightIcon = () => (
  <svg width="15" height="20" viewBox="0 0 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.51685 0.0996094C2.56584 0.0996094 0.0996094 4.03299 0.0996094 7.51685C0.0996094 10.2811 1.15794 11.8859 2.20036 13.0152C2.43937 13.2742 2.67711 13.5079 2.88545 13.7127L2.91438 13.7411C3.13672 13.9598 3.31643 14.138 3.46556 14.3079C3.76726 14.6515 3.82375 14.8301 3.82375 14.9651L3.82375 17.7589C3.82375 18.9421 4.78304 19.8996 5.96513 19.8996H9.06858C10.2507 19.8996 11.21 18.9421 11.21 17.7589L11.21 14.9651C11.21 14.8301 11.2664 14.6515 11.5681 14.3079C11.7173 14.138 11.897 13.9598 12.1193 13.7411L12.1483 13.7127C12.3566 13.5079 12.5943 13.2742 12.8333 13.0152C13.8758 11.8859 14.9341 10.2811 14.9341 7.51685C14.9341 4.03299 12.4679 0.0996094 7.51685 0.0996094ZM1.89961 7.51685C1.89961 4.79381 3.77821 1.89961 7.51685 1.89961C11.2555 1.89961 13.1341 4.79381 13.1341 7.51685C13.1341 9.71815 12.3304 10.9064 11.5107 11.7943C11.302 12.0204 11.092 12.2269 10.8778 12.4376L10.8573 12.4577C10.6432 12.6682 10.4156 12.8924 10.2156 13.1202C9.81898 13.5719 9.40996 14.1691 9.40996 14.9651V14.9961H5.62375V14.9651C5.62375 14.1691 5.21472 13.5719 4.81815 13.1202C4.61813 12.8924 4.39052 12.6682 4.17643 12.4577L4.15594 12.4375C3.94173 12.2269 3.73172 12.0204 3.523 11.7943C2.70335 10.9064 1.89961 9.71815 1.89961 7.51685ZM5.62375 16.7961V17.7589C5.62375 17.9468 5.77598 18.0996 5.96513 18.0996H9.06858C9.25772 18.0996 9.40996 17.9468 9.40996 17.7589V16.7961H5.62375Z" fill="currentColor" />
  </svg>
);

// 更新 stageDetails
const stageDetails: Record<string, { label: string; icon: JSX.Element }> = {
  stage1: { label: 'Camera', icon: <CameraIcon /> },
  stage2: { label: 'Photo', icon: <PhotoIcon /> },
  stage3: { label: 'Light', icon: <LightIcon /> },
};

// 添加新的 LayersIcon 組件
const LayersIcon = () => (
  <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.8375 0.432807C10.2129 0.0666686 9.43924 0.0666682 8.81465 0.432807L1.96708 4.4469C0.648999 5.21957 0.648991 7.12502 1.96708 7.89769L4.94581 9.64385L1.77538 11.7575C0.546354 12.5768 0.599047 14.4 1.87334 15.147L8.81382 19.2155C9.43841 19.5817 10.2121 19.5817 10.8367 19.2155L17.765 15.1541C19.0452 14.4036 19.091 12.5693 17.8498 11.7559L14.6644 9.66842L17.6851 7.89769C19.0032 7.12503 19.0032 5.21957 17.6851 4.4469L10.8375 0.432807ZM12.7385 10.7974L10.8375 11.9118C10.2129 12.2779 9.43924 12.2779 8.81465 11.9118L6.86436 10.7685L2.88478 13.4216L9.82526 17.4901L16.7536 13.4287L12.7385 10.7974ZM2.97852 6.1723L9.82609 2.1582L16.6737 6.1723L9.82609 10.1864L2.97852 6.1723Z" fill="currentColor" />
  </svg>
);

const ContentArea: React.FC<ContentAreaProps> = ({
  currentStage,
  setCurrentStage,
  uploadedFiles,
  isVisible,
  generatedImageUrl,
  setGeneratedImageUrl
}) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null); // 保存拖動的模型 URL
  const [canvasScale, setCanvasScale] = useState(100); // 比例調整狀態

  // 拖放處理
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const url = event.dataTransfer.getData('modelUrl');
    if (url) {
      setModelUrl(url);
      // 設置編輯狀態
      setStagesEdited((prev) => ({
        ...prev,
        stage1: true
      }));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy"; // 顯示可拖放的視���提示
  };

  const [stagesEdited, setStagesEdited] = useState<{ [key: string]: boolean }>({
    stage1: false,
    stage2: false,
    stage3: false,
  });

  const handleStageClick = (stage: string) => {
    // 保存當前 stage 的設置
    if (currentStage === 'stage2' || currentStage === 'stage3') {
      setStageSettings(prev => ({
        ...prev,
        [currentStage]: {
          color: color,
          lineWidth: lineWidth
        }
      }));
    }

    // 載入新 stage 的設置
    if (stage === 'stage2' || stage === 'stage3') {
      const settings = stageSettings[stage as 'stage2' | 'stage3'];
      setColor(settings.color);
      setLineWidth(settings.lineWidth);
    }

    // 其他原有的邏輯...
    if (canReset && currentStage === 'stage1') {
      setStagesEdited((prev) => ({
        ...prev,
        stage1: true
      }));
    }
    setCurrentStage(stage);
  };


  // drawing canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [zoom, setZoom] = useState(100);
  const displayContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const activeContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [baseImageData, setBaseImageData] = useState<ImageData | null>(null);
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const canUndo = layers[activeLayerIndex]?.historyIndex > 0;
  const canRedo = layers[activeLayerIndex]?.historyIndex < (layers[activeLayerIndex]?.history.length ?? 0) - 1;
  const canReset = currentStage === 'stage1'
    ? modelUrl
      ? true
      : false
    : layers[activeLayerIndex]?.historyIndex !== 0;



  const saveToHistory = useCallback(() => {
    if (!layers[activeLayerIndex]) return;

    const currentLayer = layers[activeLayerIndex];
    const newImageData = getCanvasImageData(currentLayer.canvas);

    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const layer = { ...newLayers[activeLayerIndex] };

      // Remove any redo states
      layer.history = layer.history.slice(0, layer.historyIndex + 1);
      layer.history.push(newImageData);
      layer.historyIndex = layer.history.length - 1;

      newLayers[activeLayerIndex] = layer;
      return newLayers;
    });

    // 更新編輯狀態
    if (currentStage === 'stage2' || currentStage === 'stage3') {
      setStagesEdited(prev => ({
        ...prev,
        [currentStage]: true
      }));
    }
  }, [activeLayerIndex, layers, currentStage]);

  const undo = useCallback(() => {
    if (!canUndo) return;

    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const layer = { ...newLayers[activeLayerIndex] };

      layer.historyIndex--;
      putImageDataToCanvas(layer.canvas, layer.history[layer.historyIndex]);

      newLayers[activeLayerIndex] = layer;
      return newLayers;
    });

    updateDisplayCanvas();
  }, [activeLayerIndex, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setLayers(prevLayers => {
      const newLayers = [...prevLayers];
      const layer = { ...newLayers[activeLayerIndex] };

      layer.historyIndex++;
      putImageDataToCanvas(layer.canvas, layer.history[layer.historyIndex]);

      newLayers[activeLayerIndex] = layer;
      return newLayers;
    });

    updateDisplayCanvas();
  }, [activeLayerIndex, canRedo]);




  const updateDisplayCanvas = useCallback(() => {
    if (!displayContextRef.current || layers.length === 0) return;

    const canvas = displayContextRef.current.canvas;
    displayContextRef.current.clearRect(0, 0, canvas.width, canvas.height);

    // 從頂層到底層渲染圖層
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.isVisible) {
        displayContextRef.current.globalAlpha = layer.opacity;
        displayContextRef.current.drawImage(layer.canvas, 0, 0);
      }
    }

    displayContextRef.current.globalAlpha = 1;
  }, [layers]);

  useEffect(() => {
    updateDisplayCanvas();
  }, [updateDisplayCanvas]);







  const [stages, setStages] = useState<Record<string, StageState>>({
    stage1: { history: [], thumbnailUrl: null, historyIndex: 0, layers: [] },
    stage2: { history: [], thumbnailUrl: null, historyIndex: 0, layers: [] },
    stage3: { history: [], thumbnailUrl: null, historyIndex: 0, layers: [] },
  });

  const saveCurrentStageState = (canvasHistory: ImageData[], thumbnailUrl: string | null) => {
    setStages((prev) => ({
      ...prev,
      [currentStage]: {
        history: canvasHistory,
        thumbnailUrl: thumbnailUrl,
        historyIndex: canvasHistory.length - 1,
        layers: [...layers]
      },
    }));
  };
  const switchStage = (newStage: string) => {
    // 保存當前 stage 的設置
    if (currentStage === 'stage2' || currentStage === 'stage3') {
      setStageSettings(prev => ({
        ...prev,
        [currentStage]: {
          color: color,
          lineWidth: lineWidth
        }
      }));
    }

    // 載入新 stage 的圖層
    const newStageLayers = stages[newStage].layers;
    setLayers(newStageLayers.length > 0 ? newStageLayers : []);
    setActiveLayerIndex(0);

    // 載入新 stage 的畫筆設置
    if (newStage === 'stage2' || newStage === 'stage3') {
      const settings = stageSettings[newStage as 'stage2' | 'stage3'];
      setColor(settings.color);
      setLineWidth(settings.lineWidth);
    }

    // 載入已保存的縮圖
    if (stages[newStage].thumbnailUrl) {
      setThumbnailUrl(stages[newStage].thumbnailUrl);
    }

    // 設置預設畫筆顏色和筆劃寬度
    handleStageClick(newStage);
  };

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    // 設置畫布的實際像素大小
    canvas.width = width;
    canvas.height = height;

    // 設置畫布的顯示大小
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    displayContextRef.current = context;

    // 如果還沒有圖層，創建初始圖層
    if (layers.length === 0) {
      const initialCanvas = createOffscreenCanvas(width, height);
      const initialImageData = getCanvasImageData(initialCanvas);

      const initialLayer: LayerData = {
        id: crypto.randomUUID(),
        name: 'Layer 1',
        isVisible: true,
        canvas: initialCanvas,
        opacity: 1,
        history: [initialImageData],
        historyIndex: 0
      };

      setLayers([initialLayer]);
      setActiveLayerIndex(0);
    } else {
      // 如果已有圖層，重新繪製所有圖層
      updateDisplayCanvas();
    }

    setIsInitialized(true);
  }, [layers.length, updateDisplayCanvas]);


  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      initializeCanvas();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [initializeCanvas, currentStage]);

  useEffect(() => {
    if (layers[activeLayerIndex]) {
      const context = layers[activeLayerIndex].canvas.getContext('2d');
      if (context) {
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        activeContextRef.current = context;
      }
    }
  }, [color, lineWidth, activeLayerIndex, layers]);

  const getAdjustedCoordinates = (e: React.MouseEvent): { offsetX: number; offsetY: number } => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !canvas) return { offsetX: 0, offsetY: 0 };

    // 計算畫布的實際大小與顯示大小的比例
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 計算滑鼠相對於畫布的位置
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 根據縮放比例調整座標
    return {
      offsetX: x / canvasZoom,
      offsetY: y / canvasZoom
    };
  };

  const lastPoint = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const startDrawing = (e: React.MouseEvent) => {
    if (!layers[activeLayerIndex]?.isVisible) return;

    const coords = getAdjustedCoordinates(e);
    activeContextRef.current = layers[activeLayerIndex].canvas.getContext('2d')!;

    if (activeContextRef.current) {
      activeContextRef.current.strokeStyle = color;
      activeContextRef.current.fillStyle = color;
      activeContextRef.current.lineWidth = lineWidth;
      activeContextRef.current.lineCap = 'round';
      activeContextRef.current.lineJoin = 'round';
    }

    if (tool === 'pencil' || tool === 'eraser') {
      activeContextRef.current?.beginPath();
      activeContextRef.current?.save();
      activeContextRef.current?.scale(canvasZoom, canvasZoom);
      activeContextRef.current?.moveTo(coords.offsetX, coords.offsetY);
      lastPoint.current = coords;
      activeContextRef.current?.restore();
    } else {
      const canvas = layers[activeLayerIndex].canvas;
      const context = canvas.getContext('2d');
      if (context) {
        setBaseImageData(context.getImageData(0, 0, canvas.width, canvas.height));
      }
      setCurrentShape({ startX: coords.offsetX, startY: coords.offsetY, endX: coords.offsetX, endY: coords.offsetY });
    }
    setIsDrawing(true);
  };

  // 添加一個數
  const interpolatePoints = (p1: { offsetX: number; offsetY: number }, p2: { offsetX: number; offsetY: number }, steps: number) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      points.push({
        offsetX: p1.offsetX + (p2.offsetX - p1.offsetX) * (i / steps),
        offsetY: p1.offsetY + (p2.offsetY - p1.offsetY) * (i / steps)
      });
    }
    return points;
  };

  // 修改 draw 數中繪製
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !layers[activeLayerIndex]?.isVisible) return;

    const coords = getAdjustedCoordinates(e);
    const activeLayer = layers[activeLayerIndex];
    const context = activeLayer.canvas.getContext('2d');

    if (!context) return;
    activeContextRef.current = context;

    if (tool === 'pencil' || tool === 'eraser') {
      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
      }

      context.save();
      context.scale(canvasZoom, canvasZoom);
      context.lineWidth = lineWidth / canvasZoom;

      if (lastPoint.current) {
        const distance = Math.sqrt(
          Math.pow(coords.offsetX - lastPoint.current.offsetX, 2) +
          Math.pow(coords.offsetY - lastPoint.current.offsetY, 2)
        );

        const steps = Math.max(Math.ceil(distance), 2);
        const points = interpolatePoints(lastPoint.current, coords, steps);

        for (let i = 1; i < points.length; i++) {
          context.beginPath();
          context.moveTo(points[i - 1].offsetX, points[i - 1].offsetY);
          context.lineTo(points[i].offsetX, points[i].offsetY);
          context.stroke();
        }
      }

      lastPoint.current = coords;
      context.restore();

      if (tool === 'eraser') {
        context.globalCompositeOperation = 'source-over';
      }

      updateDisplayCanvas();
    } else if (baseImageData && currentShape) {
      context.putImageData(baseImageData, 0, 0);

      // 保存當前的變換狀態
      context.save();

      // 應用縮放並調整線寬
      context.scale(canvasZoom, canvasZoom);
      context.lineWidth = lineWidth / canvasZoom;

      const shape = { ...currentShape, endX: coords.offsetX, endY: coords.offsetY };
      drawShape(shape, context);

      // 恢復變換狀態
      context.restore();

      setCurrentShape(shape);
      updateDisplayCanvas();
    }
  };

  const drawShape = (shape: DrawingShape, context: CanvasRenderingContext2D) => {
    const { startX, startY, endX, endY } = shape;
    context.beginPath();

    if (tool === 'rectangle') {
      const width = endX - startX;
      const height = endY - startY;
      context.fillRect(startX, startY, width, height);
      context.strokeRect(startX, startY, width, height);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      context.beginPath();
      context.arc(startX, startY, radius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveToHistory();
    }
    setIsDrawing(false);
    setCurrentShape(null);
    setBaseImageData(null);
    lastPoint.current = null; // 清除最後一個點
    activeContextRef.current = null;
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (isDrawing) {
      // 在開時記錄最後的置，並立即畫到邊緣
      const coords = getAdjustedCoordinates(e);
      if (lastPoint.current && activeContextRef.current) {
        activeContextRef.current.save();
        activeContextRef.current.scale(canvasZoom, canvasZoom);
        activeContextRef.current.lineWidth = lineWidth / canvasZoom;

        if (tool === 'eraser') {
          activeContextRef.current.globalCompositeOperation = 'destination-out';
        }

        activeContextRef.current.beginPath();
        activeContextRef.current.moveTo(lastPoint.current.offsetX, lastPoint.current.offsetY);
        activeContextRef.current.lineTo(coords.offsetX, coords.offsetY);
        activeContextRef.current.stroke();

        if (tool === 'eraser') {
          activeContextRef.current.globalCompositeOperation = 'source-over';
        }

        activeContextRef.current.restore();
        updateDisplayCanvas();
      }
      lastPoint.current = coords;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (e.buttons === 1 && isDrawing) {
      // 只更新最後點位置，不畫線
      const coords = getAdjustedCoordinates(e);
      lastPoint.current = coords;
    } else {
      stopDrawing();
    }
  };

  const clearActiveLayer = () => {
    if (currentStage === 'stage1') {
      // 清除模型
      setModelUrl(null);
      // 清除縮圖
      setThumbnailUrl(null);
      // 重置編輯狀態
      setStagesEdited((prev) => ({
        ...prev,
        stage1: false
      }));
      // 重置模型位置和旋轉
      setModelPosition({
        x: 50,
        y: 50,
        width: 768,
        height: 768,
        scale: 1,
        rotation: { x: 0, y: 0 }
      });
      setRotation({ x: 0, y: 0, z: 0 });
    } else {
      // 其他 stage 的清除邏輯保持不變
      const activeLayer = layers[activeLayerIndex];
      if (activeLayer) {
        const context = activeLayer.canvas.getContext('2d');
        if (context) {
          clearCanvas(context);
          updateDisplayCanvas();
          saveToHistory();
        }
        if (currentStage === 'stage2') {
          setStagesEdited((prev) => ({
            ...prev,
            stage2: false
          }));
        }
        if (currentStage === 'stage3') {
          setStagesEdited((prev) => ({
            ...prev,
            stage3: false
          }));
        }
      }
    }
  };


  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false); // State to track menu visibility

  const menuRef = useRef<HTMLDivElement | null>(null); // Properly type the ref
  const buttonRef = useRef<HTMLDivElement | null>(null); // Properly type the ref

  // Click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);  // Close menu if clicking outside
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []); // Empty dependency array ensures effect runs only once

  // Handle opening the menu on hover
  const handleHover = () => setIsMenuOpen(true);

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[] | null>(null);


  useEffect(() => {
    // 圖層的 canvas 改變時，更新縮圖

    const generateThumbnail = async () => {
      if (!containerRef.current) return;

      try {
        const canvas = await html2canvas(containerRef.current, {
          useCORS: true,
          backgroundColor: null,
        });
        const imgData = canvas.toDataURL("image/png");

        // 保存到當前 stage
        setStages(prev => ({
          ...prev,
          [currentStage]: {
            ...prev[currentStage],
            thumbnailUrl: imgData
          }
        }));

        // 更新當前顯示的縮圖
        setThumbnailUrl(imgData);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    };

    const activeLayer = layers[activeLayerIndex];
    if (activeLayer) {
      generateThumbnail();
    }
  }, [layers[activeLayerIndex]]); // 只要canvas改變就重新生成縮圖

  const [stage2Photo, setStage2Photo] = useState<string | null>(null);
  const [stage3Photo, setStage3Photo] = useState<string | null>(null);
  const [canGenerate, setCanGenerate] = useState<boolean>(false);
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const photoURL = URL.createObjectURL(file);

      if (currentStage === 'stage2') {
        setStage2Photo(photoURL);
      } else if (currentStage === 'stage3') {
        setStage3Photo(photoURL);
      }
    }
  };

  useEffect(() => {
    if (stage2Photo) {
      setStagesEdited((prev) => {
        const updatedStages = { ...prev };
        updatedStages['stage2'] = true;
        return updatedStages;
      });
    }
    if (stage3Photo) {
      setStagesEdited((prev) => {
        const updatedStages = { ...prev };
        updatedStages['stage3'] = true;
        return updatedStages;
      });
    }
  }, [stage2Photo, stage3Photo]);

  useEffect(() => {
    if (Object.values(stagesEdited).every((edited) => edited === true)) {
      setCanGenerate(true);
    } else {
      setCanGenerate(false);
    }
  }, [stagesEdited]);

  useEffect(() => {
    if (canReset) {
      if (currentStage === 'stage1' && stagesEdited.stage2 && stagesEdited.stage3) {
        setCanGenerate(true);
      } else if (currentStage === 'stage2' && stagesEdited.stage1 && stagesEdited.stage3) {
        setCanGenerate(true);
      } else if (currentStage === 'stage3' && stagesEdited.stage1 && stagesEdited.stage2) {
        setCanGenerate(true);
      }
    }
    if (!canReset && currentStage === 'stage1') {
      setCanGenerate(false);
    } else if (!canReset && !stage2Photo && currentStage === 'stage2') {
      setCanGenerate(false);
    } else if (!canReset && !stage3Photo && currentStage === 'stage3') {
      setCanGenerate(false);
    }
  }, [currentStage, canReset, stagesEdited, stage2Photo, stage3Photo]);




  const [isResizable, setIsResizable] = useState<boolean>(false); // 切換拖動/縮放模式
  const [isRotating, setIsRotating] = useState<boolean>(false); // 旋轉模式
  const [longPressTimeout, setLongPressTimeout] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1); // 控制模型的 scale

  // 切換拖動與縮放模式
  const toggleResizable = () => {
    setIsResizable((prev) => !prev);
  };

  // 開始長按
  const handleLongPressStart = () => {
    const timeout = window.setTimeout(() => setIsRotating(true), 500);
    setLongPressTimeout(timeout);
  };

  // 結束長按
  const handleLongPressEnd = () => {
    if (longPressTimeout) window.clearTimeout(longPressTimeout);
    setIsRotating(false);
  };

  // 更新模型的 scale
  const handleResize: RndResizeCallback = (e, dir, ref, delta, position) => {
    const newWidth = parseFloat(ref.style.width.replace("px", ""));
    setScale(newWidth / 768);

    // 根據模型容器的大小動態計算 handle 尺寸
    // 這裡設置 handle 尺寸為容器寬度的 4%，最小 20px，最大 40px
    const newHandleSize = Math.min(Math.max(newWidth * 0.04, 20), 40);
    setHandleSize({ width: newHandleSize, height: newHandleSize });
  };

  const [canvasSize, setCanvasSize] = useState({ width: 200, height: 200 });

  // 修改 CanvasWithThumbnail 組件
  const CanvasWithThumbnail = ({ targetRef }: { targetRef: React.RefObject<HTMLDivElement> }) => {
    useEffect(() => {
      const generateThumbnail = async () => {
        if (!targetRef.current) return;

        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 1024;
          tempCanvas.height = 1024;
          const ctx = tempCanvas.getContext('2d');
          if (!ctx) return;

          // 設置白色背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          const threeCanvas = targetRef.current.querySelector('canvas');

          if (threeCanvas) {
            // 獲取容器的實際尺寸和位置
            const scale = modelPosition.scale || 1;
            const width = modelPosition.width * scale;
            const height = modelPosition.height * scale;
            const x = modelPosition.x + width / 2;  // 計算中心點
            const y = modelPosition.y + height / 2;

            // 保存當前上下文狀態
            ctx.save();

            // 移動到旋轉中心點
            ctx.translate(x, y);

            // 應用旋轉 - 注意旋轉順序
            // ctx.rotate(rotation.y); // 先繞 Y 軸旋轉
            // ctx.rotate(rotation.x); // 再繞 X 軸旋轉
            // ctx.rotate(rotation.z); // 最後繞 Z 軸旋轉

            // 繪製模型，從中心點偏移
            ctx.drawImage(
              threeCanvas,
              -width / 2,
              -height / 2,
              width,
              height
            );

            // 恢復上下文狀態
            ctx.restore();

            const imgData = tempCanvas.toDataURL('image/png');
            setThumbnailUrl(imgData);

            // 更新當前 stage 的縮圖
            if (currentStage === 'stage1') {
              setStages(prev => ({
                ...prev,
                stage1: {
                  ...prev.stage1,
                  thumbnailUrl: imgData
                }
              }));
            }
          }

          tempCanvas.remove();
        } catch (error) {
          console.error('Error generating thumbnail:', error);
        }
      };

      // 使用 requestAnimationFrame 來平滑更新
      let animationFrameId: number;
      const updateThumbnail = () => {
        generateThumbnail();
        animationFrameId = requestAnimationFrame(updateThumbnail);
      };

      updateThumbnail();

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, [targetRef, currentStage, rotation, modelPosition]);

    return null;
  };
  const container2Ref = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [readOnlyMode, setReadonlyMode] = useState<boolean>(false);

  interface SelectedFiles {
    [key: string]: string | File; // 支持 URL 或 File 对象
  }
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({});

  const base64ToBlob = (base64: string) => {
    try {
      const [metadata, data] = base64.split(",");
      const mimeType = metadata.match(/data:([^;]+);base64/)?.[1] || 'image/png';
      const binary = atob(data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return new Blob([array], { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      throw error;
    }
  };

  const fetchBlobFromUrl = async (blobUrl: string) => {
    const response = await fetch(blobUrl);
    return response.blob();
  };

  const appendToFormData = async (formData: FormData, key: string, value: string | File) => {
    if (typeof value === "string") {
      if (value.startsWith("data:image")) {
        // Convert Base64 string to Blob
        const blob = base64ToBlob(value);
        formData.append(key, new File([blob], `${key}.png`, { type: blob.type }));
      } else if (value.startsWith("blob:")) {
        // Fetch Blob from Blob URL
        const blob = await fetchBlobFromUrl(value);
        formData.append(key, new File([blob], `${key}.png`, { type: blob.type }));
      } else {
        console.error(`Unsupported string format for key ${key}`);
      }
    } else {
      formData.append(key, value);
    }
  };

  // 添加��的 state 來存儲生成的圖片歷史記錄
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 修改 generateImages 函數，在成功生成圖片後將其添加到歷史記錄中
  const generateImages = async () => {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();

      // Stage 1: 處理模型截圖
      if (stages.stage1.thumbnailUrl) {
        const stage1Blob = await fetch(stages.stage1.thumbnailUrl).then(r => r.blob());
        formData.append("node_392", new File([stage1Blob], "node_392.png", { type: "image/png" }));
      }

      // Stage 2: 處理上傳的照片和畫布
      if (stage2Photo || stages.stage2.thumbnailUrl) {
        // 處理上傳的照片
        if (stage2Photo) {
          if (stage2Photo.startsWith('blob:')) {
            const blob = await fetch(stage2Photo).then(r => r.blob());
            formData.append("node_58", new File([blob], "node_58.png", { type: "image/png" }));
          } else {
            const blob = base64ToBlob(stage2Photo);
            formData.append("node_58", new File([blob], "node_58.png", { type: "image/png" }));
          }
        }

        // 創建臨時畫布來合成背景和繪圖
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1024;
        tempCanvas.height = 1024;
        const ctx = tempCanvas.getContext('2d')!;

        // 繪製背景
        ctx.fillStyle = stageBackgroundColors.stage2;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 如果是當前階段，使用實時畫布內容
        if (currentStage === 'stage2') {
          // 按順序繪製所有圖層
          for (const layer of layers) {
            if (layer.isVisible) {
              ctx.globalAlpha = layer.opacity;
              ctx.drawImage(layer.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            }
          }
        } else if (stages.stage2.thumbnailUrl) {
          // 如果不是當前階段，使用保存的縮圖
          const img = await createImageBitmap(await fetch(stages.stage2.thumbnailUrl).then(r => r.blob()));
          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        }

        ctx.globalAlpha = 1;
        const blob = await new Promise<Blob>(resolve => tempCanvas.toBlob(blob => resolve(blob!), 'image/png'));
        formData.append("node_460", new File([blob], "node_460.png", { type: "image/png" }));
      }

      // Stage 3: 處理上傳的照片和畫布
      if (stage3Photo || stages.stage3.thumbnailUrl) {
        // 處理上傳的照片
        if (stage3Photo) {
          if (stage3Photo.startsWith('blob:')) {
            const blob = await fetch(stage3Photo).then(r => r.blob());
            formData.append("node_436", new File([blob], "node_436.png", { type: "image/png" }));
          } else {
            const blob = base64ToBlob(stage3Photo);
            formData.append("node_436", new File([blob], "node_436.png", { type: "image/png" }));
          }
        }

        // 創建臨時畫布來合成背景和繪圖
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1024;
        tempCanvas.height = 1024;
        const ctx = tempCanvas.getContext('2d')!;

        // 繪製背景
        ctx.fillStyle = stageBackgroundColors.stage3;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 如果是當前階段，使用實時畫布內容
        if (currentStage === 'stage3') {
          // 按順序繪製所有圖層
          for (const layer of layers) {
            if (layer.isVisible) {
              ctx.globalAlpha = layer.opacity;
              ctx.drawImage(layer.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
            }
          }
        } else if (stages.stage3.thumbnailUrl) {
          // 如果不是當前階段，使用保存的縮圖
          const img = await createImageBitmap(await fetch(stages.stage3.thumbnailUrl).then(r => r.blob()));
          ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        }

        ctx.globalAlpha = 1;
        const blob = await new Promise<Blob>(resolve => tempCanvas.toBlob(blob => resolve(blob!), 'image/png'));
        formData.append("node_459", new File([blob], "node_459.png", { type: "image/png" }));
      }

      // 添加文字描述
      if (stage2Text && stage2Text !== 'Describe your idea') {
        formData.append("stage2_text", stage2Text);
      }
      if (stage3Text && stage3Text !== 'Describe your idea') {
        formData.append("stage3_text", stage3Text);
      }

      // 在發送請求前檢查 FormData 內容
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await fetch("http://localhost:5000/process-images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (result.image_url) {
        const newImageUrl = `http://localhost:5000/processed_images/${result.image_url}`;
        setGeneratedImageUrl(newImageUrl);
        setSelectedHistoryImage(newImageUrl);
        setReadonlyMode(true);
        setGeneratedImages(prev => [newImageUrl, ...prev]);
      } else {
        throw new Error('No image URL in response');
      }

    } catch (error) {
      console.error("Error generating images:", error);
      alert("Error generating images. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 修改 rotation 相關的狀態
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isDraggingRotate, setIsDraggingRotate] = useState(false);
  const [startRotation, setStartRotation] = useState({ x: 0, y: 0, z: 0 });
  const [startMousePosition, setStartMousePosition] = useState({ x: 0, y: 0 });

  // 修改轉控制邏輯
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingRotate(true);
    setIsRotating(true);
    setStartRotation({ ...rotation });
    setStartMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Function to handle rotation movement, now including z-axis
  const handleRotateMove = useCallback((e: MouseEvent) => {
    if (isDraggingRotate) {
      const deltaX = (e.clientX - startMousePosition.x) * 0.01;
      const deltaY = (e.clientY - startMousePosition.y) * 0.01;
      const deltaZ = (e.clientX - startMousePosition.x) * 0.005; // Example for z-axis

      setRotation({
        x: startRotation.x + deltaY,
        y: startRotation.y + deltaX,
        z: startRotation.z + deltaZ, // Update z-axis
      });
    }
  }, [isDraggingRotate, startMousePosition, startRotation]);

  // 修改旋轉控制按鈕的 JSX
  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 
                bg-white/60 text-primary rounded-full flex items-center justify-center cursor-move
                hover:bg-white/70 z-50 transition-all duration-200
                ${isRotating ? 'border-primary/0' : 'border border-primary/30'}`}
    onMouseDown={handleRotateStart}
    title="Drag to rotate"
  >
    <RotateCcw size={20} stroke="#8885FF" strokeWidth={1.5} />
  </div>

  useEffect(() => {
    if (isDraggingRotate) {
      window.addEventListener('mousemove', handleRotateMove);
      const handleRotateEnd = () => {
        setIsDraggingRotate(false);
        setIsRotating(false);
      };
      window.addEventListener('mouseup', handleRotateEnd);
      return () => {
        window.removeEventListener('mousemove', handleRotateMove);
        window.removeEventListener('mouseup', handleRotateEnd);
      };
    }
  }, [isDraggingRotate, handleRotateMove]);

  // 修改 canvasZoom 的初始值
  const [canvasZoom, setCanvasZoom] = useState(0.4); // 保持實際縮放值不變

  // 修改縮放範圍，但保持實際效果
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.04; // 保持原放速度
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = Math.min(Math.max(canvasZoom + delta, 0.2), 0.6); // 保持實際縮放範���
    setCanvasZoom(newZoom);
    // 將實際縮放值 0.2-0.6 映射到顯示值 50-150
    const displayScale = Math.round(((newZoom - 0.2) / 0.4) * 100 + 50);
    setCanvasScale(displayScale);
  };

  // 修改縮放選項
  const scaleOptions = [
    { value: 50, label: '50%' },
    { value: 100, label: '100%' },
    { value: 150, label: '150%' },
  ];

  // 添加新的狀態用縮放選單
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false);

  // 添加處理縮放選項變更的函數
  const handleScaleChange = (value: number) => {
    // 將顯示 50-150 映射回實際縮放值 0.2-0.6
    const actualZoom = ((value - 50) / 100) * 0.4 + 0.2;
    setCanvasZoom(actualZoom);
    setCanvasScale(value);
    setIsScaleMenuOpen(false);
  };

  // 添加新的狀態來管不同階段的文字
  const [stage2Text, setStage2Text] = useState('Describe your idea');
  const [stage3Text, setStage3Text] = useState('Describe your idea');

  // 添加刪除圖片的處理函數
  const handleDeletePhoto = () => {
    if (currentStage === 'stage2') {
      setStage2Photo(null);
      setStagesEdited((prev) => ({
        ...prev,
        stage2: false
      }));
    } else if (currentStage === 'stage3') {
      setStage3Photo(null);
      setStagesEdited((prev) => ({
        ...prev,
        stage3: false
      }));
    }
  };

  // 添加新的 HistoryIcon 組件
  const HistoryIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M9.16211 3.53125C9.71439 3.53125 10.1621 3.97897 10.1621 4.53125V8.71078L12.4758 11.95C12.7969 12.3994 12.6928 13.024 12.2433 13.345C11.7939 13.666 11.1694 13.5619 10.8484 13.1125L8.16211 9.35172V4.53125C8.16211 3.97897 8.60982 3.53125 9.16211 3.53125Z" fill="currentColor" />
      <path d="M9 1C6.31533 1 3.80867 2.35733 2.33333 4.57667V1H1.66667V4.66667C1.66667 5.218 2.11533 5.66667 2.66667 5.66667H6.33333V5H2.85267C4.20067 2.93333 6.51667 1.66667 9 1.66667C13.0433 1.66667 16.3333 4.95667 16.3333 9C16.3333 13.0433 13.0433 16.3333 9 16.3333C4.95667 16.3333 1.66667 13.0433 1.66667 9H1C1 13.4113 4.58867 17 9 17C13.4113 17 17 13.4113 17 9C17 4.58867 13.4113 1 9 1Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M1.06706 1.00039C1.06706 0.66902 1.33569 0.400391 1.66706 0.400391H2.33372C2.66509 0.400391 2.93372 0.66902 2.93372 1.00039V2.90654C4.52566 1.32535 6.70178 0.400391 9.00039 0.400391C13.7431 0.400391 17.6004 4.25769 17.6004 9.00039C17.6004 13.7431 13.7431 17.6004 9.00039 17.6004C4.25769 17.6004 0.400391 13.7431 0.400391 9.00039C0.400391 8.66902 0.66902 8.40039 1.00039 8.40039H1.66706C1.99843 8.40039 2.26706 8.66902 2.26706 9.00039C2.26706 12.7124 5.28843 15.7337 9.00039 15.7337C12.7124 15.7337 15.7337 12.7124 15.7337 9.00039C15.7337 5.28843 12.7124 2.26706 9.00039 2.26706C7.12053 2.26706 5.34388 3.05828 4.08441 4.40039H6.33372C6.66509 4.40039 6.93372 4.66902 6.93372 5.00039V5.66706C6.93372 5.99843 6.66509 6.26706 6.33372 6.26706H2.66706C1.78435 6.26706 1.06706 5.54976 1.06706 4.66706V1.00039Z" fill="currentColor" />
    </svg>
  );

  // 首先更新 StyledRangeInput 組件的樣式
  const StyledRangeInput = styled.input`
    -webkit-appearance: none;
    width: 100%;
    height: 10px;
    border-radius: 6px;
    background: #E5E7EB;
    outline: none;
    cursor: pointer;
    
    /* Thumb styles */
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #6366F1;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      margin-top: -6px;
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #6366F1;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
    }

    /* Track styles */
    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      border-radius: 4px;
    }

    &::-moz-range-track {
      width: 100%;
      height: 4px;
      border-radius: 4px;
    }

    &:focus {
      outline: none;
    }
  `;

  // Add this state near your other state declarations
  const [focalLength, setFocalLength] = useState(55);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, value: 55 });
  const [isFocalMenuOpen, setIsFocalMenuOpen] = useState(false);

  // Add these focal length options
  const focalLengthOptions = [
    { value: 35, label: '35mm' },
    { value: 55, label: '55mm' },
    { value: 85, label: '85mm' },
  ];

  // Update the render section where the focal length is displayed
  {
    (currentStage === 'stage1') && (
      <div className="flex space-x-2 justify-center items-center"> {/* 將 space-x-4 改為 space-x-2 */}
        <svg width="22" height="17" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.2819 4.61571C14.7935 4.90874 14.6352 5.54221 14.9282 6.03061C15.2213 6.51901 15.8547 6.67727 16.3431 6.38426L15.2819 4.61571ZM20.9688 2.40625H22C22 2.03472 21.8002 1.69191 21.4768 1.50886C21.1535 1.3258 20.7567 1.33081 20.4381 1.52196L20.9688 2.40625ZM20.9688 14.0938L20.4381 14.978C20.7567 15.1691 21.1535 15.1742 21.4768 14.9911C21.8002 14.8081 22 14.4653 22 14.0938H20.9688ZM16.3431 10.1157C15.8547 9.82273 15.2213 9.98099 14.9282 10.4694C14.6352 10.9578 14.7935 11.5912 15.2819 11.8843L16.3431 10.1157ZM16.3431 6.38426L21.4994 3.29054L20.4381 1.52196L15.2819 4.61571L16.3431 6.38426ZM19.9375 2.40625V14.0938H22V2.40625H19.9375ZM21.4994 13.2095L16.3431 10.1157L15.2819 11.8843L20.4381 14.978L21.4994 13.2095ZM3.78125 2.0625H12.7188V0H3.78125V2.0625ZM14.4375 3.78125V12.7188H16.5V3.78125H14.4375ZM12.7188 14.4375H3.78125V16.5H12.7188V14.4375ZM2.0625 12.7188V3.78125H0V12.7188H2.0625ZM3.78125 14.4375C2.832 14.4375 2.0625 13.668 2.0625 12.7188H0C0 14.8071 1.69293 16.5 3.78125 16.5V14.4375ZM14.4375 12.7188C14.4375 13.668 13.668 14.4375 12.7188 14.4375V16.5C14.8071 16.5 16.5 14.8071 16.5 12.7188H14.4375ZM12.7188 2.0625C13.668 2.0625 14.4375 2.832 14.4375 3.78125H16.5C16.5 1.69293 14.8071 0 12.7188 0V2.0625ZM3.78125 0C1.69293 0 0 1.69293 0 3.78125H2.0625C2.0625 2.832 2.832 2.0625 3.78125 2.0625V0Z" fill="#8885FF" />
        </svg>
        <div className="flex items-center relative">
          <div
            className="flex items-center cursor-ew-resize select-none"
            onMouseDown={(e) => handleMouseDown(e)}
          >
            <div className="Chillax-Medium text-[#8885FF] w-[60px] text-right">
              {focalLength}mm
            </div>
          </div>
          <div className="flex items-center ml-0.5"> {/* 添加 ml-2 增加間距 */}
            <div
              className="cursor-pointer flex items-center justify-center h-full"
              onClick={() => setIsFocalMenuOpen(!isFocalMenuOpen)}
            >
              <UnfoldMoreRoundedIcon sx={{
                fontSize: '20px',
                color: '#8885FF',
                '&.MuiSvgIcon-root': {
                  color: '#8885FF'
                }
              }} />
            </div>
          </div>
          {isFocalMenuOpen && (
            <div
              className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg z-50 border border-tint py-2 min-w-[80px]"
              onMouseLeave={() => setIsFocalMenuOpen(false)}
            >
              {focalLengthOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-1.5 hover:bg-tint cursor-pointer text-sm Chillax-Medium text-[#8885FF]"
                  onClick={() => {
                    setFocalLength(option.value);
                    setIsFocalMenuOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Add these handlers in your component
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      value: focalLength
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const diff = e.clientX - dragStart.x;
      const newValue = Math.min(135, Math.max(25, dragStart.value + Math.round(diff / 2)));
      setFocalLength(newValue);
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add this useEffect to handle mouse events
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // 在 ContentArea 組件中添加新的狀態
  const [isLayersActive, setIsLayersActive] = useState(false);
  const [isHistoryActive, setIsHistoryActive] = useState(false);

  // 添加新的 state 來存儲 handle 尺寸
  const [handleSize, setHandleSize] = useState({ width: 30, height: 30 });

  const handleModelBoundsUpdate = useCallback((width: number, height: number) => {
    // 分別計算寬度和高度的 handle 尺寸
    const handleWidth = Math.min(Math.max(width * 0.05, 15), 30);
    const handleHeight = Math.min(Math.max(height * 0.05, 15), 30);
    setHandleSize({ width: handleWidth, height: handleHeight });

    // 更新邊框尺寸
    setOutlineSize({ width, height });
  }, []);

  // 添加新的 state 來存儲邊框尺寸
  const [outlineSize, setOutlineSize] = useState({ width: 768, height: 768 });

  // 添加背景顏色狀態
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#FFFFFF');

  // 修改背景顏色狀態只保留 stage2 和 stage3
  const [stageBackgroundColors, setStageBackgroundColors] = useState({
    stage2: '#000000', // 改為黑色
    stage3: '#000000'
  });

  // 在顏色選擇器的 onChange 事件中更新對應 stage 的背景顏色
  const handleBackgroundColorChange = (color: string) => {
    if (currentStage === 'stage1') return;
    setStageBackgroundColors(prev => ({
      ...prev,
      [currentStage]: color
    }));
  };
  // 在 ContentArea 組件的 state 部分添加
  interface PreviewBox {
    id: string;
    number: number;  // 添加固定的編號
  }

  // 修改 PreviewBox 接口
  interface PreviewBox {
    id: string;
    number: number;
  }

  // 添加新的接口來存儲每個 Stage 的預覽圖層
  interface StagePreviewLayers {
    stage1: PreviewBox[];
    stage2: PreviewBox[];
    stage3: PreviewBox[];
  }

  // 在 ContentArea 組件中，將 previewImages 改為按 Stage 分類的狀態
  const [stagePreviewLayers, setStagePreviewLayers] = useState<StagePreviewLayers>({
    stage1: [{ id: crypto.randomUUID(), number: 1 }],
    stage2: [{ id: crypto.randomUUID(), number: 1 }],
    stage3: [{ id: crypto.randomUUID(), number: 1 }],
  });

  // 修改 selectedPreviewId 的狀態管理
  const [selectedPreviewIds, setSelectedPreviewIds] = useState<{ [key: string]: string }>({
    stage1: '',
    stage2: '',
    stage3: '',
  });

  // 在 useEffect 中設置初始選中狀態
  useEffect(() => {
    setSelectedPreviewIds(prev => ({
      ...prev,
      stage1: stagePreviewLayers.stage1[0]?.id || '',
      stage2: stagePreviewLayers.stage2[0]?.id || '',
      stage3: stagePreviewLayers.stage3[0]?.id || '',
    }));
  }, []);

  // 添加一個函數來找到可用的最小編
  const findNextAvailableNumber = (boxes: PreviewBox[]): number => {
    const usedNumbers = new Set(boxes.map(box => box.number));
    let number = 1;
    while (usedNumbers.has(number)) {
      number++;
    }
    return number;
  };

  // 修改 handleAddPreview 函數
  const handleAddPreview = () => {
    setStagePreviewLayers(prev => {
      const currentStageLayers = prev[currentStage as keyof StagePreviewLayers];
      if (currentStageLayers.length >= MAX_PREVIEW_LAYERS) return prev;

      const newBox = {
        id: crypto.randomUUID(),
        number: findNextAvailableNumber(currentStageLayers)
      };

      return {
        ...prev,
        [currentStage]: [...currentStageLayers, newBox]
      };
    });
  };

  // 添加拖曳處理函數
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const [draggedPreviewIndex, setDraggedPreviewIndex] = useState<string | null>(null);

  const handlePreviewDragStart = (box: { id: string, number: number }) => (e: React.DragEvent) => {
    if (stagePreviewLayers[currentStage as keyof StagePreviewLayers].length <= 1) return;

    // 創建自定義拖曳圖像
    const dragImage = document.createElement('div');
    dragImage.className = 'w-16 h-16 rounded-[14px] bg-white flex items-center justify-center';
    dragImage.style.width = '64px';
    dragImage.style.height = '64px';
    dragImage.style.backgroundColor = 'white';
    dragImage.style.borderRadius = '14px';
    dragImage.style.display = 'flex';
    dragImage.style.alignItems = 'center';
    dragImage.style.justifyContent = 'center';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px'; // 將元素移出視圖
    dragImage.innerHTML = `<span style="font-size: 24px; color: #8885FF; font-family: 'Chillax-Medium'">${box.number}</span>`;

    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 32, 32);

    // 在下一幀移除拖曳圖像
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage);
    });

    (e.currentTarget as HTMLDivElement).style.opacity = '0.4';
    setIsPreviewDragging(true);
    setDraggedPreviewIndex(box.id);

    // ���置新增按鈕的拖曳狀態樣式
    requestAnimationFrame(() => {
      const addButton = document.querySelector('.add-preview-button') as HTMLElement;
      if (addButton) {
        addButton.style.removeProperty('transition');
        addButton.style.backgroundColor = '#FFE5E5';
        const paths = addButton.getElementsByTagName('path');
        for (const path of paths) {
          path.setAttribute('stroke', '#FF8585');
        }
      }
    });
  };

  const handlePreviewDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
    setIsPreviewDragging(false);
    setDraggedPreviewIndex(null);

    // 恢復新增按鈕的樣式
    requestAnimationFrame(() => {
      const addButton = document.querySelector('.add-preview-button') as HTMLElement;
      if (addButton) {
        if (stagePreviewLayers[currentStage as keyof StagePreviewLayers].length >= MAX_PREVIEW_LAYERS) {
          addButton.style.backgroundColor = '#ECECF3';
          addButton.style.cursor = 'not-allowed';
          const paths = addButton.getElementsByTagName('path');
          for (const path of paths) {
            path.setAttribute('stroke', '#C7C7C7');
          }
        } else {
          addButton.style.backgroundColor = '#E6E5FF';
          addButton.style.cursor = 'pointer';
          addButton.style.transition = 'background-color 0.2s ease';
          const paths = addButton.getElementsByTagName('path');
          for (const path of paths) {
            path.setAttribute('stroke', '#8885FF');
          }
        }
      }
    });
  };

  const handlePreviewDragOver = (e: React.DragEvent, boxId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedPreviewIndex || draggedPreviewIndex === boxId) return;

    // 確保在交換位置時保持新按鈕樣式
    const addButton = document.querySelector('.add-preview-button') as HTMLElement;
    if (addButton) {
      addButton.style.removeProperty('transition');
      addButton.style.backgroundColor = '#FFE5E5';
      const paths = addButton.getElementsByTagName('path');
      for (const path of paths) {
        path.setAttribute('stroke', '#FF8585');
      }
    }

    setStagePreviewLayers(prev => {
      const currentStageLayers = [...prev[currentStage as keyof StagePreviewLayers]];
      const dragIndex = currentStageLayers.findIndex(box => box.id === draggedPreviewIndex);
      const targetIndex = currentStageLayers.findIndex(box => box.id === boxId);

      if (dragIndex === -1 || targetIndex === -1) return prev;

      [currentStageLayers[dragIndex], currentStageLayers[targetIndex]] =
        [currentStageLayers[targetIndex], currentStageLayers[dragIndex]];

      return {
        ...prev,
        [currentStage]: currentStageLayers
      };
    });
  };

  // 修改新增按鈕的拖曳處理函數
  const handleAddButtonDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (isPreviewDragging) {
      const element = e.currentTarget as HTMLElement;
      element.style.removeProperty('transition');
      element.style.backgroundColor = '#FF0000';
      const paths = element.getElementsByTagName('path');
      for (const path of paths) {
        path.setAttribute('stroke', '#FFFFFF');
      }
    }
  };

  const handlePreviewDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (isPreviewDragging) {
      const element = e.currentTarget as HTMLElement;
      element.style.removeProperty('transition');
      element.style.backgroundColor = '#FFE5E5';
      const paths = element.getElementsByTagName('path');
      for (const path of paths) {
        path.setAttribute('stroke', '#FF8585');
      }
    }
  };

  const handlePreviewDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();

    if (draggedPreviewIndex !== null && isPreviewDragging) {
      setStagePreviewLayers(prev => {
        const currentStageLayers = prev[currentStage as keyof StagePreviewLayers]
          .filter(box => box.id !== draggedPreviewIndex);

        // 如果被刪除的是當前選中的，則選中最上面的一個
        if (draggedPreviewIndex === selectedPreviewIds[currentStage] && currentStageLayers.length > 0) {
          setSelectedPreviewIds(prev => ({
            ...prev,
            [currentStage]: currentStageLayers[0].id
          }));
        }

        return {
          ...prev,
          [currentStage]: currentStageLayers
        };
      });
    }

    setDraggedPreviewIndex(null);
    setIsPreviewDragging(false);
  };

  // 新的狀態來控制主預覽圖的顯示
  const [showMainPreview, setShowMainPreview] = useState(true);

  // 添加鍵盤事件監聽
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z') {
        setShowMainPreview(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 在主畫布容內添加主預覽圖
  {/* 主預覽圖 - 左側 */ }
  {
    thumbnailUrl && showMainPreview && (
      <div
        className="absolute left-8 top-8 z-50 transition-opacity duration-200"
        style={{ opacity: showMainPreview ? 1 : 0 }}
      >
        <div
          className="w-16 h-16 rounded-[14px] overflow-hidden bg-white"
          style={{
            outline: '3px solid #5C5BF0',
            outlineOffset: '0px'
          }}
        >
          <img
            src={thumbnailUrl}
            alt="Main Preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )
  }

  // 修改右側預覽圖列表的渲染
  {
    thumbnailUrl && isLayersActive && (
      <>
        {/* 預覽圖容器組 - 右側 */}
        <div className="absolute top-[72px] right-4 flex flex-col space-y-[10px] z-50">
          {stagePreviewLayers[currentStage as keyof StagePreviewLayers].map((box) => (
            <div
              key={box.id}
              className={`w-16 h-16 rounded-[14px] overflow-hidden bg-white ${stagePreviewLayers[currentStage as keyof StagePreviewLayers].length > 1 ? 'cursor-move hover:outline-red-500' : ''
                }`}
              style={{
                outline: `3px solid ${selectedPreviewIds[currentStage] === box.id ? '#5C5BF0' : '#E6E5FF'}`,
                outlineOffset: '0px'
              }}
              draggable={stagePreviewLayers[currentStage as keyof StagePreviewLayers].length > 1}
              onDragStart={handlePreviewDragStart(box)}
              onDragEnd={handlePreviewDragEnd}
              onDragOver={(e) => handlePreviewDragOver(e, box.id)}
              onClick={(e) => handlePreviewClick(e, box.id)}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[#8885FF] font-medium text-2xl Chillax-Medium">
                  {box.number}
                </span>
              </div>
            </div>
          ))}

          {/* 背景顏色按鈕 */}
          {(currentStage === 'stage2' || currentStage === 'stage3') && (
            <div
              className="w-16 h-10 rounded-[14px] flex items-start justify-start p-1 cursor-pointer relative overflow-hidden"
              style={{
                backgroundColor: stageBackgroundColors[currentStage as 'stage2' | 'stage3'],
                outline: '3px solid #E6E5FF',
                outlineOffset: '0px'
              }}
            >
              <input
                type="color"
                value={stageBackgroundColors[currentStage as 'stage2' | 'stage3']}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
              />
              <svg
                width="21"
                height="21"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g opacity="0.6">
                  <circle
                    cx="9"
                    cy="9"
                    r="8.5"
                    fill="#8885FF"
                    stroke="#E6E5FF"
                  />
                  <path
                    d="M6.10345 13H11.8966C12.506 13 13 12.506 13 11.8966V6.10345C13 5.49403 12.506 5 11.8966 5H8.52941H6.10345C5.49403 5 5 5.49403 5 6.10345V11.8966C5 12.506 5.49403 13 6.10345 13Z"
                    stroke="#E6E5FF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.5 5.5L5.5 12.5"
                    stroke="#E6E5FF"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13 9L9 13"
                    stroke="#E6E5FF"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 5L5 9"
                    stroke="#E6E5FF"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>
          )}

          {/* 新增按鈕 */}
          <div
            className={`w-16 h-10 rounded-[14px] flex items-center justify-center gap-1 ${!isPreviewDragging ? 'transition-colors duration-200' : ''
              } add-preview-button`}
            onClick={handleAddPreview}
            onDragOver={(e) => handlePreviewDragOver(e, '')}
            onDragLeave={handlePreviewDragLeave}
            onDrop={handlePreviewDrop}
          >
            {isPreviewDragging ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_3390_5409)">
                  <path d="M3.48242 4.72461L4.52661 16.7328C4.63817 18.0158 5.71221 19.0005 7.00003 19.0005H12.9993C14.2871 19.0005 15.3612 18.0158 15.4727 16.7328L16.5169 4.72461" stroke="#FF8585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 8V16" stroke="#FF8585" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 8V16" stroke="#FF8585" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M7.20703 4.41379V3.48276C7.20703 2.11157 8.31856 1 9.68979 1H10.3105C11.6817 1 12.7932 2.11157 12.7932 3.48276V4.41379" stroke="#FF8585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1.31055 4.72461H18.6899" stroke="#FF8585" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_3390_5409">
                    <rect width="20" height="20" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.5 9L1.5 9"
                  stroke={stagePreviewLayers[currentStage as keyof StagePreviewLayers].length >= MAX_PREVIEW_LAYERS ? "#C7C7C7" : "#8885FF"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 16.5L9 1.5"
                  stroke={stagePreviewLayers[currentStage as keyof StagePreviewLayers].length >= MAX_PREVIEW_LAYERS ? "#C7C7C7" : "#8885FF"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </>
    )
  }

  // 在 state 部分添加��的狀態
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);

  // 添加新的點擊處理函數
  const handlePreviewClick = (e: React.MouseEvent, boxId: string) => {
    e.stopPropagation();

    if (!isPreviewDragging) {
      setSelectedPreviewIds(prev => ({
        ...prev,
        [currentStage]: boxId
      }));
    }
  };

  useEffect(() => {
    const addButton = document.querySelector('.add-preview-button') as HTMLElement;
    if (addButton) {
      if (stagePreviewLayers[currentStage as keyof StagePreviewLayers].length >= MAX_PREVIEW_LAYERS) {
        addButton.style.backgroundColor = '#ECECF3';
        addButton.style.cursor = 'not-allowed';
      } else {
        addButton.style.backgroundColor = '#E6E5FF';
        addButton.style.cursor = 'pointer';
      }
    }
  }, [stagePreviewLayers, currentStage]);

  // 添加新的 effect 來處理拖動狀態下的按鈕樣式
  useEffect(() => {
    const addButton = document.querySelector('.add-preview-button') as HTMLElement;
    if (addButton) {
      if (isPreviewDragging) {
        addButton.style.removeProperty('transition');
        addButton.style.backgroundColor = '#FFE5E5';
        const paths = addButton.getElementsByTagName('path');
        for (const path of paths) {
          path.setAttribute('stroke', '#FF8585');
        }
      } else {
        if (stagePreviewLayers[currentStage as keyof StagePreviewLayers].length >= MAX_PREVIEW_LAYERS) {
          addButton.style.backgroundColor = '#ECECF3';
          addButton.style.cursor = 'not-allowed';
          const paths = addButton.getElementsByTagName('path');
          for (const path of paths) {
            path.setAttribute('stroke', '#C7C7C7');
          }
        } else {
          addButton.style.backgroundColor = '#E6E5FF';
          addButton.style.cursor = 'pointer';
          const paths = addButton.getElementsByTagName('path');
          for (const path of paths) {
            path.setAttribute('stroke', '#8885FF');
          }
        }
        requestAnimationFrame(() => {
          addButton.style.transition = 'background-color 0.2s ease';
        });
      }
    }
  }, [isPreviewDragging, currentStage, stagePreviewLayers]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // 添加 History 側邊欄的狀態
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // 更新點擊理函
  const handleHistoryClick = () => {
    setIsHistoryVisible(!isHistoryVisible);
  };

  // 在主畫布容器內添加按鈕組
  <div
    className="relative flex-1 bg-gray-100 overflow-hidden"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onWheel={handleWheel}
    style={{
      backgroundImage: 'radial-gradient(circle, #d1d5db 1.2px, transparent 1px)',
      backgroundSize: '20px 20px',
    }}  // 移除固定高度設定
  >
    {/* ... 其他主畫布內容 ... */}

    {/* 撤銷、重做、重置按鈕區域 */}
    <div className="absolute bottom-36 right-8 flex items-center justify-center space-x-1.5">
      {(currentStage === 'stage1' &&
        <button
          onClick={clearActiveLayer}
          disabled={!modelUrl}
          className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
        >
          <ResetIcon />
        </button>
      )}
      {(currentStage === 'stage2' || currentStage === 'stage3') &&
        <>
          <button
            onClick={clearActiveLayer}
            disabled={!canReset}
            className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
          >
            <ResetIcon />
          </button>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-6 h-6" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-6 h-6" />
          </button>
        </>
      }
    </div>

    {/* ... 其他主畫布內容 ... */}
  </div>

  // 1. 首先在其他 icon 組件附近添加新的 HideEyeIcon 組件
  const HideEyeIcon = () => (
    <svg
      width="20"  // 改為和 ShowResultIcon 一樣的寬度
      height="18"  // 改為��� ShowResultIcon 一樣的高度
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M2.55071 1.19719C2.94123 0.806666 3.5744 0.806666 3.96492 1.19719L12.5508 10.6971C12.9413 11.0876 12.9413 11.7208 12.5508 12.1113C12.1603 12.5019 11.5271 12.5019 11.1366 12.1113L2.55071 2.6114C2.16018 2.22088 2.16018 1.58771 2.55071 1.19719Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M1.55619 2.95609C1.01473 3.66745 0.636158 4.40058 0.38953 5.02486C0.142505 5.65014 0 6.23753 0 6.61207C0 6.98661 0.142505 7.574 0.38953 8.19928C0.64646 8.84963 1.04659 9.61812 1.62489 10.3571C2.79141 11.8476 4.69428 13.2241 7.55 13.2241C8.60719 13.2241 9.5338 13.0355 10.3408 12.7222L9.24189 11.5063C8.7332 11.6452 8.17088 11.7241 7.55 11.7241C5.2471 11.7241 3.74997 10.6386 2.80615 9.4326C2.32928 8.82326 1.99664 8.18485 1.78461 7.64814C1.56267 7.08635 1.5 6.70649 1.5 6.61207C1.5 6.51764 1.56267 6.13779 1.78461 5.576C1.95892 5.13478 2.21473 4.62483 2.56517 4.11881L1.82292 3.29753C1.71993 3.19153 1.63102 3.07693 1.55619 2.95609ZM13.5152 10.3054C14.072 9.58237 14.4595 8.83448 14.7105 8.19928C14.9575 7.574 15.1 6.98661 15.1 6.61207C15.1 6.23753 14.9575 5.65014 14.7105 5.02486C14.4535 4.37451 14.0534 3.60602 13.4751 2.86708C12.3086 1.37653 10.4057 0 7.55 0C6.46863 0 5.52389 0.197379 4.70402 0.523587L5.79839 1.73446C6.3227 1.58523 6.90472 1.5 7.55 1.5C9.8529 1.5 11.35 2.58554 12.2939 3.79154C12.7707 4.40087 13.1034 5.03929 13.3154 5.576C13.5373 6.13779 13.6 6.51764 13.6 6.61207C13.6 6.70649 13.5373 7.08635 13.3154 7.64814C13.1357 8.10293 12.8695 8.63073 12.5022 9.152L13.2786 10.011C13.3681 10.1031 13.447 10.2018 13.5152 10.3054Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M4.69279 6.47202C4.69057 6.5182 4.68945 6.56466 4.68945 6.61139C4.68945 8.14101 5.89012 9.39019 7.40041 9.4679L4.69279 6.47202ZM10.0747 7.95656C9.75315 8.55893 9.22231 9.03273 8.57928 9.28088L7.38743 7.96215C7.44067 7.96848 7.49485 7.97174 7.5498 7.97174C8.28255 7.97174 8.87999 7.39238 8.90904 6.66676L10.0747 7.95656ZM10.4021 6.82739C10.4074 6.75609 10.4101 6.68405 10.4101 6.61139C10.4101 5.056 9.16867 3.79057 7.62258 3.75195L10.4021 6.82739ZM4.99782 5.31814L6.18969 6.63689C6.18953 6.62841 6.18945 6.61991 6.18945 6.61139C6.18945 5.86009 6.7985 5.25105 7.5498 5.25105C7.57731 5.25105 7.60463 5.25186 7.63174 5.25347L6.46592 3.96354C5.82919 4.22446 5.30745 4.70837 4.99782 5.31814Z" fill="currentColor" />
    </svg>
  );

  // 2. 修改按鈕部分，根據 readOnlyMode 切換不同的圖標
  <button
    className={`w-[180px] h-[41px] rounded-[14px] flex justify-center items-center gap-2 
        ${generatedImageUrl ? "bg-tint text-primary" : "bg-[#ECECF3] text-black50"} 
        Chillax-Medium`}
    onClick={() => {
      if (generatedImageUrl) {
        setReadonlyMode(!readOnlyMode);
      } else {
        setReadonlyMode(false);
      }
    }}
    disabled={!generatedImageUrl}
  >
    <div className='flex justify-center items-center gap-2'>
      {readOnlyMode ? <HideEyeIcon /> : <ShowResultIcon />}
      {readOnlyMode ? 'Hide Result' : 'Show Result'}
    </div>
  </button>

  // 修改生成結果的畫布部分
  {
    (generatedImageUrl && readOnlyMode) && (
      <div
        className="absolute bg-white"
        style={{
          width: '1024px',
          height: '1024px',
          top: '41%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${canvasZoom})`, // 使用 canvasZoom 而不是 canvasScale/100
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <img
          src={generatedImageUrl}
          alt="Generated content"
          className="w-full h-full object-cover"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    )
  }

  // 添加新的 state 來追蹤選中的歷史圖片
  const [selectedHistoryImage, setSelectedHistoryImage] = useState<string | null>(null);

  // 修改 LayerData 接口
  interface LayerData {
    id: string;
    name: string;
    canvas: HTMLCanvasElement;
    isVisible: boolean;
    opacity: number; // 添加透明度控制
    history: ImageData[];
    historyIndex: number;
  }

  // 在 ContentArea 組件中添加新的狀態
  const [currentLayers, setCurrentLayers] = useState<LayerData[]>([]);
  const [currentActiveLayerIndex, setCurrentActiveLayerIndex] = useState(0);

  // 添加創建新圖層的函數
  const createNewLayer = useCallback(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const newCanvas = createOffscreenCanvas(width, height);
    const initialImageData = getCanvasImageData(newCanvas);

    const newLayer: LayerData = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      canvas: newCanvas,
      isVisible: true,
      opacity: 1,
      history: [initialImageData],
      historyIndex: 0
    };

    setLayers(prev => {
      const newLayers = [...prev, newLayer].map((layer, index) => ({
        ...layer,
        name: `Layer ${index + 1}`
      }));

      // 更新當前 stage 的圖層
      setStages(prevStages => ({
        ...prevStages,
        [currentStage]: {
          ...prevStages[currentStage],
          layers: newLayers
        }
      }));

      return newLayers;
    });

    setActiveLayerIndex(layers.length);
    updateDisplayCanvas();
  }, [layers.length, currentStage, updateDisplayCanvas]);

  // 修改圖層透明度的函數
  const updateLayerOpacity = (index: number, opacity: number) => {
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[index] = {
        ...newLayers[index],
        opacity: opacity
      };
      return newLayers;
    });
    updateDisplayCanvas();
  };

  // 更新圖層順序的函數
  const reorderLayers = (fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const newLayers = [...prev];
      const [movedLayer] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, movedLayer);
      const renamedLayers = newLayers.map((layer, index) => ({
        ...layer,
        name: `Layer ${index + 1}`
      }));

      // 更新當前 stage 的圖層
      setStages(prevStages => ({
        ...prevStages,
        [currentStage]: {
          ...prevStages[currentStage],
          layers: renamedLayers
        }
      }));

      return renamedLayers;
    });

    // 更新活動圖層索引
    if (activeLayerIndex === fromIndex) {
      setActiveLayerIndex(toIndex);
    } else if (fromIndex < activeLayerIndex && toIndex >= activeLayerIndex) {
      setActiveLayerIndex(activeLayerIndex - 1);
    } else if (fromIndex > activeLayerIndex && toIndex <= activeLayerIndex) {
      setActiveLayerIndex(activeLayerIndex + 1);
    }

    updateDisplayCanvas();
  };

  // 刪除圖層的函數
  const deleteLayer = (index: number) => {
    if (layers.length <= 1) return;

    setLayers(prev => {
      const newLayers = [...prev];
      newLayers.splice(index, 1);
      const renamedLayers = newLayers.map((layer, idx) => ({
        ...layer,
        name: `Layer ${newLayers.length - idx}`
      }));

      // 更新當前 stage 的圖層
      setStages(prevStages => ({
        ...prevStages,
        [currentStage]: {
          ...prevStages[currentStage],
          layers: renamedLayers
        }
      }));

      return renamedLayers;
    });

    setActiveLayerIndex(Math.max(0, activeLayerIndex - 1));
    updateDisplayCanvas();
  };

  // 添加圖層拖拽相關的處理函數
  const handleLayerDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('layerIndex', index.toString());
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    target.style.transform = 'scale(1)';
  };

  const handleLayerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1.05)';
    target.style.transition = 'transform 0.2s ease';
  };

  const handleLayerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1)';
  };

  const handleLayerDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLayerDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceIndex = parseInt(e.dataTransfer.getData('layerIndex'));
    if (sourceIndex === targetIndex) return;

    setLayers(prev => {
      const newLayers = [...prev];
      const [movedLayer] = newLayers.splice(sourceIndex, 1);
      newLayers.splice(targetIndex, 0, movedLayer);
      return newLayers;
    });

    // 更新活動圖層索引
    if (activeLayerIndex === sourceIndex) {
      setActiveLayerIndex(targetIndex);
    } else if (activeLayerIndex > sourceIndex && activeLayerIndex <= targetIndex) {
      setActiveLayerIndex(activeLayerIndex - 1);
    } else if (activeLayerIndex < sourceIndex && activeLayerIndex >= targetIndex) {
      setActiveLayerIndex(activeLayerIndex + 1);
    }

    // 重置視覺效果
    const target = e.currentTarget as HTMLElement;
    target.style.transform = 'scale(1)';
  };

  const handleDraw = (e: React.MouseEvent) => {
    if (!isDrawing || !activeContextRef.current || !layers[activeLayerIndex]?.isVisible) return;

    const coords = getAdjustedCoordinates(e);

    if (tool === 'pencil' || tool === 'eraser') {
      if (tool === 'eraser') {
        activeContextRef.current.globalCompositeOperation = 'destination-out';
      }

      activeContextRef.current.save();
      activeContextRef.current.scale(canvasZoom, canvasZoom);
      activeContextRef.current.lineWidth = lineWidth / canvasZoom;

      if (lastPoint.current) {
        const distance = Math.sqrt(
          Math.pow(coords.offsetX - lastPoint.current.offsetX, 2) +
          Math.pow(coords.offsetY - lastPoint.current.offsetY, 2)
        );

        const steps = Math.max(Math.ceil(distance), 2);
        const points = interpolatePoints(lastPoint.current, coords, steps);

        for (let i = 1; i < points.length; i++) {
          activeContextRef.current.beginPath();
          activeContextRef.current.moveTo(points[i - 1].offsetX, points[i - 1].offsetY);
          activeContextRef.current.lineTo(points[i].offsetX, points[i].offsetY);
          activeContextRef.current.stroke();
        }
      }

      lastPoint.current = coords;
      activeContextRef.current.restore();

      if (tool === 'eraser') {
        activeContextRef.current.globalCompositeOperation = 'source-over';
      }

      updateDisplayCanvas();
    } else if (baseImageData && currentShape) {
      const context = layers[activeLayerIndex].canvas.getContext('2d');
      if (context) {
        context.putImageData(baseImageData, 0, 0);
        context.save();
        context.scale(canvasZoom, canvasZoom);
        context.lineWidth = lineWidth / canvasZoom;

        const shape = { ...currentShape, endX: coords.offsetX, endY: coords.offsetY };
        drawShape(shape, context);

        context.restore();
        setCurrentShape(shape);
        updateDisplayCanvas();
      }
    }
  };

  // 初始化時創建���一個圖層
  useEffect(() => {
    if (containerRef.current && !isInitialized) {
      createNewLayer();
      setIsInitialized(true);
    }
  }, [createNewLayer, isInitialized]);

  // 添加圖層狀態保存函數
  const saveLayerState = useCallback(() => {
    if (currentStage === 'stage2' || currentStage === 'stage3') {
      setStages(prev => ({
        ...prev,
        [currentStage]: {
          ...prev[currentStage],
          layers: [...layers]
        }
      }));
    }
  }, [currentStage, layers]);

  // 在 useEffect 中監聽圖層變化
  useEffect(() => {
    saveLayerState();
  }, [layers, saveLayerState]);

  useEffect(() => {
    // Ensure the visibility toggle button is correctly positioned
    layers.forEach((layer, index) => {
      const canvas = document.querySelector(`#layer-canvas-${layer.id}`) as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
        }
      }
    });
  }, [layers]);

  // 添加新的 interface 來定義模型位置和大小的類型
  interface ModelPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: { x: number; y: number };
  }

  // 在 ContentArea 組件中添加新的 state
  const [modelPosition, setModelPosition] = useState<ModelPosition>({
    x: 50,
    y: 50,
    width: 768,
    height: 768,
    scale: 1,
    rotation: { x: 0, y: 0 }
  });

  // 修改 StyledRnd 組件的部分
  <StyledRnd
    default={{
      x: modelPosition.x,
      y: modelPosition.y,
      width: modelPosition.width,
      height: modelPosition.height
    }}
    position={{ x: modelPosition.x, y: modelPosition.y }}
    size={{ width: modelPosition.width, height: modelPosition.height }}
    onDragStop={(e: React.DragEvent, d: { x: number; y: number }) => {
      setModelPosition(prev => ({
        ...prev,
        x: d.x,
        y: d.y
      }));
    }}
    onResizeStop={(e: React.MouseEvent, direction: string, ref: HTMLElement, delta: { width: number; height: number }, position: { x: number; y: number }) => {
      setModelPosition(prev => ({
        ...prev,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
        x: position.x,
        y: position.y
      }));
    }}
  // ... 其他屬性保持不變
  >
    {/* ... 內部內容保持不變 ... */}
  </StyledRnd>

  // 修改 rotation 相關的處理
  useEffect(() => {
    setModelPosition(prev => ({
      ...prev,
      rotation: rotation
    }));
  }, [rotation]);

  // 在切換 stage 時保存位置
  useEffect(() => {
    if (currentStage === 'stage1' && modelUrl) {
      // 恢復保存的位置和旋轉
      setRotation({
        x: modelPosition.rotation.x,
        y: modelPosition.rotation.y,
        z: 0
      });
    }
  }, [currentStage, modelUrl]);

  // 在初始化時為每個 stage 創建空的縮圖
  useEffect(() => {
    setStages({
      stage1: { history: [], thumbnailUrl: null, historyIndex: 0, layers: [] },
      stage2: { history: [], thumbnailUrl: null, historyIndex: 0, layers: [] },
      stage3: { history: [], thumbnailUrl: null, historyIndex: 0, layers: [] },
    });
  }, []);

  // 添加新的接口來定義畫筆設置
  interface BrushSettings {
    color: string;
    lineWidth: number;
  }

  // 在 ContentArea 組件中添加新的 state
  const [stageSettings, setStageSettings] = useState<{
    stage2: BrushSettings;
    stage3: BrushSettings;
  }>({
    stage2: { color: '#FFFFFF', lineWidth: 5 },
    stage3: { color: '#FFFFFF', lineWidth: 50 }
  });

  // 修改顏色和線寬的更新處理函數
  const handleColorChange = (newColor: string) => {
    if (currentStage !== 'stage2' && currentStage !== 'stage3') return;

    setColor(newColor);
    setStageSettings(prev => ({
      ...prev,
      [currentStage]: {
        ...prev[currentStage],
        color: newColor
      }
    }));
  };

  const handleLineWidthChange = (newWidth: number) => {
    if (currentStage !== 'stage2' && currentStage !== 'stage3') return;

    setLineWidth(newWidth);
    setStageSettings(prev => ({
      ...prev,
      [currentStage]: {
        ...prev[currentStage],
        lineWidth: newWidth
      }
    }));
  };

  return (
    <Container $isVisible={isVisible} $isHistoryVisible={isHistoryVisible}>
      <div> {/* 主內容區域 */}
        {/* 頂部工具欄 */}
        <div className="flex items-center justify-between bg-white p-2 border-b-2 border-tint">
          {/* 左側按鈕組 - 保持原寬度 */}
          <div className="flex space-x-2 w-[200px]">
            {['stage1', 'stage2', 'stage3'].map((stage) => {
              const isActive = currentStage === stage;
              const isEdited = stagesEdited[stage];
              const { label, icon } = stageDetails[stage];

              return (
                <button
                  key={stage}
                  className={`w-16 h-10 rounded-[14px] flex justify-center items-center ${isActive
                    ? 'bg-primary text-[#FFFFFF]'
                    : isEdited
                      ? 'bg-tint text-primary'
                      : 'bg-[#ececf3] text-black50'
                    }`}
                  onClick={() => switchStage(stage)}
                >
                  {icon}
                </button>
              );
            })}
          </div>

          {/* 間工具按鈕組 - 固定寬度並置中 */}
          <div className="flex-1 flex justify-center">
            {(currentStage === 'stage1') && (
              <div className="flex space-x-2 items-center">
                <svg width="22" height="17" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.2819 4.61571C14.7935 4.90874 14.6352 5.54221 14.9282 6.03061C15.2213 6.51901 15.8547 6.67727 16.3431 6.38426L15.2819 4.61571ZM20.9688 2.40625H22C22 2.03472 21.8002 1.69191 21.4768 1.50886C21.1535 1.3258 20.7567 1.33081 20.4381 1.52196L20.9688 2.40625ZM20.9688 14.0938L20.4381 14.978C20.7567 15.1691 21.1535 15.1742 21.4768 14.9911C21.8002 14.8081 22 14.4653 22 14.0938H20.9688ZM16.3431 10.1157C15.8547 9.82273 15.2213 9.98099 14.9282 10.4694C14.6352 10.9578 14.7935 11.5912 15.2819 11.8843L16.3431 10.1157ZM16.3431 6.38426L21.4994 3.29054L20.4381 1.52196L15.2819 4.61571L16.3431 6.38426ZM19.9375 2.40625V14.0938H22V2.40625H19.9375ZM21.4994 13.2095L16.3431 10.1157L15.2819 11.8843L20.4381 14.978L21.4994 13.2095ZM3.78125 2.0625H12.7188V0H3.78125V2.0625ZM14.4375 3.78125V12.7188H16.5V3.78125H14.4375ZM12.7188 14.4375H3.78125V16.5H12.7188V14.4375ZM2.0625 12.7188V3.78125H0V12.7188H2.0625ZM3.78125 14.4375C2.832 14.4375 2.0625 13.668 2.0625 12.7188H0C0 14.8071 1.69293 16.5 3.78125 16.5V14.4375ZM14.4375 12.7188C14.4375 13.668 13.668 14.4375 12.7188 14.4375V16.5C14.8071 16.5 16.5 14.8071 16.5 12.7188H14.4375ZM12.7188 2.0625C13.668 2.0625 14.4375 2.832 14.4375 3.78125H16.5C16.5 1.69293 14.8071 0 12.7188 0V2.0625ZM3.78125 0C1.69293 0 0 1.69293 0 3.78125H2.0625C2.0625 2.832 2.832 2.0625 3.78125 2.0625V0Z" fill="#8885FF" />
                </svg>
                <div className="flex items-center relative"> {/* 添加 ml-1 來縮短左側間距 */}
                  <div
                    className="flex items-center cursor-ew-resize select-none"
                    onMouseDown={(e) => handleMouseDown(e)}
                  >
                    <div className="Chillax-Medium text-[#8885FF] w-[60px] text-right">
                      {focalLength}mm
                    </div>
                  </div>
                  <div className="flex items-center ml-0.5"> {/* 添加 ml-2 增加間距 */}
                    <div
                      className="cursor-pointer flex items-center justify-center h-full"
                      onClick={() => setIsFocalMenuOpen(!isFocalMenuOpen)}
                    >
                      <UnfoldMoreRoundedIcon sx={{
                        fontSize: '20px',
                        color: '#8885FF',
                        '&.MuiSvgIcon-root': {
                          color: '#8885FF'
                        }
                      }} />
                    </div>
                  </div>
                  {isFocalMenuOpen && (
                    <div
                      className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg z-50 border border-tint py-2 min-w-[80px]"
                      onMouseLeave={() => setIsFocalMenuOpen(false)}
                    >
                      {focalLengthOptions.map((option) => (
                        <div
                          key={option.value}
                          className="px-4 py-1.5 hover:bg-tint cursor-pointer text-sm Chillax-Medium text-[#8885FF]"
                          onClick={() => {
                            setFocalLength(option.value);
                            setIsFocalMenuOpen(false);
                          }}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(currentStage === 'stage2' || currentStage === 'stage3') && (
              <div className="flex space-x-2 relative">
                <div
                  className="group"
                  ref={buttonRef}
                  onMouseEnter={handleHover}
                >
                  <ToolButton
                    isActive={tool === 'pencil'}
                    onClick={() => setTool('pencil')}
                    icon={PencilIcon as any}
                    iconProps={{
                      color: tool === 'pencil' ? '#FFFFFF' : '#8885FF'
                    }}
                  />
                  {isMenuOpen && (
                    <div
                      className="absolute w-[220px] h-[43px] p-2 bg-white rounded-[14px] z-50 border-2 border-[#E6E5FF] items-center space-x-3 flex"
                      ref={menuRef}
                      style={{
                        top: '56px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {/* 顏色選擇器容器 */}
                      <div className='relative w-[24px] h-[24px] rounded-[6px] flex items-center justify-center'
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 0 2px #E6E5FF`
                        }}>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="absolute opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>

                      {/* 滑桿和數值的容器 */}
                      <div className="flex-1 flex items-center space-x-2 pl-1 pr-1">
                        {/* 滑桿容器 */}
                        <div className="flex-1">
                          <StyledRangeInput
                            type="range"
                            min="1"
                            max="50"
                            value={lineWidth}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              handleLineWidthChange(value);
                            }}
                            style={{
                              background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${(lineWidth - 1) / 49 * 100}%, #E5E7EB ${(lineWidth - 1) / 49 * 100}%, #E5E7EB 100%)`
                            }}
                          />
                        </div>

                        {/* 數值顯示容器 - 固定寬度 */}
                        <div className="w-[40px] text-right">
                          <span className="text-[15px] font-medium text-black Chillax-Medium">
                            {lineWidth}px
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <ToolButton
                  isActive={tool === 'eraser'}
                  onClick={() => setTool('eraser')}
                  icon={Eraser}
                  iconProps={{
                    color: tool === 'eraser' ? '#FFFFFF' : '#8885FF',
                    strokeWidth: 2.2
                  }}
                />
                <ToolButton
                  isActive={tool === 'rectangle'}
                  onClick={() => setTool('rectangle')}
                  icon={Square}
                  iconProps={{
                    color: tool === 'rectangle' ? '#FFFFFF' : '#8885FF',
                    strokeWidth: 2.2
                  }}
                />
                <ToolButton
                  isActive={tool === 'circle'}
                  onClick={() => setTool('circle')}
                  icon={Circle}
                  iconProps={{
                    color: tool === 'circle' ? '#FFFFFF' : '#8885FF',
                    strokeWidth: 2.2
                  }}
                />
              </div>
            )}
          </div>

          {/* 右側縮放控制 - 保持原寬度 */}
          <div className="flex space-x-2 relative w-[200px] justify-end">
            <div className="flex items-center gap-1 relative">
              <span className="Chillax-Medium text-base">{Math.round(canvasScale)}%</span>
              <div
                className="cursor-pointer select-none p-1"
                onClick={() => setIsScaleMenuOpen(!isScaleMenuOpen)}
              >
                <DropdownIcon />
              </div>
              {isScaleMenuOpen && (
                <div
                  className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg z-50 border border-tint py-2 min-w-[80px]"
                  onMouseLeave={() => setIsScaleMenuOpen(false)}
                >
                  {scaleOptions.map((option) => (
                    <div
                      key={option.value}
                      className="px-4 py-1.5 hover:bg-tint cursor-pointer text-sm Chillax-Medium"
                      onClick={() => handleScaleChange(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsLayersActive(!isLayersActive)}
              className={`w-10 h-10 rounded-[14px] flex justify-center items-center ${isLayersActive ? 'bg-primary text-white' : 'text-[#8885FF] hover:bg-[#E6E5FF]'
                }`}
            >
              <LayersIcon />
            </button>
            <button
              onClick={handleHistoryClick}
              className={`w-10 h-10 rounded-[14px] flex justify-center items-center ${isHistoryVisible ? 'bg-primary text-white' : 'text-[#8885FF] hover:bg-[#E6E5FF]'
                }`}
            >
              <HistoryIcon />
            </button>
          </div>
        </div>

        {/* 預覽圖列表 - 移到工具欄外面 */}
        {thumbnailUrl && isLayersActive && (
          <div className="absolute top-[72px] right-4 flex flex-col space-y-[10px] z-50">
            {/* 反轉圖層順序顯示 */}
            {[...layers].reverse().map((layer, index) => (
              <div
                key={layer.id}
                className={`w-16 h-16 rounded-[14px] overflow-hidden bg-white 
                  ${layers.length > 1 ? 'cursor-move' : ''} transition-transform duration-200`}
                style={{
                  outline: `3px solid ${activeLayerIndex === (layers.length - 1 - index) ? '#5C5BF0' : '#E6E5FF'}`,
                  outlineOffset: '0px',
                  opacity: layer.opacity
                }}
                draggable={layers.length > 1}
                onDragStart={(e) => handleLayerDragStart(e, layers.length - 1 - index)}
                onDragEnd={handleLayerDragEnd}
                onDragEnter={handleLayerDragEnter}
                onDragLeave={handleLayerDragLeave}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleLayerDragOver(e, layers.length - 1 - index);
                }}
                onDrop={(e) => handleLayerDrop(e, layers.length - 1 - index)}
                onClick={() => setActiveLayerIndex(layers.length - 1 - index)}
              >
                <canvas
                  id={`layer-canvas-${layer.id}`}
                  className="w-full h-full"
                  ref={canvas => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
                      }
                    }
                  }}
                />
              </div>
            ))}

            {/* 背景顏色按鈕 */}
            {(currentStage === 'stage2' || currentStage === 'stage3') && (
              <div
                className="w-16 h-10 rounded-[14px] flex items-start justify-start p-1 cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: stageBackgroundColors[currentStage as 'stage2' | 'stage3'],
                  outline: '3px solid #E6E5FF',
                  outlineOffset: '0px'
                }}
              >
                <input
                  type="color"
                  value={stageBackgroundColors[currentStage as 'stage2' | 'stage3']}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                />
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g opacity="0.6">
                    <circle
                      cx="9"
                      cy="9"
                      r="8.5"
                      fill="#8885FF"
                      stroke="#E6E5FF"
                    />
                    <path
                      d="M6.10345 13H11.8966C12.506 13 13 12.506 13 11.8966V6.10345C13 5.49403 12.506 5 11.8966 5H8.52941H6.10345C5.49403 5 5 5.49403 5 6.10345V11.8966C5 12.506 5.49403 13 6.10345 13Z"
                      stroke="#E6E5FF"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.5 5.5L5.5 12.5"
                      stroke="#E6E5FF"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 9L9 13"
                      stroke="#E6E5FF"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 5L5 9"
                      stroke="#E6E5FF"
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
              </div>
            )}

            {/* 新增按鈕部分保持不變 */}
            <button
              className="w-16 h-10 rounded-[14px] flex items-center justify-center bg-[#E6E5FF] hover:bg-[#D1D1FF]"
              onClick={createNewLayer}
              disabled={layers.length >= MAX_PREVIEW_LAYERS}
            >
              <AddRoundedIcon sx={{ color: '#8885FF' }} />
            </button>
          </div>
        )}

        {/* 主畫布容器，保留點點景 */}
        <div
          className="relative flex-1 bg-gray-100 overflow-hidden"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onWheel={handleWheel}
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1.2px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}  // 移除固定高度設定
        >
          {/* 左上角主預覽圖 */}
          {thumbnailUrl && showMainPreview && (
            <div
              className="absolute left-8 top-8 z-50 transition-opacity duration-200"
              style={{ opacity: showMainPreview ? 1 : 0 }}
            >
              <div
                className="w-16 h-16 rounded-[14px] overflow-hidden bg-white"
                style={{
                  outline: '3px solid #5C5BF0',
                  outlineOffset: '0px'
                }}
              >
                <img
                  src={thumbnailUrl}
                  alt="Main Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Stage 1 的畫布 */}
          {(currentStage === 'stage1') && (
            <div
              ref={container2Ref}
              className="absolute bg-white"
              style={{
                width: '1024px',
                height: '1024px',
                top: '41%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${canvasZoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.1s ease-out',
                overflow: 'visible',
                clipPath: 'none',
                zIndex: 1,
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {modelUrl && (
                <>
                  <StyledRnd
                    default={{
                      x: modelPosition.x,
                      y: modelPosition.y,
                      width: modelPosition.width,
                      height: modelPosition.height
                    }}
                    position={{ x: modelPosition.x, y: modelPosition.y }}
                    size={{ width: modelPosition.width, height: modelPosition.height }}
                    onDragStop={(e: React.DragEvent, d: { x: number; y: number }) => {
                      setModelPosition(prev => ({
                        ...prev,
                        x: d.x,
                        y: d.y
                      }));
                    }}
                    onResizeStop={(e: React.MouseEvent, direction: string, ref: HTMLElement, delta: { width: number; height: number }, position: { x: number; y: number }) => {
                      setModelPosition(prev => ({
                        ...prev,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        x: position.x,
                        y: position.y
                      }));
                    }}
                    onResize={handleResize}
                    // 添加 onDrag 處理函數
                    onDrag={(e: React.DragEvent, d: { x: number; y: number }) => {
                      // 根據當前縮放比例調整位移
                      const adjustedX = d.x * canvasZoom;
                      const adjustedY = d.y * canvasZoom;
                      return {
                        x: adjustedX / canvasZoom,
                        y: adjustedY / canvasZoom
                      };
                    }}
                    dragGrid={[1 / canvasZoom, 1 / canvasZoom]} // 添加網格對齊以提高精確度
                    scale={canvasZoom} // 設置縮放比例
                    lockAspectRatio={true}
                    style={{
                      background: "transparent",
                      borderRadius: "0",
                      outline: isRotating ? 'none' : '6px solid #5C5BF0',
                      outlineOffset: "-2px",
                      position: "absolute",
                      transformOrigin: "center center",
                      // 移除這行，因為我們現在使用 scale prop
                      // transform: `scale(${1 / canvasZoom})`,
                      zIndex: 1,
                    }}
                    resizeHandleWrapperStyle={{
                      transformOrigin: "center center",
                      // 移除這裡的 transform scale，因為我們會直接在 handles 中處理
                      // transform: `scale(${1 / canvasZoom})`
                    }}
                    resizeHandleStyles={{
                      topLeft: {
                        width: "30px",  // 改回固定尺寸
                        height: "30px",
                        background: "white",
                        border: "5px solid #8885FF",
                        borderRadius: "25%",
                        left: "-15px",
                        top: "-15px",
                        display: isRotating ? 'none' : 'block',
                        position: "absolute",
                        zIndex: 10,
                        className: "thumbnail-exclude"
                      },
                      topRight: {
                        width: "30px",
                        height: "30px",
                        background: "white",
                        border: "5px solid #8885FF",
                        borderRadius: "25%",
                        right: "-15px",
                        top: "-15px",
                        display: isRotating ? 'none' : 'block',
                        position: "absolute",
                        zIndex: 10,
                        className: "thumbnail-exclude"
                      },
                      bottomLeft: {
                        width: "30px",
                        height: "30px",
                        background: "white",
                        border: "5px solid #8885FF",
                        borderRadius: "25%",
                        left: "-15px",
                        bottom: "-15px",
                        display: isRotating ? 'none' : 'block',
                        position: "absolute",
                        zIndex: 10,
                        className: "thumbnail-exclude"
                      },
                      bottomRight: {
                        width: "30px",
                        height: "30px",
                        background: "white",
                        border: "5px solid #8885FF",
                        borderRadius: "25%",
                        right: "-15px",
                        bottom: "-15px",
                        display: isRotating ? 'none' : 'block',
                        position: "absolute",
                        zIndex: 10,
                        className: "thumbnail-exclude"
                      }
                    }}
                  >
                    <div className="w-full h-full relative" style={{ transform: `scale(${scale})` }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        clipPath: 'inset(0)',
                        WebkitClipPath: 'inset(0)',
                      }}>
                        <Canvas
                          gl={{ preserveDrawingBuffer: true }}
                          camera={{
                            position: [0, 2, 5],
                            fov: 45,
                            near: 0.1,
                            far: 1000
                          }}
                          className='canvas-fullscreen'
                        >
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[10, 10, 10]} intensity={1} />
                          <Suspense fallback={null}>
                            <ModelComponent
                              url={modelUrl}
                              scale={1}
                              rotation={rotation}
                              focalLength={focalLength} // ���加焦距參數
                            />
                          </Suspense>
                          <OrbitControls
                            enableZoom={false}
                            enableRotate={false}
                            enablePan={false}
                          />
                        </Canvas>
                      </div>

                      {/* 旋轉控制按鈕 */}
                      <div
                        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 
                            bg-white/60 text-primary rounded-full flex items-center justify-center cursor-move
                            hover:bg-white/70 ${isRotating ? 'opacity-0' : 'opacity-100'} thumbnail-exclude`}
                        style={{
                          zIndex: 1000,
                          transition: 'opacity 0.2s ease-out',
                        }}
                        onMouseDown={handleRotateStart}
                        title="Drag to rotate"
                      >
                        <RotateCcw size={20} stroke="#8885FF" strokeWidth={1.5} />
                      </div>
                    </div>
                  </StyledRnd>
                  <CanvasWithThumbnail targetRef={container2Ref} />
                </>
              )}
            </div>
          )}

          {/* Stage 2 和 3 的畫布 */}
          {(currentStage === 'stage2' || currentStage === 'stage3') && (
            <div
              ref={containerRef}
              className="absolute bg-white"
              style={{
                width: '1024px',
                height: '1024px',
                top: '41%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${canvasZoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.1s ease-out',
                overflow: 'visible',
                clipPath: 'none',
                backgroundColor: stageBackgroundColors[currentStage as 'stage2' | 'stage3'],
                zIndex: 1,
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
                className="absolute canvas-fullscreen"
              />
            </div>
          )}

          {/* 生成結果的畫布 - 永遠渲染但透過 opacity 控制顯示 */}
          <div
            className="absolute bg-white"
            style={{
              width: '1024px',
              height: '1024px',
              top: '41%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${canvasZoom})`,
              transformOrigin: 'center',
              transition: 'all 0s ease-out',
              zIndex: 2,
              opacity: generatedImageUrl && readOnlyMode ? 1 : 0,
              pointerEvents: generatedImageUrl && readOnlyMode ? 'auto' : 'none',
            }}
          >
            {generatedImageUrl && (
              <img
                src={generatedImageUrl}
                alt="Generated content"
                className="w-full h-full object-cover"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            )}
          </div>

          {/* 撤銷、重做、重置按鈕區域 */}
          <div className="absolute bottom-36 right-8 flex items-center justify-center space-x-1.5">
            {(currentStage === 'stage1' &&
              <button
                onClick={clearActiveLayer}
                disabled={!modelUrl}
                className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
              >
                <ResetIcon />
              </button>
            )}
            {(currentStage === 'stage2' || currentStage === 'stage3') &&
              <>
                <button
                  onClick={clearActiveLayer}
                  disabled={!canReset}
                  className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
                >
                  <ResetIcon />
                </button>
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-6 h-6" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="flex items-center justify-center w-10 h-10 bg-[#e5e5e5] text-[#8D8D8F] rounded-[14px] disabled:bg-[#ECECF3] disabled:text-black50 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-6 h-6" />
                </button>
              </>
            }
          </div>
        </div>

        {/* 底部工具欄 - 更新定位方式 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[114px] bg-white p-3 border border-tint rounded-[20px] drop-shadow flex justify-between items-center mx-4"
          style={{
            width: 'calc(100% - 32px)',
            margin: '0 16px 16px 16px',
          }}
        >
          {currentStage === 'stage1' ? (
            <div className="w-[90px] h-[90px] bg-[#ECECF3] rounded-[14px] relative">
              <div
                className="absolute w-[115px] h-[115px] left-7 top-7"
                style={{
                  borderTop: "4px solid #C7C7C7",
                  transform: "rotate(-45deg)",
                }}
              />
            </div>
          ) : (
            <div className='flex items-center' style={{ width: 'calc(100% - 200px)' }}>
              <button
                className={`w-[90px] h-[90px] bg-[#ECECF3] rounded-[14px] relative flex-shrink-0 flex justify-center items-center ${(currentStage === 'stage2' && !stage2Photo) || (currentStage === 'stage3' && !stage3Photo)
                  ? 'shadow-inner'
                  : 'group'
                  }`}
                style={{
                  boxShadow: (currentStage === 'stage2' && !stage2Photo) || (currentStage === 'stage3' && !stage3Photo)
                    ? "inset 0px 0px 8px rgba(199, 199, 199, 0.5)"  // 調整陰影的大小和透度
                    : "none",
                  backgroundImage:
                    currentStage === 'stage2' && stage2Photo
                      ? `url(${stage2Photo})`
                      : currentStage === 'stage3' && stage3Photo
                        ? `url(${stage3Photo})`
                        : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <label className="absolute inset-0 flex justify-center items-center cursor-pointer">
                  {!stage2Photo && currentStage === 'stage2' && (
                    <AddRoundedIcon sx={{ fontSize: 48, color: "#C7C7C7" }} />
                  )}
                  {!stage3Photo && currentStage === 'stage3' && (
                    <AddRoundedIcon sx={{ fontSize: 48, color: "#C7C7C7" }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handlePhotoUpload}
                  />
                </label>

                {((currentStage === 'stage2' && stage2Photo) || (currentStage === 'stage3' && stage3Photo)) && (
                  <div
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center rounded-[14px] transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePhoto();
                    }}
                  >
                    <CloseRoundedIcon sx={{
                      fontSize: 32,
                      color: "#ffffff",
                      opacity: 0.9
                    }} />
                  </div>
                )}
              </button>

              {currentStage === 'stage2' && (
                <textarea
                  className='ml-4 outline-none self-start pt-1 bg-transparent resize-none Chillax-Medium'
                  style={{
                    minHeight: '24px',
                    maxHeight: '72px',
                    overflowY: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    width: 'calc(100% - 110px)',
                    color: stage2Text === 'Describe your idea' ? '#C7C7C7' : '#8D8D8F'
                  }}
                  value={stage2Text}
                  onChange={(e) => {
                    setStage2Text(e.target.value);
                  }}
                  onFocus={() => {
                    if (stage2Text === 'Describe your idea') {
                      setStage2Text('');
                    }
                  }}
                  onBlur={() => {
                    if (!stage2Text.trim()) {
                      setStage2Text('Describe your idea');
                    }
                  }}
                />
              )}

              {currentStage === 'stage3' && (
                <textarea
                  className='ml-4 outline-none self-start pt-1 bg-transparent resize-none Chillax-Medium'
                  style={{
                    minHeight: '24px',
                    maxHeight: '72px',
                    overflowY: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    width: 'calc(100% - 110px)',
                    color: stage3Text === 'Describe your idea' ? '#C7C7C7' : '#8D8D8F'
                  }}
                  value={stage3Text}
                  onChange={(e) => {
                    setStage3Text(e.target.value);
                  }}
                  onFocus={() => {
                    if (stage3Text === 'Describe your idea') {
                      setStage3Text('');
                    }
                  }}
                  onBlur={() => {
                    if (!stage3Text.trim()) {
                      setStage3Text('Describe your idea');
                    }
                  }}
                />
              )}
            </div>
          )}
          <div className="flex flex-col text-base justify-between gap-2">
            <button
              className={`w-[180px] h-[41px] rounded-[14px] flex justify-center items-center gap-2 
                  ${generatedImageUrl ? "bg-tint text-primary" : "bg-[#ECECF3] text-black50"} 
                  Chillax-Medium`}
              onClick={() => {
                if (generatedImageUrl) {
                  setReadonlyMode(!readOnlyMode);
                } else {
                  setReadonlyMode(false);
                }
              }}
              disabled={!generatedImageUrl}
            >
              <div className='flex justify-center items-center gap-2'>
                {readOnlyMode ? <HideEyeIcon /> : <ShowResultIcon />}
                {readOnlyMode ? 'Hide Result' : 'Show Result'}
              </div>
            </button>
            <button
              className={`w-[180px] h-[41px] rounded-[14px] flex justify-center items-center gap-3 ${canGenerate ? "bg-primary text-[#FFFFFF]" : " bg-black50 text-white"} Chillax-Medium`}
              onClick={generateImages}
              disabled={!canGenerate}
            >
              <GenerateIcon />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* History 側邊�� */}
      <StyledHistorySidebar $isVisible={isHistoryVisible}>
        <div className="h-full flex flex-col">
          <div className="flex flex-col gap-2 p-3.5 overflow-y-auto scrollbar-hide">
            {generatedImages.map((imageUrl, index) => (
              <div
                key={index}
                className="w-[88px] h-[88px] rounded-[14px] overflow-hidden cursor-pointer flex-shrink-0"
                style={{
                  outline: selectedHistoryImage === imageUrl ? '3px solid #5C5BF0' : '3px solid #E6E5FF',
                  outlineOffset: '0px'
                }}
                onClick={() => {
                  setGeneratedImageUrl(imageUrl);
                  setSelectedHistoryImage(imageUrl);
                  setReadonlyMode(true);
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Generated result ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {generatedImages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center w-[104px] -ml-2">
                <div className="text-sm Chillax-Medium mb-2 text-black50">No History</div>
                <div className="text-xs opacity-60 text-black50">
                  Generated images will appear here
                </div>
              </div>
            )}
          </div>
        </div>
      </StyledHistorySidebar>
    </Container>
  );
};

interface ModelProps {
  url: string;
  scale: number;
  rotation: { x: number; y: number };
  focalLength: number; // 新增
}

const ModelComponent = ({ url, scale, rotation, focalLength }: ModelProps) => {
  const [model, setModel] = useState<Group | null>(null);
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const lastFocalRef = useRef(focalLength);
  const baseParamsRef = useRef<{
    distance: number;
    fov: number;
    size: number;
  } | null>(null);

  // 初始化模型和基準參數
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

        // Calculate weighted center and setup model
        let totalVolume = 0;
        const weightedCenter = new Vector3();

        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            const meshBox = new Box3().setFromObject(child);
            const meshCenter = meshBox.getCenter(new Vector3());
            const meshSize = meshBox.getSize(new Vector3());
            const volume = meshSize.x * meshSize.y * meshSize.z;
            totalVolume += volume;
            weightedCenter.add(meshCenter.multiplyScalar(volume));
          }
        });

        if (totalVolume > 0) {
          weightedCenter.divideScalar(totalVolume);
        }

        // Setup model group
        const modelGroup = new Group();
        modelGroup.add(gltf.scene);
        gltf.scene.position.sub(weightedCenter);

        // Calculate and store base parameters
        const box = new Box3().setFromObject(gltf.scene);
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const baseFOV = 30;
        const targetSize = maxDim * 1.6;
        const baseDistance = targetSize / (2 * Math.tan((baseFOV * Math.PI) / 360));

        baseParamsRef.current = {
          distance: baseDistance,
          fov: baseFOV,
          size: targetSize
        };

        // Initial camera setup
        updateCameraParams(focalLength);
        setModel(modelGroup);
      },
      undefined,
      (error) => console.error("Failed to load model:", error)
    );
  }, [url]);

  // 分離相機參數更新邏輯
  const updateCameraParams = useCallback((focal: number) => {
    if (!baseParamsRef.current || !camera) return;

    const { distance: baseDistance, fov: baseFOV } = baseParamsRef.current;
    const baseFocalLength = 50;
    const focalRatio = focal / baseFocalLength;

    // 平滑的緩動函數
    const easeEffect = (x: number) => {
      return x < 1
        ? Math.pow(x, 0.3)
        : 1 + Math.pow(x - 1, 0.5);
    };

    const focalEffect = easeEffect(focalRatio);
    const adjustedFOV = baseFOV / focalEffect;
    const adjustedDistance = baseDistance * focalEffect;

    // 使用 GSAP 或自定義的插值來滑過渡
    const heightFactor = 0.12;
    const distanceFactor = 0.88;

    // 一次性設置所有相機參數
    camera.position.set(
      0,
      adjustedDistance * heightFactor,
      adjustedDistance * distanceFactor
    );
    if (camera instanceof PerspectiveCamera) {
      camera.fov = adjustedFOV;
      camera.near = adjustedDistance * 0.01;
      camera.far = adjustedDistance * 10;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    lastFocalRef.current = focal;
  }, [camera]);

  // 使用 useEffect 監聽焦距變化
  useEffect(() => {
    // 只有當焦距變化超過閾值時才更新
    const threshold = 0.5;
    if (Math.abs(focalLength - lastFocalRef.current) >= threshold) {
      updateCameraParams(focalLength);
    }
  }, [focalLength, updateCameraParams]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotation.x;
      groupRef.current.rotation.y = rotation.y;
    }
  });

  return model ? (
    <group ref={groupRef}>
      <primitive
        object={model}
        scale={[scale, scale, scale]}
      />
    </group>
  ) : null;
};

// 添加常量定義最大圖層數
const MAX_PREVIEW_LAYERS = 6;

// 在其他 styled components 定義的地方添加這個
const StyledHistorySidebar = styled.div<{ $isVisible: boolean }>`
  width: ${props => props.$isVisible ? '120px' : '0'};  // 從 200px 改為 120px
  height: 100%;
  background-color: #fff;
  border-left: ${props => props.$isVisible ? '2px' : '0'} solid #E6E5FF;
  transition: all 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
`;


export default ContentArea;



