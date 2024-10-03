import React from 'react';

const SnackbarContext = React.createContext({
  isError: false,
  message: '',
  isOpen: false,
  openSnackbar: () => null,
  closeSnackbar: () => null,
});

export default SnackbarContext;
