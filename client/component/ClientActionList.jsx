
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';

const ClientActionList = ( { data } ) =>
  <div className="action-list">{ data
    ? data.map( act => <div className="subtle">{ act }</div> )
    : 'No action advertised'
  }</div>
;

ClientActionList.propTypes = {
  data: PropTypes.array.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Map Redux actions to component props
const mapDispatchToProps = ( dispatch ) => ( {} );

// Connected Component:
export default connect(
  mapStateToProps,
  mapDispatchToProps
)( ClientActionList );
