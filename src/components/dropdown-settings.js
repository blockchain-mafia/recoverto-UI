import React from 'react'
import PropTypes from 'prop-types'

// TODO: need to be finalize (style, actions)
const DropdownSettings = ({
  children,
  links,
  disabled,
  ...rest
}) => (
  <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...rest}
    >
      {children}
  </button>
)

DropdownSettings.propTypes = {
  // State
  children: PropTypes.node.isRequired,

  // Handlers

  // Modifiers
  disabled: PropTypes.bool,
  actions: PropTypes.array
}

DropdownSettings.defaultProps = {
  // Handlers

  // Modifiers
  disabled: false,
  actions: []
}

export default DropdownSettings