import React, { Component, useCallback, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'
import { BounceLoader } from 'react-spinners'
import ReactToPrint from 'react-to-print'
import Web3 from 'web3'

import { useDrizzle } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 104px;
  background: #fff;
  border-radius: 20px; 
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
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

const Label = styled.div`
  margin-top: 24px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 200;
  font-size: 16px;
  line-height: 19px;
  color: #5C5C5C;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`

const StyledPrint = styled.div`
  display: none;
  @media print {
    display: block;
    margin: 40px;
  }
`

class ComponentToPrint extends Component {
  render() {
    return (
      <StyledPrint>
        <QRCode
          value={`https://app.recover.to/contract/${this.props.contract}/items/${
            this.props.itemID_Pk
          }`}
        />
      </StyledPrint>
    )
  }
}

export default props => {
  const componentRef = useRef()
  const { useCacheCall, useCacheSend } = useDrizzle()

  const { send: sendAcceptClaim, status: statusAcceptClaim } = useCacheSend(
    'Recover',
    'acceptClaim'
  )
  const { send: sendPay, status: statusPay } = useCacheSend('Recover', 'pay')
  const { send: sendReimburse, status: statusReimburse } = useCacheSend('Recover', 'reimburse')
  const { send: sendPayArbitrationFeeByOwner, status: statusPayArbitrationFeeByOwner } = useCacheSend(
    'Recover',
    'payArbitrationFeeByOwner'
  )
  const { send: sendPayArbitrationFeeByFinder, status: statusPayArbitrationFeeByFinder } = useCacheSend(
    'Recover',
    'payArbitrationFeeByFinder'
  )

  const [itemIDHex, privateKey] = props.itemID_Pk.split('-privateKey=')

  const itemID = itemIDHex.replace(/0+$/, '')

  const item = useCacheCall('Recover', 'items', itemID)

  // TODO: get the arbitratorExtraData
  // const arbitratorExtraData = useCacheCall('Recover', 'arbitratorExtraData')
  // const arbitrationCost = useCacheCall('Arbitrator', 'arbitrationCost', arbitratorExtraData)

  const claimIDs = useCacheCall('Recover', 'getClaimsByItemID', itemID)

  const loadDescription = useDataloader.getDescription()

  if (item !== undefined && item.descriptionEncryptedLink !== undefined) {
    const metaEvidence = loadDescription(item.descriptionEncryptedLink, privateKey)
    if (metaEvidence)
      item.content = metaEvidence
  }

  const claims = useCacheCall(['Recover'], call =>
    claimIDs
      ? claimIDs.reduce(
          (acc, d) => {
            const claim = call('Recover', 'claims', d)
            if(claim)
              acc.data.push({ ...claim, ID: d })
              // TODO: decrypt details information
            return acc
          },
          {
            data: [],
            loading: false
          }
        )
      : { loading: true }
  )

  return (
    <Container>
      {item ? (
        <>
          <Title>{item.content ? item.content.dataDecrypted.type : 'Item'}</Title>
          <Label>Description</Label>
          <div style={{padding: '10px 0'}}>{item.content ? item.content.dataDecrypted.description : '...'}</div>
          <Label>Contact Information</Label>
          <div style={{padding: '10px 0'}}>{item.content ? item.content.dataDecrypted.contactInformation : '...'}</div>
          <Label>Reward</Label>
          <div style={{padding: '10px 0'}}>{
              ETHAmount({amount: item.rewardAmount, decimals: 2})
            } ETH
          </div>
          <SubTitle>Qr code</SubTitle>
          <div style={{textAlign: 'center'}}>
            <QRCode
              value={`https://app.recover.to/contract/${props.contract}/items/${
                props.itemID_Pk
              }`}
            />
            <ReactToPrint
              trigger={() => <div style={{paddingTop: '20px'}}><button>Print Qr Code</button></div>}
              content={() => componentRef.current}
            />
            <ComponentToPrint contract={props.contract} itemID_Pk={props.itemID_Pk} ref={componentRef} />
          </div>
        </>
      ) : (
        <Title>Loading Item...</Title>
      )}
      <SubTitle>List Claims</SubTitle>
      {/* TODO: only if the drizzle account is the owner */}
      {
        !claims.loading && claims.data.map(claim => (
          <div key={claim.ID}>
            <p style={{padding: '10px 0'}}>ID: {claim && claim.ID}</p>
            <p style={{padding: '10px 0'}}>Finder: {claim && claim.finder}</p>
            <p style={{padding: '10px 0 40px 0'}}>Description: {claim && claim.descriptionLink}</p>

            {claim && item && item.rewardAmount && (
              <button
                style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}}
                onClick={() =>
                  sendAcceptClaim(itemID, claim.ID, {
                    value: item.rewardAmount
                  })
                }
              >
                Accept Claim
              </button>
            )}

            {' '}

            {item && item.amountLocked > 0 && (
              <button style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}} onClick={() => sendPay(itemID, item.amountLocked)}>
                Pay the finder
              </button>
            )}
            {item && item.amountLocked > 0 && (
              <button style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}} onClick={() => sendPayArbitrationFeeByOwner(itemID, item.amountLocked)}>
                Pay the finder {item.amountLocked}
              </button>
            )}
          </div>
        ))
      }
      {!claims.loading && claims.data.length === 0 && 'No claim'}
    </Container>
  )
}
