import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';

const App: React.FC = () => {
  const [isSidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [isSubSidebarVisible, setSubSidebarVisible] = useState<boolean>(true);

  const [selectedProject, setSelectedProject] = useState<string>('Project 1');
  const [selectedPhotoSet, setSelectedPhotoSet] = useState<string>('Photo Set 1');

  const toggleSidebar = () => {setSidebarVisible(!isSidebarVisible);
    console.log('click1')
  }
  const toggleSubSidebar = () => {setSubSidebarVisible(!isSubSidebarVisible);
    console.log('click')
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar
        isVisible={isSidebarVisible}
        selectedProject={selectedProject}
        selectedPhotoSet={selectedPhotoSet}
        setSelectedProject={setSelectedProject}
        setSelectedPhotoSet={setSelectedPhotoSet}
      />
      <MainContent
        isVisible={isSidebarVisible}
        isSubSidebarVisible={isSubSidebarVisible}
        toggleSidebar={toggleSidebar}
        toggleSubSidebar={toggleSubSidebar}
        selectedProject={selectedProject}
        selectedPhotoSet={selectedPhotoSet}
      />
    </div>
  );
};

export default App;