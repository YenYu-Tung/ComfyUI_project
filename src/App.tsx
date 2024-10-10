import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// pages 
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div id="body">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  );
}
