import React, { useContext, useState } from 'react';

import axios from 'axios';

import { Link, Redirect } from 'react-router-dom';

import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import { lighten, makeStyles } from '@material-ui/core/styles';

import { ThemeContext } from './ThemeContextProvider';
import { useAuth } from '../auth';

const useStyles = makeStyles((theme) => ({
  appBarRoot: {
    backgroundColor: lighten(theme.palette.primary.light, 0.6),
  },
  toolbar: {
    padding: [[0, theme.spacing(5)]],
    gap: theme.spacing(3),
  },
  dojoIcon: {
    height: '40px',
    width: '40px',
    marginRight: theme.spacing(1),
  },
  spacer: {
    flexGrow: 1,
  },
  userMenuPaper: {
    marginTop: theme.spacing(3),
    width: '160px',
  },
}));

const UserMenu = ({ user }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    axios.post('/api/dojo/auth/logout')
      // todo: add confirm logout
      .then(() => window.location.replace('/'));
      // todo: handle failure
  };

  return (
    <div>
      <Button
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
        size="small"
        startIcon={<AccountCircleIcon />}
      >
        {user}
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        classes={{ paper: classes.userMenuPaper }}
      >
        <MenuItem onClick={handleLogout}>
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
};

const NavBar = () => {
  const classes = useStyles();
  const { showNavBar } = useContext(ThemeContext);
  const { auth } = useAuth();

  if (!showNavBar) {
    return null;
  }

  return (
    <AppBar position="static" classes={{ root: classes.appBarRoot }}>
      <Toolbar variant="dense" disableGutters className={classes.toolbar}>
        <Tooltip title="Dojo home" arrow>
          <IconButton
            component={Link}
            to="/"
            size="small"
          >
            <img
              src="/assets/Dojo_Logo_black.svg"
              alt="Dojo Logo"
              className={classes.dojoIcon}
            />
          </IconButton>
        </Tooltip>
        {auth.isAuthenticated && (
          <>
            <Button
              component={Link}
              to="/models"
            >
              Models
            </Button>
            <Button
              component={Link}
              to="/datasets"
            >
              Datasets
            </Button>
            <Button
              component={Link}
              to="/runs"
            >
              Model Runs
            </Button>
          </>
        )}
        <span className={classes.spacer} />
        <Button href="https://www.dojo-modeling.com" target="_blank">Documentation</Button>
        <Button href="https://github.com/dojo-modeling/dojo" target="_blank">GitHub</Button>
        {(auth.isAuthenticated && auth.user) && (
          <UserMenu user={auth.user} />
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;