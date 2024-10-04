import { useContext } from 'react';

import SnackbarContext from '../context/SnackbarContext';

const useSnackbar = () => {
  const { message, isOpen, openSnackbar, closeSnackbar, isError } = useContext(SnackbarContext);

  return {
    message,
    isOpen,
    openSnackbar,
    closeSnackbar,
    isError,
    openErrorSnackbar: (message) => openSnackbar(message, true),
  };
};

export default useSnackbar;
