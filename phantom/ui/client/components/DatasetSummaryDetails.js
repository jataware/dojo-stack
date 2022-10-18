import React from 'react';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grid from '@material-ui/core/Grid';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';

import CollapseText from './CollapseText';
import CountryMap from './CountryMap';
import CSVDownload from './CSVDownload';

const useStyles = makeStyles((theme) => ({
  detailsPanel: {
    padding: theme.spacing(2),
  },
  subsection: {
    marginLeft: theme.spacing(1),
  },
  modelHeader: {
    fontWeight: 'bold',
    padding: theme.spacing(1),
    textAlign: 'center',

  },
  tablePanel: {
    align: 'center',
    padding: theme.spacing(2),
  },
  buttonWrapper: {
    marginLeft: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

const options = ['Long','Wide'];

function DatasetSummaryDetails({ dataset }) {
  const classes = useStyles();
  const [wideFormat, setWideFormat] = React.useState("false");
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
   
    if(index==1){
        setWideFormat("true")
    }else{
        setWideFormat("false")    
    }

    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };
  // no need to spread the following out onto a million lines
  /* eslint-disable react/jsx-one-expression-per-line */
  return (
    <Grid container>
      <Grid item xs={4}>
        <div className={classes.detailsPanel}>

          <Typography variant="subtitle1" className={classes.modelHeader}>
            Overview
          </Typography>
          <Typography variant="body2" className={classes.subsection}>
            <b> Name:</b> {dataset.name}
          </Typography>
          <Typography component="div" variant="body2" className={classes.subsection}>
            <div style={{ maxWidth: '300px' }}>
              <b>  Website: </b>
              <CollapseText childrenText={dataset.maintainer?.website} collapsedSize={20} />
            </div>
          </Typography>
          <Typography variant="body2" className={classes.subsection}>
            <b>  Family: </b> {dataset.family_name}
          </Typography>

          <Typography component="div" variant="body2" className={classes.subsection}>
            <b> Description: </b>
            <CollapseText childrenText={dataset.description} collapsedSize={40} />
          </Typography>
          <Typography variant="body2" className={classes.subsection}>
            <b> Created Date: </b> {new Date(dataset.created_at).toLocaleDateString()}
          </Typography>

          <Typography variant="body2" className={classes.subsection}>
            <b> ID: </b> {dataset.id}
          </Typography>
          <br />
          <Typography variant="body2" className={classes.buttonWrapper}>
            <Button
              variant="outlined"
              color="primary"
              href={`${process.env.CAUSEMOS_UI_URL}/#/dataset/${dataset.id}/datasetOverview`}
              target="_blank"
              rel="noopener"
            >
              View In Causemos
            </Button>
          </Typography>
          <Typography component={'span'} variant="body2" className={classes.buttonWrapper}>

            <ButtonGroup variant="outlined" color="primary" ref={anchorRef} aria-label="split button">
            <CSVDownload resource={dataset} wideFormat={wideFormat} />

            <Button
              variant="outlined"
              color="primary"
              aria-controls={open ? 'split-button-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-label="select merge strategy"
              aria-haspopup="menu"
              onClick={handleToggle}
            >
              <ArrowDropDownIcon />
            </Button>
            <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList id="split-button-menu">
                      {options.map((option, index) => (
                        <MenuItem
                          key={option}
                          disabled={index === 2}
                          selected={index === selectedIndex}
                          onClick={(event) => handleMenuItemClick(event, index)}
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
          </ButtonGroup>
        </Typography>
        </div>
      </Grid>
      <Grid className={classes.detailsPanel} item xs={3}>
        <Typography variant="subtitle1" className={classes.modelHeader}>
          Maintainer
        </Typography>
        <Typography variant="body2" className={classes.subsection}>
          <b>  Name: </b> {dataset.maintainer?.name}
        </Typography>
        <Typography variant="body2" className={classes.subsection}>
          <b>  Email: </b>  {dataset.maintainer?.email}
        </Typography>
        <Typography variant="body2" className={classes.subsection}>
          <b>  Organization: </b> {dataset.maintainer?.organization}
        </Typography>
        <Typography variant="subtitle1" className={classes.modelHeader}>
          <b>  Categories </b>
        </Typography>
        <Typography variant="body2" className={classes.subsection}>
          {dataset.category?.join(', ')}
        </Typography>

      </Grid>

      <Grid className={classes.tablePanel} item xs={5}>
        <Typography variant="subtitle1" className={classes.modelHeader}>
          Geography
        </Typography>
        <CountryMap dataset={dataset} />
      </Grid>
    </Grid>

  );
}

export default DatasetSummaryDetails;
