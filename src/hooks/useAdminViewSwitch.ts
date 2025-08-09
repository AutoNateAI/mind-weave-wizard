import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useAdminViewSwitch() {
  const { user } = useAuth();
  const [isStudentView, setIsStudentView] = useState(false);
  
  const isAdmin = user?.email === 'admin@gmail.com';
  
  const toggleView = useCallback(() => {
    if (!isAdmin) return;
    setIsStudentView(prev => !prev);
  }, [isAdmin]);

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