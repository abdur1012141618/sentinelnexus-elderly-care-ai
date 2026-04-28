import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Residents from './pages/Residents';
import Vitals from './pages/Vitals';
import Alerts from './pages/Alerts';
import FallCheck from './pages/FallCheck'; // নতুন

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn><Dashboard /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/residents"
          element={
            <>
              <SignedIn><Residents /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/vitals"
          element={
            <>
              <SignedIn><Vitals /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/alerts"
          element={
            <>
              <SignedIn><Alerts /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route
          path="/fall-check"
          element={
            <>
              <SignedIn><FallCheck /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;