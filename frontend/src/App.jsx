import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import SubmitArticlePage from './pages/SubmitArticlePage';
import DashboardPage from './pages/DashboardPage';
import ValidatorsPage from './pages/ValidatorsPage';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';


function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/submit" element={<SubmitArticlePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/validators" element={<ValidatorsPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;