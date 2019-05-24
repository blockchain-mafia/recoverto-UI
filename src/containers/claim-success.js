import React, { useState, useEffect } from 'react'
import styled from 'styled-components/macro'
import Textarea from 'react-textarea-autosize'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { useDataloader } from '../bootstrap/dataloader'

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 104px;
  background: #fff;
  border-radius: 20px; 
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 40px;
  color: #14213d;
  padding-bottom: 20px;
`

const SubTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  margin: 30px 0;
`

const Message = styled.div`
  font-family: Nunito;
  font-size: 30px;
  line-height: 41px;
  color: #000000;
  text-align: center;
  padding: 60px 0;
`

const Box = styled.div`
  font-family: Roboto;
  color: #444;
  background: #A6FFCB;
  border-radius: 5px;
  padding: 45px 0;
  font-size: 40px;
  text-align: center;
  margin-bottom: 60px;
`

const TitleBox = styled.div`
  font-weight: bold;
  font-size: 40px;
  line-height: 60px;
  color: #444;
  font-weight: bold;
`

const TypeBox = styled.div`
  font-size: 24px;
  color: #000000;
  line-height: 40px;
  padding: 10px 0;
  color: #444;
`

export default props => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const { useCacheCall } = useDrizzle()

  const { itemID, pk } = props

  const item = useCacheCall('Recover', 'items', itemID)

  const loadDescription = useDataloader.getDescription()

  if (item !== undefined && item.descriptionEncryptedLink !== undefined) {
    const metaEvidence = loadDescription(item.descriptionEncryptedLink, pk)
    if (metaEvidence)
      item.content = metaEvidence
  }

  return (
    <Container>
      <Title>Claim Saved</Title>
      <Message>
          Congratulations! Your claim is saved.
          <br />If the owner do not contact you soon, 
          <br />you can contact him:
        </Message>
      {item ? (
        <Box>
          <TitleBox>CONTACT OWNER</TitleBox>
          <TypeBox>{item.content ? item.content.dataDecrypted.contactInformation : '...'}</TypeBox>
        </Box>
      ) : (
        <Title>Loading Contact Information...</Title>
      )}
    </Container>
  )
}
