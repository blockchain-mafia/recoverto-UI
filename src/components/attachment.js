import React from 'react'
import PropTypes from 'prop-types'
import isImage from 'is-image'
import isTextPath from 'is-text-path'
import isVideo from 'is-video'
import styled from 'styled-components/macro'

import { ReactComponent as Document } from '../assets/images/document.svg'
import { ReactComponent as Image } from '../assets/images/image.svg'
import { ReactComponent as Link } from '../assets/images/link.svg'
import { ReactComponent as Video } from '../assets/images/video.svg'

const StyledAttachment = styled.div`
  padding-right: 10px;
`

const Attachment = ({
  URI,
  description = '',
  title = ''
}) => {
  const extension = `.${URI.split('.').pop()}`
  let Component
  if (!URI || isTextPath(extension)) Component = Document
  else if (isImage(extension)) Component = Image
  else if (isVideo(extension)) Component = Video
  else Component = Link
  Component = <Component />
  return (
    <StyledAttachment>
      <span 
        className="info"
        aria-label={`${title}: ${description}`}
      >
        {URI ? (
          <a
            href={URI.replace(/^ipfs\//, 'https://ipfs.kleros.io/ipfs/')}
            rel="noopener noreferrer"
            target="_blank"

          >
            {Component}
          </a>
        ) : (
          Component
        )}
      </span>
    </StyledAttachment>
  )
}

Attachment.propTypes = {
  URI: PropTypes.string,
  description: PropTypes.string.isRequired,
  extension: PropTypes.string,
  previewURI: PropTypes.string,
  title: PropTypes.string.isRequired
}

Attachment.defaultProps = {
  URI: null,
  extension: null,
  previewURI: null
}

export default Attachment