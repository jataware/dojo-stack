import React, { useEffect, useState } from 'react';

import CancelIcon from '@material-ui/icons/Cancel';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

import Fuse from 'fuse.js';

import BasicAlert from './BasicAlert';

const useStyles = makeStyles((theme) => ({
  searchWrapper: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '400px',
    marginRight: theme.spacing(2),
  },
}));

// the list of model attributes we want to search on
const fuseKeys = [
  'category',
  'commit_message',
  'description',
  'domains',
  'family_name',
  'geography.country',
  'geography.admin1',
  'geography.admin2',
  'geography.admin3',
  'id',
  'maintainer.name',
  'maintainer.email',
  'maintainer.organization',
  'name',
];

const SearchModels = ({ setSearchedModels, models }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alert, setAlert] = useState({
    severity: 'warning',
    message: ''
  });

  const classes = useStyles();

  useEffect(() => {
    // define this inside the useEffect to ensure stability
    const handleSearch = () => {
      // define our fuse options
      const options = {
        keys: fuseKeys,
        // basically just exact string matching
        threshold: 0.1,
        // search anywhere in the strings
        ignoreLocation: true,
      };

      const fuse = new Fuse(models, options);

      const results = fuse.search(searchTerm);

      // we don't need all the fuse stuff, so just parse out the models
      const parsedResults = results.map((model) => model.item);

      // and pass them back to ViewModels
      setSearchedModels(parsedResults);
      // unless we get nothing back, then show the alert
      if (parsedResults.length === 0) {
        setAlert({
          severity: 'warning',
          message: `No results found for ${searchTerm}`,
        });
        setAlertVisible(true);
      }
    };

    // simple pseudo-debounce to prevent searches on every keystroke
    let debounceSearch;
    // only search if we have a search term
    if (searchTerm.length) {
      // create a timeout
      debounceSearch = setTimeout(() => {
        handleSearch();
      }, 300);
    }

    // cancel the timeout if we get back here before it has executed
    return () => clearTimeout(debounceSearch);
  }, [searchTerm, models, setSearchedModels]);

  const clearSearch = () => {
    setSearchTerm('');
    // if ViewModels gets null it will show the entire list, otherwise it'll show no rows
    // this way we can tell it whether to show searched models or the default returned ones
    setSearchedModels(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);

    // if we have no search term, clear everything
    if (event.target.value.length === 0) {
      clearSearch();
    }
  };

  return (
    <div className={classes.searchWrapper}>
      <TextField
        className={classes.searchInput}
        label="Filter Models"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={clearSearch}><CancelIcon /></IconButton>
            </InputAdornment>
          )
        }}
      />
      <BasicAlert
        alert={alert}
        visible={alertVisible}
        setVisible={setAlertVisible}
      />
    </div>
  );
};

export default SearchModels;
