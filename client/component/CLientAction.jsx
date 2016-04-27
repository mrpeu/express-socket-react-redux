
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientActionList from './ClientActionList.jsx';
import { Button, Glyphicon } from 'react-bootstrap';

const ClientAction = ( { data, startAction, editAction } ) =>
  <div className="action">
    <Button
      onClick={ () => startAction( { name: data.name, config: data.configClient } ) }
    >
      <Glyphicon glyph={ data.name === 'stop' ? 'stop' : 'play' } />
      <span className="title">{ data.name }</span>
    </Button>
    <Button onClick={ () =>
      editAction( { name: data.name, config: data.configClient } ) }
    > cfg
      <Glyphicon glyph="list" />
    </Button>
    <div className="run-status">

    </div>
  </div>
;

ClientAction.propTypes = {
  data: PropTypes.object.isRequired,
  startAction: PropTypes.func.isRequired,
  editAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => ( {
  ...state,
  editAction: ( act ) => {
    console.warn( '//todo: editAction', act );
  }
} );

// Connected Component:
export default connect(
  mapStateToProps
)( ClientAction );
