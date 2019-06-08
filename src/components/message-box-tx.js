import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'
import { BounceLoader } from 'react-spinners'

import etherscanBg from '../assets/images/etherscan-bg.png'

const Box = styled.div`
  display: flex;
  align-items: center;
  margin-top: 50px;
  color: #444;
  background-color: #a6ffcb;
  background-image: url(${etherscanBg});
  background-repeat: no-repeat;
  background-position: center;
  overflow: hidden;
  font-family: Roboto;
  padding: 0 40px;
  border-radius: 10px;
  font-size: 24px;
  height: 100px;
  overflow: hidden;
  &:hover {
    cursor: pointer;
  }
`

const MessageBoxTx = ({
  children,
  pending,
  ongoing,
  onClick,
  className,
  ...rest
}) => (
  <>
    {pending ? (
      <Box onClick={onClick}>
          <div style={{flexGrow: '1'}}>Transaction pending...</div>
          <div><BounceLoader size={50} color={'#fff'} /></div>
      </Box>
    ) : ongoing ? (
      <Box onClick={onClick}>
        <div style={{flexGrow: '1'}}>Transaction ongoing...</div>
        <div><BounceLoader size={50} color={'#fff'} /></div>
      </Box>
    ) : (
      <Box
          onClick={onClick}
          className={`MessageBox ${className}`}
          {...rest}
        >
          {children}
      </Box>
    )}
  </>
)

MessageBoxTx.propTypes = {
  // State

  // Handlers
  onClick: PropTypes.func,

  // Modifiers
  pending: PropTypes.bool,
  ongoing: PropTypes.bool,
  className: PropTypes.string
}

MessageBoxTx.defaultProps = {
  // Handlers
  onClick: null,

  // Modifiers
  pending: false,
  ongoing: false,
  className: ''
}

export default MessageBoxTx