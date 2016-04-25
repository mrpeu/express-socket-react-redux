
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';

const RunStatus = ( { data } ) =>
  <div className="run-status">
    <span style={ { color: '#57B' } }>
      { `${data.value}/${data.total}` }
    </span>
    <span style={ { padding: '0 .5em' } }>
      {data.name}
    </span>
    <span className="subtle">
      {data.state}
    </span>
    <div className="progress-bg">
      <div className="progress-bar" style={ {
        width: !data.runs ?
          `${100 / data.total * data.value}%` :
          `${100 /
            data.runs.reduce( ( t, r ) => t + r.total, 0 )
            *
            data.runs.reduce( ( t, r ) => t + r.value, 0 )
          }%`
      } }
      >&nbsp;</div>
    </div>
    { data.runs
      ? data.runs.map( r => <RunStatus key={ r.id } data={ r } /> )
      : null
    }
  </div>
;

RunStatus.propTypes = {
  data: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( { } );

// Connected Component:
export default connect(
  mapStateToProps
)( RunStatus );
