import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './presentation/context/SessionContext';
import { ToastProvider } from './presentation/context/ToastContext';
import { seedIfNeeded } from './infrastructure/seed/seedData';
import Layout from './presentation/components/layout/Layout';
import HomePage from './presentation/pages/HomePage';
import LoginPage from './presentation/pages/LoginPage';
import RegisterPage from './presentation/pages/RegisterPage';
import SearchPage from './presentation/pages/SearchPage';
import ListingDetailPage from './presentation/pages/ListingDetailPage';
import PublishPage from './presentation/pages/PublishPage';
import DashboardPage from './presentation/pages/DashboardPage';
import ProfilePage from './presentation/pages/ProfilePage';
import RoomiesPage from './presentation/pages/RoomiesPage';
import RoomieProfilePage from './presentation/pages/RoomieProfilePage';
import RoomieProfileEditPage from './presentation/pages/RoomieProfileEditPage';
import MessagesPage from './presentation/pages/MessagesPage';

seedIfNeeded();

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/listing/:id" element={<ListingDetailPage />} />
                    <Route path="/publish" element={<PublishPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/roomies" element={<RoomiesPage />} />
                    <Route path="/roomie/:id" element={<RoomieProfilePage />} />
                    <Route path="/roomie-profile/edit" element={<RoomieProfileEditPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
