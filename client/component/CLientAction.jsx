
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientActionList from './ClientActionList.jsx';

const ClientAction = ( { data } ) =>
  <div className="run-status">

  </div>
;

ClientAction.propTypes = {
  data: PropTypes.object.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( { } );

// Connected Component:
export default connect(
  mapStateToProps
)( ClientAction );
