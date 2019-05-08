import React from 'react'
import PropTypes from 'prop-types'

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
      <>New</>
    ) : (
      <div
          onClick={onClick}
          className={`CardItem ${className}`}
          {...rest}
        >
          {children}
      </div>
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