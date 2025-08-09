import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useAdminViewSwitch() {
  const { user } = useAuth();
  const [isStudentView, setIsStudentView] = useState(false);
  
  const isAdmin = user?.email === 'admin@gmail.com';
  
  console.log('👑 useAdminViewSwitch:', { 
    userEmail: user?.email, 
    isAdmin, 
    isStudentView,
    currentPath: window.location.pathname 
  });
  
  const toggleView = useCallback(() => {
    console.log('👑 toggleView called', { isAdmin, currentStudentView: isStudentView });
    if (!isAdmin) return;
    setIsStudentView(prev => {
      console.log('👑 toggleView: changing from', prev, 'to', !prev);
      return !prev;
    });
  }, [isAdmin, isStudentView]);

  const switchToAdmin = useCallback(() => {
    if (!isAdmin) return;
    setIsStudentView(false);
  }, [isAdmin]);

  const switchToStudent = useCallback(() => {
    if (!isAdmin) return;
    setIsStudentView(true);
  }, [isAdmin]);

  return {
    isAdmin,
    isStudentView,
    isAdminView: isAdmin && !isStudentView,
    toggleView,
    switchToAdmin,
    switchToStudent,
    canSwitchViews: isAdmin
  };
}