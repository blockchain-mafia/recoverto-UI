import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'
import { navigate } from '@reach/router'

import { ReactComponent as Plus } from '../assets/images/plus.svg'

const Item = styled.div`
  color: #14213d;
  background: #fff;
  overflow: hidden;
  font-family: Nunito;
  padding 47px 44px 0 44px;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-family: Nunito;
  font-size: 16px;
  &:hover {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    transform: translate(0, -5px);
  }
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
  &:hover {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    transform: translate(0, -5px);
  }
`

const ItemTitle = styled.div`
  padding: 67px 0 35px 0;
`

const CardItem = ({
  children,
  newItem,
  loadingItem,
  encrypted,
  onClick,
  status,
  className,
  network,
  ...rest
}) => (
  <>
    {newItem ? (
      <ItemNew onClick={() => navigate(`/network/${network}/new/items/undefined/pk/undefined`)}>
        <ItemTitle>Add Item</ItemTitle>
        <div>
          <Plus />
        </div>
      </ItemNew>
    ) : loadingItem ? (
      <Item>Loading...</Item>
    ) : (
      <Item onClick={onClick} className={`CardItem ${className}`} {...rest}>
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
  encrypted: PropTypes.bool,
  network: PropTypes.string
}

CardItem.defaultProps = {
  // Handlers
  onClick: null,

  // Modifiers
  newItem: false,
  className: '',
  encrypted: true,
  network: 'mainnet'
}

export default CardItem
