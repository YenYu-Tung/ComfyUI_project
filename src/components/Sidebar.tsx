import React, { useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';

type SidebarProps = {
  isVisible: boolean;
  selectedProject: string;
  selectedPhotoSet: string;
  setSelectedProject: (project: string) => void;
  setSelectedPhotoSet: (photoSet: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  isVisible,
  selectedProject,
  selectedPhotoSet,
  setSelectedProject,
  setSelectedPhotoSet,
}) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<string[]>(['Project 1']);
  const [photoSets, setPhotoSets] = useState<string[]>(['Photo Set 1', 'Photo Set 2', 'Photo Set 3']);

  const handleClick = () => {
    setOpen(!open);
  };

  const handleAddProject = () => {
    const newProject = `Project ${projects.length + 1}`;
    setProjects([...projects, newProject]);
  };

  const handleSelectProject = (project: string) => {
    setSelectedProject(project);
    setOpen(false);
  };

  const handleSelectPhotoSet = (photoSet: string) => {
    setSelectedPhotoSet(photoSet);
  };

  const handleAddPhotoSet = () => {
    const newPhotoSet = `Photo Set ${photoSets.length + 1}`;
    setPhotoSets([...photoSets, newPhotoSet]);
  };

  const handleDeletePhotoSet = (photoSetToDelete: string) => {
    const newPhotoSets = photoSets.filter(photoSet => photoSet !== photoSetToDelete);
    setPhotoSets(newPhotoSets);

    if (selectedPhotoSet === photoSetToDelete) {
      setSelectedPhotoSet(newPhotoSets[0] || '');
    }
  };

  const handleDeleteProject = (projectToDelete: string) => {
    const newProjects = projects.filter(project => project !== projectToDelete);
    setProjects(newProjects);

    if (selectedProject === projectToDelete) {
      setSelectedProject(newProjects[0]);
    }
  };

  return (
    <div className={`relative flex-none transition-all duration-300 ease-in-out ${isVisible ? 'w-[194px]' : 'w-0'} h-full bg-secondary text-black z-[100]`}>
      <div className={`
        absolute top-0 left-0 w-[194px] h-full
        transition-transform duration-300 ease-in-out
        ${isVisible ? '' : '-translate-x-[194px]'}
      `}>
        <div className="flex flex-col h-full p-5">
          {/* Top Content: Projects, Pages, and Photo Sets */}
          <div className="overflow-auto">
            <h1 className="w-full text-[40px] text-primary inline-block Chillax-Bold text-center tracking-[-0.04em] py-0">Dadan!</h1>

            <div className='w-full flex flex-col gap-5 mt-5'>
              {/* Projects Section */}
              <div className="w-full flex flex-col gap-1">
                <div className="w-full flex justify-between px-4">
                  <span className='text-dark-gray Chillax-Medium'>Projects</span>
                  <button onClick={handleAddProject} className='text-[#5C5BF0] Chillax-Medium flex justify-center items-center'>
                    <AddRoundedIcon fontSize='small' />
                  </button>
                </div>

                <div className="w-full">
                  <button
                    className="w-full flex items-center justify-between px-4 h-[42px] rounded-[14px] text-base Chillax-Medium bg-light-gray"
                    onClick={handleClick}
                  >
                    <span>{selectedProject}</span>
                    <UnfoldMoreRoundedIcon
                      className={`${open ? 'rotate-180' : 'rotate-0'} transition-transform`}
                    />
                  </button>

                  {open && (
                    <div className="absolute z-10 w-[154px] mt-1 bg-white shadow-lg rounded-[14px] p-2">
                      {projects.map((project, index) => (
                        <div key={index} className="group relative w-full">
                          <button
                            className="w-full text-left px-4 h-[42px] text-base hover:bg-[#E6E5FF] hover:text-[#5C5BF0] flex items-center Chillax-Medium rounded-[11px]"
                            onClick={() => handleSelectProject(project)}
                          >
                            {project}
                            {projects.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 13 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M1.625 3.375H11.375" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M10.5625 3.375V11.375C10.5625 11.7065 10.4309 12.0245 10.1965 12.2589C9.96211 12.4933 9.64411 12.625 9.3125 12.625H3.6875C3.35589 12.625 3.03789 12.4933 2.8035 12.2589C2.56911 12.0245 2.4375 11.7065 2.4375 11.375V3.375" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M4.5625 3.375V2.125C4.5625 1.79348 4.69411 1.47554 4.9285 1.24112C5.16289 1.0067 5.48089 0.875 5.8125 0.875H7.1875C7.51911 0.875 7.83711 1.0067 8.0715 1.24112C8.30589 1.47554 8.4375 1.79348 8.4375 2.125V3.375" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M5.41699 5.875V10.125" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M7.58301 5.875V10.125" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pages Section */}
              <div className="w-full flex flex-col items-start text-base px-4">
                <span className='text-dark-gray Chillax-Medium'>Pages</span>
                <div className="w-full flex flex-col">
                  <button className='h-[42px] Chillax-Medium flex items-center'>
                    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.92239 1.5C1.68912 1.5 1.5 1.68912 1.5 1.92239V6.02575C1.5 6.25903 1.68912 6.44814 1.92239 6.44814H6.02575C6.25903 6.44814 6.44814 6.25903 6.44814 6.02575V1.92239C6.44814 1.68912 6.25903 1.5 6.02575 1.5H1.92239ZM0 1.92239C0 0.860689 0.860689 0 1.92239 0H6.02575C7.08746 0 7.94814 0.860689 7.94814 1.92239V6.02575C7.94814 7.08746 7.08746 7.94814 6.02575 7.94814H1.92239C0.860689 7.94814 0 7.08746 0 6.02575V1.92239Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.92239 12.0508C1.68911 12.0508 1.5 12.2399 1.5 12.4732V16.5765C1.5 16.8098 1.68911 16.9989 1.92239 16.9989H6.02575C6.25904 16.9989 6.44814 16.8098 6.44814 16.5765V12.4732C6.44814 12.2399 6.25904 12.0508 6.02575 12.0508H1.92239ZM0 12.4732C0 11.4114 0.860699 10.5508 1.92239 10.5508H6.02575C7.08745 10.5508 7.94814 11.4114 7.94814 12.4732V16.5765C7.94814 17.6383 7.08745 18.4989 6.02575 18.4989H1.92239C0.860699 18.4989 0 17.6383 0 16.5765V12.4732Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.4751 1.5C12.2418 1.5 12.0527 1.68911 12.0527 1.92239V6.02575C12.0527 6.25904 12.2418 6.44814 12.4751 6.44814H16.5785C16.8118 6.44814 17.0009 6.25904 17.0009 6.02575V1.92239C17.0009 1.68911 16.8118 1.5 16.5785 1.5H12.4751ZM10.5527 1.92239C10.5527 0.860699 11.4134 0 12.4751 0H16.5785C17.6402 0 18.5009 0.860699 18.5009 1.92239V6.02575C18.5009 7.08745 17.6402 7.94814 16.5785 7.94814H12.4751C11.4134 7.94814 10.5527 7.08745 10.5527 6.02575V1.92239Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.4751 12.0508C12.2418 12.0508 12.0527 12.2399 12.0527 12.4732V16.5765C12.0527 16.8098 12.2418 16.9989 12.4751 16.9989H16.5785C16.8118 16.9989 17.0009 16.8098 17.0009 16.5765V12.4732C17.0009 12.2399 16.8118 12.0508 16.5785 12.0508H12.4751ZM10.5527 12.4732C10.5527 11.4114 11.4134 10.5508 12.4751 10.5508H16.5785C17.6402 10.5508 18.5009 11.4114 18.5009 12.4732V16.5765C18.5009 17.6383 17.6402 18.4989 16.5785 18.4989H12.4751C11.4134 18.4989 10.5527 17.6383 10.5527 16.5765V12.4732Z" fill="currentColor" />
                    </svg>
                    Overview
                  </button>
                  <button className='h-[42px] Chillax-Medium flex items-center'>
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M14.0292 0.585763C14.258 0.24049 14.7234 0.146088 15.0687 0.37491C17.6769 2.10345 19.7492 5.33505 19.7492 8.7587C19.7492 12.1825 17.6769 15.414 15.0687 17.1425C14.7234 17.3713 14.258 17.2769 14.0292 16.9316C13.8004 16.5864 13.8948 16.121 14.2401 15.8921C16.4946 14.398 18.2492 11.6056 18.2492 8.7587C18.2492 5.91192 16.4946 3.11939 14.2401 1.62525C13.8948 1.39643 13.8004 0.931035 14.0292 0.585763Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M5.96999 0.585755C6.19882 0.931025 6.10442 1.39642 5.75915 1.62525C3.50469 3.11939 1.75 5.91193 1.75 8.7587C1.75 11.6056 3.50468 14.398 5.75915 15.8922C6.10442 16.121 6.19882 16.5864 5.97 16.9316C5.74117 17.2769 5.27578 17.3713 4.93051 17.1425C2.32237 15.414 0.25 12.1825 0.25 8.7587C0.25 5.33505 2.32236 2.10345 4.9305 0.374915C5.27577 0.146089 5.74117 0.240485 5.96999 0.585755Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M12.8828 4.19521C13.1752 3.9018 13.6501 3.90097 13.9435 4.19335C14.9928 5.23899 16.0261 7.03812 16.0261 8.75909C16.0261 10.4802 14.9928 12.2792 13.9435 13.3248C13.6501 13.6172 13.1752 13.6164 12.8828 13.323C12.5904 13.0296 12.5913 12.5547 12.8847 12.2623C13.7526 11.3975 14.5261 9.95845 14.5261 8.75909C14.5261 7.55985 13.7526 6.12073 12.8847 5.25586C12.5913 4.96348 12.5904 4.48861 12.8828 4.19521Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M7.11792 4.19519C7.41031 4.48859 7.40949 4.96346 7.1161 5.25585C6.24823 6.12074 5.47461 7.55986 5.47461 8.75909C5.47461 9.95844 6.24822 11.3975 7.11609 12.2623C7.40949 12.5547 7.41031 13.0296 7.11792 13.323C6.82554 13.6164 6.35066 13.6172 6.05726 13.3248C5.00805 12.2792 3.97461 10.4802 3.97461 8.75909C3.97461 7.0381 5.00804 5.23899 6.05726 4.19337C6.35066 3.90098 6.82553 3.9018 7.11792 4.19519Z" fill="currentColor" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M9.9996 8.63867C9.93299 8.63867 9.87891 8.69276 9.87891 8.75936C9.87891 8.82596 9.93299 8.88005 9.9996 8.88005C10.0662 8.88005 10.1203 8.82596 10.1203 8.75936C10.1203 8.69276 10.0662 8.63867 9.9996 8.63867ZM8.87891 8.75936C8.87891 8.14047 9.38071 7.63867 9.9996 7.63867C10.6185 7.63867 11.1203 8.14047 11.1203 8.75936C11.1203 9.37825 10.6185 9.88005 9.9996 9.88005C9.38071 9.88005 8.87891 9.37825 8.87891 8.75936Z" fill="currentColor" />
                    </svg>
                    Forum
                  </button>
                </div>
              </div>

              {/* Photo Sets Section */}
              <div className="w-full flex flex-col items-start Chillax-Medium">
                <div className="w-full flex justify-between px-4">
                  <span className='text-dark-gray'>Photo Sets</span>
                  <button
                    onClick={handleAddPhotoSet}
                    className='text-[#5C5BF0] Chillax-Medium flex justify-center items-center'
                  >
                    <AddRoundedIcon fontSize='small' />
                  </button>
                </div>
                <div className="w-full flex flex-col">
                  {photoSets.map((photoSet, index) => (
                    <div key={index} className="group relative w-full">
                      <button
                        onClick={() => handleSelectPhotoSet(photoSet)}
                        className={`${selectedPhotoSet === photoSet ? 'bg-tint text-primary rounded-[14px]' : ''} w-full h-[42px] px-4 text-start Chillax-Medium relative flex items-center`}
                      >
                        {photoSet}
                        {photoSets.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhotoSet(photoSet);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 13 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M1.625 3.375H11.375" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M10.5625 3.375V11.375C10.5625 11.7065 10.4309 12.0245 10.1965 12.2589C9.96211 12.4933 9.64411 12.625 9.3125 12.625H3.6875C3.35589 12.625 3.03789 12.4933 2.8035 12.2589C2.56911 12.0245 2.4375 11.7065 2.4375 11.375V3.375" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M4.5625 3.375V2.125C4.5625 1.79348 4.69411 1.47554 4.9285 1.24112C5.16289 1.0067 5.48089 0.875 5.8125 0.875H7.1875C7.51911 0.875 7.83711 1.0067 8.0715 1.24112C8.30589 1.47554 8.4375 1.79348 8.4375 2.125V3.375" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M5.41699 5.875V10.125" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M7.58301 5.875V10.125" stroke="#C7C7C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Section: Avatar and Username */}
          <div className="mt-auto flex items-center justify-between bg-secondary">
            <span className='flex items-center gap-2'>
              <AccountCircleRoundedIcon sx={{ width: 25, height: 25 }} />
              <span className="text-base font-semibold">User 1234</span>
            </span>
            <MoreHorizRoundedIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;