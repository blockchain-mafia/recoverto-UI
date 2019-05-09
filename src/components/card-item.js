import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

import { ReactComponent as Plus } from '../assets/images/plus.svg'

const Item = styled.div`
  border-radius: 3px;
  color: #4a4a4a;
  background: #fff;
  overflow: hidden;
`

const ItemNew = styled.div`
  background: rgba(255, 255, 255, 0.53);
  border: 7px solid rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
  border-style: dashed;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-family: Nunito;
  font-weight: 600;
  font-size: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
`

const CardItem = ({
  children,
  newItem,
  encrypted,
  onClick,
  status,
  className,
  ...rest
}) => (
  <>
    {newItem ? (
      <ItemNew>
        <div style={{padding: '67px 0 35px 0'}}>Add Item</div>
        <div><Plus /></div>
      </ItemNew>
    ) : (
      <Item
          onClick={onClick}
          className={`CardItem ${className}`}
          {...rest}
        >
          {children}
      </Item>
    )}
  </>
)

CardItem.propTypes = {
  // State

  // Handlers
  onClick: PropTypes.func,

  // Modifiers
  newItem: PropTypes.bool,
  className: PropTypes.string,
  encrypted: PropTypes.bool
}

CardItem.defaultProps = {
  // Handlers
  onClick: null,

  // Modifiers
  newItem: false,
  className: '',
  encrypted: true
}

export default CardItem