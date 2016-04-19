
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import { ButtonGroup, Button, OverlayTrigger, Tooltip, Glyphicon } from 'react-bootstrap';

const ClientActionList = ( { data, startAction } ) =>
  <ButtonGroup className="action-list" vertical>{ data
    ? ( Array.isArray( data ) ? data : [ data ] ).map(
      act => {
        const btn = (
          <Button bsSize="small" className="action"
            onClick={ () => startAction( { name: act.name } ) }
          >
            <Glyphicon glyph="play" />
            <span style={ { paddingLeft: '1em' } }>{ act.name }</span>
          </Button>
        );

        return act.doc ? (
          <OverlayTrigger key={ act.id || act.name }
            placement="top" delayShow={ 2000 } delayHide={500}
            overlay={
              <Tooltip title={ act.name } id={ act.name }>
              { act.doc ? <Markdown data={ act.doc } /> : 'no doc' }
              </Tooltip>
            }
          >
          { btn }
          </OverlayTrigger>
        ) : (
          { btn }
        );
      }
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
