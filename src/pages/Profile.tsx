import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Save, AlertCircle, LogOut, Moon, Sun, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSongStoreProvider as useSongStore } from '../store/songStoreProvider';
import { useThemeStore } from '../store/themeStore';

const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { songs, fetchUserSongs } = useSongStore();
  const { mode, toggleTheme } = useThemeStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Calculate user stats
  const totalSongs = songs.length;
  const analyzedSongs = songs.filter(song => song.analyzed).length;
  const totalStorage = songs.reduce((total, song) => total + song.file_size, 0);
  
  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    
    // Placeholder for actual profile update logic (e.g., calling Supabase)
    // For now, we'll simulate a save and update local state if necessary
    try {
      // Example: await updateUserProfile(user.uid, { displayName });
      // Update the user in the auth store if displayName changes
      if (user && displayName !== user.displayName) {
        // setUser({ ...user, displayName }); // Commented out as setUser is removed for now
        // If you need to update user details, you'll need a specific function in authStore for it.
      }
      
      setSaveStatus('success');
      setIsEditing(false);
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error("Failed to save profile:", error);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };
  
  // Fetch songs when the component mounts or user changes
  useEffect(() => {
    if (user?.uid) {
      fetchUserSongs(user.uid).catch(err => {
        console.error("Failed to fetch songs for profile:", err);
        // Optionally set an error state here
      });
    }
  }, [user?.uid, fetchUserSongs]);

  // Update displayName state when user object changes from authStore
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login or home page after logout
      // navigate('/login'); // Assuming you have access to navigate from react-router-dom
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show an error message to the user
    }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and view your music stats
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="px-6 py-5 sm:px-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account Information
              </h2>
            </div>
            
            <div className="px-6 py-5 sm:px-8 sm:py-6">
              {saveStatus === 'success' && (
                <div className="mb-6 p-3 bg-success-50 dark:bg-success-900/20 rounded-md border border-success-200 dark:border-success-800">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
                    <div className="ml-3">
                      <p className="text-sm text-success-700 dark:text-success-200">Profile updated successfully!</p>
                    </div>
                  </div>
                </div>
              )}
              
              {saveStatus === 'error' && (
                <div className="mb-6 p-3 bg-error-50 dark:bg-error-900/20 rounded-md border border-error-200 dark:border-error-800">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
                    <div className="ml-3">
                      <p className="text-sm text-error-700 dark:text-error-200">There was an error updating your profile.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center mb-8">
                <div className="relative mb-4 sm:mb-0 sm:mr-6">
                  <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-4xl font-bold">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  
                  <button className="absolute bottom-0 right-0 p-1 bg-white dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Account ID: {user?.uid.slice(0, 8)}...</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="displayName"
                      className="input pl-10"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      className="input pl-10"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your email address cannot be changed
                  </p>
                </div>
                
                <div className="pt-4 flex justify-end">
                  {/* Edit Profile button removed as requested */}
                </div>
              </div>

              {/* Logout Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={handleLogout} 
                  className="btn-danger w-full sm:w-auto flex items-center justify-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="px-6 py-5 sm:px-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Statistics
              </h2>
            </div>
            
            <div className="px-6 py-5 sm:px-8 sm:py-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Songs
                  </h3>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {totalSongs}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Analyzed Songs
                  </h3>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {analyzedSongs}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-primary-600 rounded-full"
                      style={{ 
                        width: totalSongs > 0 
                          ? `${(analyzedSongs / totalSongs) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Storage Used
                  </h3>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(totalStorage)}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-secondary-600 rounded-full"
                      style={{ width: `${Math.min((totalStorage / (1024 * 1024 * 1024)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(totalStorage)} of 1 GB
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Type
                  </h3>
                  <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                    Free Account
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Upgrade to Premium for unlimited storage and advanced analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CheckCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Profile;