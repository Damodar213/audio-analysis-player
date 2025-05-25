import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Music, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-warning-500" />
        </div>
        
        <h1 className="mt-6 text-4xl font-extrabold text-gray-900 dark:text-white">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Page Not Found
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/"
            className="btn-primary inline-flex items-center"
          >
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Link>
          
          <Link
            to="/library"
            className="btn-outline inline-flex items-center"
          >
            <Music className="mr-2 h-5 w-5" />
            Music Library
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;