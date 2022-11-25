import React, { useEffect, useState, useCallback } from 'react';

import { Link } from 'react-router-dom';

import axios from 'axios';
import debounce from 'lodash/debounce';

import Button from '@material-ui/core/Button';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Container from '@material-ui/core/Container';
import { DataGrid } from '@material-ui/data-grid';
import Typography from '@material-ui/core/Typography';
import { darken, makeStyles, withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Alert from '@material-ui/lab/Alert';

import ExpandableDataGridCell from './ExpandableDataGridCell';
import LoadingOverlay from './LoadingOverlay';
import SearchDatasets from './SearchDatasets';

import CancelIcon from '@material-ui/icons/Cancel';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: [[theme.spacing(8), theme.spacing(2), theme.spacing(2)]],
    height: "calc(100% - 48px)",
    display: "flex",
    flexDirection: "column"
  },
  gridContainer: {
    flex: 1,
    maxWidth: '2000px',
    minWidth: '900px',
    '& .deprecatedDataset': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[500],
      '&:hover': {
        backgroundColor: darken(theme.palette.grey[200], 0.1),
      },
    },
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  published: {
    display: 'flex',
    alignItems: 'center',
  },
  publishedCheck: {
    color: theme.palette.success.light,
    marginBottom: '4px',
    marginLeft: '4px',
  },
  searchWrapper: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '350px',
    marginRight: theme.spacing(2),
  },
  aboveTableWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureGridRoot: {
    flex: 1
  }
}));

const expandableCell = ({ value, colDef }) => (
    <ExpandableDataGridCell
      value={value}
      width={colDef.computedWidth}
    />
);

const columns = [
    {
      field: 'name',
      headerName: 'Name',
      renderCell: expandableCell,
      minWidth: 200,
      flex: 1,
      valueGetter: (params) => (
        params.getValue(params.id, 'deprecated')
          ? `DEPRECATED - ${params.row.name}` : params.row.name
      )
    },
    {
      field: 'id',
      headerName: 'ID',
      minWidth: 250,
      flex: 1,
    },
    {
      field: 'maintainer.name',
      headerName: 'Maintainer',
      minWidth: 140,
      flex: 1,
      valueGetter: (params) => params.row?.maintainer.name,
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      valueFormatter: (params) => (
        new Date(params.value).toLocaleDateString(
          'en-US',
          {
            timeZone: 'utc',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          },
        )
      ),
      minWidth: 140,
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      renderCell: expandableCell,
      minWidth: 200,
      flex: 1,
    },
    {
      field: 'link',
      headerName: ' ',
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) => (
        <Button
          href={`/dataset_summary?dataset=${row.id}`}
          variant="outlined"
        >
          View Dataset
        </Button>
      ),
      minWidth: 210,
    },
  ];

const isOverflown = (el) => el &&
      (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);

const FeatureTooltip = withStyles((theme) => ({
  root: {
  },
  tooltip: {
    fontSize: '0.9rem',
    backgroundColor: theme.palette.grey[50],
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    padding: "0.75rem"
  },
  textContainer: {
    overflow: "hidden",
    whitespace: "nowrap",
    textOverflow: "ellipsis"
  }
}))(({ classes, text }) => {
  const textContainerRef = React.useRef(null);

  const isCurrentlyOverflown = isOverflown(textContainerRef.current);

  return (
    <Tooltip
      placement="bottom-end"
      classes={{ tooltip: classes.tooltip }}
      title={text}
      enterNextDelay={400}
    >
      <span
        ref={textContainerRef}
        className={classes.textContainer}
        >
        {text}
      </span>
    </Tooltip>
  );
});

const featureColumns = [
    {
      field: 'name',
      headerName: 'Name',
      minWidth: 200,
      flex: 1
    },
    {
      field: 'display_name',
      headerName: 'Display Name',
      renderCell: ({ value }) => {
        return (
          <FeatureTooltip text={value} />
        );
      },
      minWidth: 200,
      flex: 1
    },
    {
      field: 'description',
      headerName: 'Description',
      renderCell: ({ value, colDef }) => {
        return (
          <FeatureTooltip text={value} />
        );
      },
      minWidth: 200,
      flex: 1
    },
    {
      field: 'owner_dataset_name',
      headerName: 'Dataset Name',
      valueGetter: (cell) => cell.row.owner_dataset.name,
      minWidth: 200,
      flex: 1
    },
    {
      field: 'link',
      headerName: ' ',
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) => (
        <Button
          component="a"
          href={`/dataset_summary?dataset=${row.owner_dataset.id}`}
          target="_blank"
          variant="outlined"
        >
          Parent Dataset
        </Button>
      ),
      minWidth: 210,
    }
  ];

