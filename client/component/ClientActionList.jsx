
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import { ButtonGroup, Button, OverlayTrigger, Tooltip, Glyphicon } from 'react-bootstrap';

const ClientActionList = ( { data, startAction } ) =>
  <ButtonGroup className="action-list" vertical>{ data
    ? ( Array.isArray( data ) ? data : [ data ] ).map(
      act => (
        <OverlayTrigger key={ act.id }
          placement="top" delayShow={ 2000 } delayHide={500}
          overlay={
            <Tooltip title={ act.name } id={ act.name }>
              { act.doc ? <Markdown data={ act.doc } /> : 'no doc' }
            </Tooltip>
          }
        >
          <Button bsSize="small" className="action" key={ act.id }
            onClick={ () => startAction( { name: act.name } ) }
          >
            <Glyphicon glyph={ act.name === 'stop' ? 'stop' : 'play' } />
            <span className="title">{ act.name }</span>
          </Button>
        </OverlayTrigger>
      )
    )
    : 'No action advertised'
  }
  </ButtonGroup>
;

ClientActionList.propTypes = {
  data: PropTypes.array.isRequired,
  startAction: PropTypes.func.isRequired
};

// Map Redux state to component props
const mapStateToProps = state => state;

// Connected Component:
export default connect(
  mapStateToProps
)( ClientActionList );
