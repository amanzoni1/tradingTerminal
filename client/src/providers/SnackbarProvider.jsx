import React, { useState } from 'react';

import SnackbarContext from '../contects/SnackbarContext';

const SnackbarProvider = (props) => {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  let timer;

  const closeSnackbar = () => {
    clearTimeout(timer);
    setIsOpen(false);
  };

  const openSnackbar = (msg, error = false) => {
    setIsError(error);
    setMessage(msg);
    setIsOpen(true);
    timer = setTimeout(closeSnackbar, 4000); 
  };

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
