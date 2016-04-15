
import React, { Component, PropTypes } from 'react';
import { Provider, connect } from 'react-redux';
import Markdown from './Markdown.jsx';
import { ButtonGroup, Button, OverlayTrigger, Popover, Glyphicon } from 'react-bootstrap';

const ClientActionList = ( { data, startAction } ) =>
  <ButtonGroup className="action-list" vertical>{ data
    ? ( Array.isArray( data ) ? data : [ data ] ).map(
      act => {
        const buttonInfo = act.doc ? (
          <Button bsSize="small" className="action-info" >
            <Glyphicon glyph="info-sign" />
          </Button>
        ) : (
          <OverlayTrigger
            trigger="click" placement="left"
            overlay={
              <Popover title={ act.name } id={ act.name }>
              { act.doc ? <Markdown data={ act.doc } /> : 'no doc' }
              </Popover>
            }
          >
            <Button bsSize="small" className="action-info" disabled >
              <Glyphicon glyph="info-sign" />
            </Button>
          </OverlayTrigger>
        );

        return (
          <ButtonGroup className="action" key={ act.name }
            style={{ display: 'flex', border: 0 }}
            onClick={ () => startAction( { name: act.name } ) }
          >
            <Button bsSize="small" className="action-title">
              <Glyphicon glyph="play" />
              <span style={ { paddingLeft: '1em' } }>{ act.name }</span>
            </Button>

            { buttonInfo }

          </ButtonGroup>
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