const getDatasets = (setDatasets, setDatasetsError, setDatasetsLoading) => {
  // only do this for the first call to getDatasets, when we don't have a scrollId
  // so we don't show the full page spinner for every subsequent set of models
  setDatasetsLoading(true);

  // pass along a timestamp to ensure that our url is different every time
  // otherwise the browser may cache the request and we won't see updates if someone
  // deprecates their dataset and comes back to this page
  const url = `/api/dojo/indicators/latest?requestTime=${Date.now()}&include_features=true`;
  axios.get(url)
    .then((response) => {
      setDatasetsLoading(false);
      console.log(response.data);
      setDatasets(response.data);
    })
    .catch((error) => {
      console.log('error:', error);
      setDatasetsError(true);
    });
};

/**
 * Adapted from ViewModels.js::fetchModels
 */
const fetchFeatures = async (
  setFeatures, setFeaturesLoading, setFeaturesError, searchTerm, scrollId
) => {
  setFeaturesLoading(true);

  let url = `/api/dojo/features`;
  if (scrollId) {
    url += `?scroll_id=${scrollId}`;
  } else if (searchTerm) {
    url += `?term=${searchTerm}`;
  }

  const featuresRequest = axios.get(url).then(
    (response) => {
      const featuresData = response.data;
      return featuresData;
    }
  );

  let preparedFeatures = null;

  preparedFeatures = featuresRequest.then((featuresData) => {

    setFeatures((prev) => !scrollId ? featuresData.results : prev.concat(featuresData.results));

    return [featuresData.scroll_id, featuresData.results];
  });

  preparedFeatures.then(([ newScrollId, results ]) => {

    // when there's no scroll id, we've hit the end of the results
    if (newScrollId) {
      // if we get a scroll id back, there are more results
      // so call fetchModels again to fetch the next set
      fetchFeatures(setFeatures, setFeaturesLoading, setFeaturesError, searchTerm, newScrollId);
    } else {
      setFeaturesLoading(false);
    }
  });

  preparedFeatures.catch((error) => {
    console.log('error:', error);
    setFeaturesError(true);
  });
};

/**
 *
 */
