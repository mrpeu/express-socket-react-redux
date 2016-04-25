
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import { ButtonToolbar, ButtonGroup, Button, Glyphicon } from 'react-bootstrap';

// <Markdown data={ act.doc } />

const ClientActionList = ( { data, startAction, editAction } ) =>
  <ButtonToolbar className="action-list" vertical>{ data
    ? ( Array.isArray( data ) ? data : [ data ] ).map(
      act => (
        <ButtonGroup key={ act.id } bsSize="small" className="actionTODO" key={ act.id }>
          <Button
            onClick={ () => startAction( { name: act.name, config: act.configClient } ) }
          >
            <Glyphicon glyph={ act.name === 'stop' ? 'stop' : 'play' } />
            <span className="title">{ act.name }</span>
          </Button>
          <Button
            onClick={ () => editAction( { name: act.name, config: act.configClient } ) }
          >
            <Glyphicon glyph="list" />
          </Button>
        </ButtonGroup>
      )
    )
    : 'No action advertised'
  }
  </ButtonToolbar>
;

ClientActionList.propTypes = {
  data: PropTypes.array.isRequired,
  startAction: PropTypes.func.isRequired,
  editAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Connected Component:
export default connect(
  mapStateToProps
)( ClientActionList );
