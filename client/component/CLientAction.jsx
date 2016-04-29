
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import * as Actions from './../actions.js';
import ClientActionList from './ClientActionList.jsx';
import RunStatus from './RunStatus.jsx';
import { Glyphicon } from 'react-bootstrap';

const ClientAction = ( { data, status, startAction, editAction } ) =>
  <div
    className="action"
    bsStyle={!!data.id ? 'default' : 'danger'}
    collapsible
  >
    <div className="header">
      <div className="title">{data.name}</div>
      <button
        onClick={() => startAction( { name: data.name, config: data.configClient } )}
      >
        <Glyphicon glyph={data.name === 'stop' ? 'stop' : 'play'} />
      </button>
      <button
        onClick={() => editAction( { name: data.name, config: data.configClient } )}
      >
        <Glyphicon glyph="list" />
      </button>
    </div>
    <div> {( status ? <RunStatus data={status} /> : '' )} </div>
  </div>
;

ClientAction.propTypes = {
  data: PropTypes.object.isRequired,
  status: PropTypes.object,
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
