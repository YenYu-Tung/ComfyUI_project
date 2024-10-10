import React from 'react';
import sidebar from '../assets/sidebar.svg';

type NavbarProps = {
  selectedProject: string;
  selectedPhotoSet: string;
  toggleSidebar: () => void;
  currentStage: string;
  setCurrentStage: (stage: string) => void;
  generatedImageUrl: string | null;
};

const Navbar: React.FC<NavbarProps> = ({ selectedProject, selectedPhotoSet, toggleSidebar, currentStage, setCurrentStage, generatedImageUrl }) => (
  <div className="flex items-center w-full px-6 h-[8%] bg-white justify-between border-l-2 border-b-2 border-tint">
    <div className="flex items-center w-full text-black gap-2">
      <button onClick={toggleSidebar} className="mr-4 rounded z-50">
        <img src={sidebar} alt="Toggle Sidebar" className="w-6 h-6" />
      </button>
      <span className='text-xl Chillax-Medium'>{selectedProject}</span>
      <span className='text-xl Chillax-Bold'>/</span>
      <span className='text-xl Chillax-Semibold'>{selectedPhotoSet}</span>
    </div>

    <div className="flex items-center text-black gap-4">
      <button
        className={`w-[154px] h-[41px] rounded-[14px] flex justify-center items-center gap-2 Chillax-Medium ${generatedImageUrl ? 'bg-tint text-primary' : 'bg-secondary text-[#C7C7C7]'
          }`}
        disabled={!generatedImageUrl}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={generatedImageUrl ? 'fill-primary' : 'fill-[#C7C7C7]'}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1 9.04297C1.41421 9.04297 1.75 9.37876 1.75 9.79297V11.1119C1.75 12.1546 2.59525 12.9999 3.63793 12.9999H11.1121C12.1548 12.9999 13 12.1546 13 11.1119V9.79297C13 9.37876 13.3358 9.04297 13.75 9.04297C14.1642 9.04297 14.5 9.37876 14.5 9.79297V11.1119C14.5 12.9831 12.9832 14.4999 11.1121 14.4999H3.63793C1.76684 14.4999 0.25 12.9831 0.25 11.1119V9.79297C0.25 9.37876 0.585786 9.04297 1 9.04297Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.375 0.25C7.78921 0.25 8.125 0.585786 8.125 1V9.35345C8.125 9.76766 7.78921 10.1034 7.375 10.1034C6.96079 10.1034 6.625 9.76766 6.625 9.35345V1C6.625 0.585786 6.96079 0.25 7.375 0.25Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.00724 5.7258C4.31078 5.44395 4.78532 5.46152 5.06718 5.76506L7.37534 8.25077L9.6835 5.76506C9.96536 5.46152 10.4399 5.44395 10.7434 5.7258C11.047 6.00765 11.0645 6.4822 10.7827 6.78573L7.92494 9.86332C7.78303 10.0161 7.58389 10.103 7.37534 10.103C7.16679 10.103 6.96765 10.0161 6.82575 9.86332L3.96799 6.78573C3.68613 6.4822 3.70371 6.00765 4.00724 5.7258Z"
          />
        </svg>
        Download
      </button>
      <button
        className={`w-[185px] h-[41px] rounded-[14px] flex justify-center items-center gap-2 Chillax-Medium ${generatedImageUrl ? 'bg-primary text-[#FFFFFF]' : 'bg-[#C7C7C7] text-secondary'
          }`}
        disabled={!generatedImageUrl}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="fill-[#FFFFFF]"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1 9.04297C1.41421 9.04297 1.75 9.37876 1.75 9.79297V11.1119C1.75 12.1546 2.59525 12.9999 3.63793 12.9999H11.1121C12.1548 12.9999 13 12.1546 13 11.1119V9.79297C13 9.37876 13.3358 9.04297 13.75 9.04297C14.1642 9.04297 14.5 9.37876 14.5 9.79297V11.1119C14.5 12.9831 12.9832 14.4999 11.1121 14.4999H3.63793C1.76684 14.4999 0.25 12.9831 0.25 11.1119V9.79297C0.25 9.37876 0.585786 9.04297 1 9.04297Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.375 10.1035C6.96079 10.1035 6.625 9.76773 6.625 9.35352L6.625 1.00007C6.625 0.585854 6.96079 0.250068 7.375 0.250068C7.78921 0.250068 8.125 0.585855 8.125 1.00007L8.125 9.35352C8.125 9.76773 7.78921 10.1035 7.375 10.1035Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.7428 4.62772C10.4392 4.90957 9.96468 4.89199 9.68282 4.58846L7.37466 2.10275L5.0665 4.58846C4.78464 4.89199 4.31009 4.90957 4.00656 4.62772C3.70303 4.34586 3.68545 3.87132 3.96731 3.56778L6.82507 0.490197C6.96697 0.337372 7.16611 0.250535 7.37466 0.250535C7.58321 0.250535 7.78235 0.337372 7.92425 0.490197L10.782 3.56778C11.0639 3.87132 11.0463 4.34586 10.7428 4.62772Z"
          />
        </svg>
        Push to Forum
      </button>
    </div>
  </div>
);

export default Navbar;
