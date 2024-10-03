import React, { useState, useRef, useEffect } from 'react';

import SnackbarContext from '../contects/SnackbarContext';

const SnackbarProvider = (props) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const timerRef = useRef(null); // Store timer reference

  const closeSnackbar = () => {
    clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const openSnackbar = (msg, error = false) => {
    setIsError(error);
    setMessage(msg);
    setIsOpen(true);
    // Clear any existing timers before setting a new one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set a new timer for 5 seconds
    timerRef.current = setTimeout(() => {
      closeSnackbar();
    }, 5000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <SnackbarContext.Provider
      value={{
        message,
        isOpen,
        openSnackbar,
        closeSnackbar,
        isError,
      }}
    >
      {props.children}
    </SnackbarContext.Provider>
  );
};

export default SnackbarProvider;