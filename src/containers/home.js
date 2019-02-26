import React from 'react'
import styled from 'styled-components/macro'
import { version } from '../../package.json'

const StyledImg = styled.img`
  max-width: 90%;
`
export default () => (
  <>
    <p>Hello</p>
    <p>{version}</p>
  </>
)
