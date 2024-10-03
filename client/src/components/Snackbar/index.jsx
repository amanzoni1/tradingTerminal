import React from 'react';

import useSnackbar from '../../hooks/useSnackbar';
import classes from './Snackbar.module.css';

const Snackbar = () => {
  const { isOpen, message, isError } = useSnackbar();

  return (
    <div className={`${isError ? classes.snackbarError : classes.snackbar} ${isOpen ? classes.snackbarOpen : ''}`}>
      {message}
    </div>
  );
};
export default Snackbar;