function ViewDatasets() {
  const classes = useStyles();
  const [datasets, setDatasets] = useState([]);
  const [datasetsError, setDatasetsError] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [searchedDatasets, setSearchedDatasets] = useState(null);
  // false = hide deprecated datasets, true = show deprecated datasets
  const [displayDeprecated, setDisplayDeprecated] = useState(false);
  const [displayedDatasets, setDisplayedDatasets] = useState([]);

  // TODO probably move the features grid and related logic to its own file
  // TODO decide what to do with expanded cell, overflows, and table scrolling (popup disallows scrolling...)
  // TODO verify that features results are capped at 500... so that we don't keep fetching more scrolls if so
  // TODO if implement above, add text to explain to the user that they need to add more specific terms if they get to 500ish

  const [mode, setMode] = useState("datasets");

  const handleMode = (event, newMode) => {
    setMode(newMode);
  };

  const isModeDatasets = mode === "datasets";
  const isModeFeatures = mode === "features";

  const [featuresSearchTerm, setFeaturesSearchTerm] = useState('');
  const [featuresSearchTermValue, setFeaturesSearchTermValue] = useState('');

  const updateFeaturesSearchTerm = useCallback(debounce(setFeaturesSearchTerm, 500), []);

  const [features, setFeatures] = useState([]);
  const [featuresError, setFeaturesError] = useState(false);
  const [featuresLoading, setFeaturesLoading] = useState(false); // Loading unused for now.


  useEffect(() => {
      fetchFeatures(setFeatures, setFeaturesLoading, setFeaturesError, featuresSearchTerm);
  }, [featuresSearchTerm]);

  useEffect(() => {
    // only do this once when the page loads
    getDatasets(setDatasets, setDatasetsError, setDatasetsLoading);
    document.title = 'View Datasets - Dojo';
  }, []);

  useEffect(() => {
    // when we load our datasets
    if (datasets?.length) {
      // // filter out all the deprecated ones
      const filtered = datasets.filter((dataset) => (!dataset.deprecated));
      setDisplayedDatasets(filtered);
    }
  }, [datasets]);

  const clearFeaturesSearch = () => {
    setFeaturesSearchTerm('');
    setFeaturesSearchTermValue('');
  };

  const handleFeatureSearchChange = ({ target: { value } }) => {
    // if we have no search term, clear everything
    if (value.length === 0) {
      clearFeaturesSearch();
      return;
    }

    setFeaturesSearchTermValue(value);

    updateFeaturesSearchTerm(value);

  };

  if (datasetsLoading) {
    return <LoadingOverlay text="Loading Datasets" />;
  }

  if (datasetsError) {
    return (
      <LoadingOverlay
        text="There was an error loading the list of all datasets"
        error
      />
    );
  }

  const toggleDeprecatedDatasets = () => {
    if (displayDeprecated) {
      // we are currently showing the deprecated datasets, so filter them out
      const filtered = datasets.filter((dataset) => (!dataset.deprecated));
      setDisplayedDatasets(filtered);
      // and toggle the button state back
      setDisplayDeprecated(false);
    } else {
      // we want to show all the datasets
      setDisplayedDatasets(datasets);
      setDisplayDeprecated(true);
    }
  };

  return (
    <Container
      className={classes.root}
      component="main"
      maxWidth="xl"
    >
      <div style={{display: "flex", flexDirection: "column", width: "100%", flex: "1 0 100%"}}>
      <Typography
        className={classes.header}
        component="h3"
        variant="h4"
        align="center"
      >
        All Datasets & Features
      </Typography>

      <div style={{display: "flex", alignItems: "center"}}>
        <Typography variant="h6">
          Browse By
        </Typography>
        &nbsp;
        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={handleMode}
        >
          <ToggleButton value="datasets">
            Datasets
          </ToggleButton>
          <ToggleButton value="features">
            Features
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      <br />

        <div className={classes.gridContainer} style={{flex: 1, display: "flex", flexDirection: "column"}}>
        {isModeDatasets ? (
          <>
            <div className={classes.aboveTableWrapper}>
              <SearchDatasets
                setSearchedDatasets={setSearchedDatasets}
                datasets={displayedDatasets}
              />
              <Button
                component={Link}
                size="large"
                variant="outlined"
                color="primary"
                disableElevation
                to="/datasets/register"
              >
                Register a New Dataset
              </Button>
              <Button
                color="primary"
                disableElevation
                variant="outlined"
                size="large"
                onClick={toggleDeprecatedDatasets}
              >
                {displayDeprecated ? 'Hide Deprecated Datasets' : 'Show Deprecated Datasets'}
              </Button>
            </div>

            <DataGrid
              autoHeight
              columns={columns}
              rows={searchedDatasets !== null ? searchedDatasets : displayedDatasets}
              getRowClassName={
                (params) => params.getValue(params.id, 'deprecated') && 'deprecatedDataset'
              }
            />
          </>
        ) : featuresError ? (
          <Typography>
            Error loading features.
          </Typography>
        ) : (
          <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
            <div className={classes.aboveTableWrapper}>
              <TextField
                style={{
                  width: '400px',
                  marginRight: 16,
                }}
                label="Filter Features"
                variant="outlined"
                value={featuresSearchTermValue}
                onChange={handleFeatureSearchChange}
                role="searchbox"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={clearFeaturesSearch}><CancelIcon /></IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>
            <Alert
              variant="outlined"
              severity="info"
              style={{border: "none"}}
            >
              Click on a row, then CTRL+C or CMD+C to copy contents.
            </Alert>
            <DataGrid
              classes={{root: classes.featureGridRoot}}
              getRowId={(row) => `${row.dataset_id}-${row.name}`}
              columns={featureColumns}
              rows={features}
            />
          </div>
        )}
      </div>
    </div>
    </Container>
  );
}

export default ViewDatasets;


// <Typography style={{margin: "0.55rem 0", color: "gray", variant: "body2"}}>
// </Typography>
