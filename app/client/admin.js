import React, {
  useEffect, useState, useRef
} from 'react';

import { useHistory } from 'react-router-dom';

import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

const Admin = () => {
  const history = useHistory();
  const [containers, setContainers] = React.useState([]);

  const refreshContainers = async () => {
    const resp = await fetch('/api/containers');
    setContainers(await resp.json());
  };

  useEffect(async () => {
    await refreshContainers();
  }, []);

  const style = {
    paper: {
      textAlign: 'center',
      margin: '20px',
      padding: '20px'
    }
  };

  const destroyContainer = async (id) => {
    await fetch(`api/shutdown/container/${id}`, { method: 'DELETE' });
    await refreshContainers();
  };

  const clearHistory = () => {
    localStorage.setItem('historyItems', JSON.stringify([]));
  };

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid container justify="center">
            <Grid item xs={4}>
              <Paper style={style.paper}>
                <Button variant="contained" color="primary" onClick={clearHistory}>
                  Clear History
                </Button>
              </Paper>
            </Grid>
          </Grid>
          <Grid container justify="center">
            <Grid item xs={6}>
              <Paper style={style.paper}>
                {containers.map((v) => (
                  <div style={{ textAlign: 'left' }}>
                    <div>
                      {v.Id}
                    </div>
                    <div>
                      {v.Names}
                    </div>
                    <div>
                      {v.Image}
                    </div>
                    <Button variant="contained" color="primary" onClick={() => { destroyContainer(v.Id); }}>
                      Destroy Container
                    </Button>
                  </div>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Admin;
