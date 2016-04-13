
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
        width: `${100 / data.total * data.value}%`
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

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( RunStatus );
