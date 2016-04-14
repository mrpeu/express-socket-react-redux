
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import { ButtonGroup, Button, OverlayTrigger, Popover, Glyphicon } from 'react-bootstrap';

const ClientActionList = ( { data } ) =>
  <ButtonGroup className="action-list" vertical>{ data
    ? ( Array.isArray( data ) ? data : [ data ] ).map(
      act =>
        <ButtonGroup className="action" key={ act.name }
          style={{ display: 'flex', border: 0 }}
        >
          <Button bsSize="small" className="action-title">
            <Glyphicon glyph="play" />
            <span style={ { paddingLeft: '1em' } }>{ act.name }</span>
          </Button>
          { act.doc ? <OverlayTrigger
            trigger="click" placement="left"
            overlay={
              <Popover title={ act.name } id={ act.name }>
              { act.doc ? <Markdown data={ act.doc } /> : 'no doc' }
              </Popover>
            }
          >
            <Button bsSize="small" className="action-info" >
              <Glyphicon glyph="info-sign" />
            </Button>
          </OverlayTrigger> : null }
        </ButtonGroup>
    )
    : 'No action advertised'
  }
  </ButtonGroup>
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
