import React, { useState } from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
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

  return (
    <div className={`${isVisible ? 'w-[194px]' : 'w-0'} h-full transition-all duration-300 bg-secondary text-black flex-none`}>
      {isVisible && (
        <div className="flex flex-col h-full p-5">
          {/* Top Content: Projects, Pages, and Photo Sets */}
          <div className="overflow-auto">
            <h1 className="w-full text-4xl text-primary inline-block Chillax-Bold text-center">Dadan!</h1>

            <div className='w-full flex flex-col gap-5 mt-5'>
              {/* Projects Section */}
              <div className="w-full flex flex-col gap-4">
                <div className="w-full flex justify-between px-4">
                  <span className='text-dark-gray text-base'>Projects</span>
                  <button onClick={handleAddProject} className='text-primary flex justify-center items-center gap-0 text-sm'>
                    <AddRoundedIcon fontSize='small'/> add
                  </button>
                </div>

                <div className="w-full">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 rounded-[14px] text-base Chillax-Medium bg-light-gray"
                    onClick={handleClick}
                  >
                    <span>{selectedProject}</span>
                    <UnfoldMoreRoundedIcon
                      className={`${open ? 'rotate-180' : 'rotate-0'} transition-transform`}
                    />
                  </button>

                  {open && (
                    <div className="rounded-[14px] mt-1">
                      {projects
                        .filter((project) => project !== selectedProject)
                        .map((project, index) => (
                          <button
                            key={index}
                            className="w-full text-left py-2 text-base hover:bg-gray-200 rounded-[14px]"
                            onClick={() => handleSelectProject(project)}
                          >
                            {project}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pages Section */}
              <div className="w-full flex flex-col items-start text-base gap-4 px-4">
                <span className='text-dark-gray'>Pages</span>
                <button className='Chillax-Medium'>
                  <GridViewOutlinedIcon sx={{ marginRight: '8px' }} /> Overview
                </button>
                <button className='Chillax-Medium'>
                  <ForumOutlinedIcon sx={{ marginRight: '8px' }} /> Forum
                </button>
              </div>

              {/* Photo Sets Section */}
              <div className="w-full flex flex-col items-start text-base gap-2">
                <span className='text-dark-gray px-4'>Photo Sets</span>
                <button
                  onClick={() => handleSelectPhotoSet("Photo Set 1")}
                  className={`${selectedPhotoSet === "Photo Set 1" ? 'bg-tint text-primary' : ''} w-full py-2 px-4 rounded-[14px] text-start Chillax-Medium`}
                >
                  Photo Set 1
                </button>
                <button
                  onClick={() => handleSelectPhotoSet("Photo Set 2")}
                  className={`${selectedPhotoSet === "Photo Set 2" ? 'bg-tint text-primary' : ''} w-full py-2 px-4 rounded-[14px] text-start Chillax-Medium`}
                >
                  Photo Set 2
                </button>
                <button
                  onClick={() => handleSelectPhotoSet("Photo Set 3")}
                  className={`${selectedPhotoSet === "Photo Set 3" ? 'bg-tint text-primary' : ''} w-full py-2 px-4 rounded-[14px] text-start Chillax-Medium`}
                >
                  Photo Set 3
                </button>
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
      )}
    </div>
  );
};

export default Sidebar;