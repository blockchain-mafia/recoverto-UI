import React, { Component, useCallback, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'
import { BounceLoader } from 'react-spinners'
import ReactToPrint from 'react-to-print'
import Web3 from 'web3'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownDivider
} from 'styled-dropdown-component'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import { ReactComponent as Settings } from '../assets/images/settings-orange.svg'

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

const StyledNoClaim = styled.div`
  background: #efefef;
  border-radius: 10px;
  text-align: center;
  font-family: Nunito;
  font-style: normal;
  font-weight: 300;
  font-size: 20px;
  line-height: 70px;
  color: #777777;
  cursor: not-allowed;
`

const StyledClaimBoxContainer = styled.div`
  padding-top: 4vw;
  background: #ffc282;
  border-radius: 10px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 300;
  font-size: 20px;
  line-height: 20px;
  color: #777;
`

const StyledClaimAddressContainerBoxContent = styled.div`
  display: flex;
  flex-direction: row;
  padding:  0 4vw;
`

const StyledClaimDescriptionContainerBoxContent = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  padding:  0 4vw;
`

const StyledButtonClaimBox = styled.div`
  margin-top: 30px;
  width: 100%;
  color: #fff;
  background: #ff8300;
  border-radius: 0px 0px 10px 10px;
  font-family: Nunito;
  font-style: normal;
  font-weight: 600;
  font-size: 20px;
  line-height: 68px;
  text-align: center;
  cursor: pointer;
  &:hover {
    background: #a6ffcb;
    color: #444;
  }
`

const StyledClaimLabelBoxContent = styled.div`
  font-family: Roboto;
  font-weight: 300;
  font-size: 18px;
  line-height: 30px;
  color: #444;
`

const StyledClaimAddressBoxContent = styled.div`
  padding-left: 1vw;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-family: Nunito;
  font-weight: 600;
  font-size: 20px;
  color: #191847;
  line-height: 30px;
`

const StyledClaimDescriptionBoxContent = styled.div`
  margin-top: 10px;
  font-family: Nunito;
  font-weight: 600;
  font-size: 20px;
  color: #191847;
`

const DropdownStyled = styled(Dropdown)`
  float: right;
  right: 20px;
  top: 10px;
`

const StyledSettings = styled(Settings)`
  padding: 10px;
  border-radius: 50%;
  &:hover {
    cursor: pointer;
    background: #fff;
  }
`

const DropdownMenuStyled = styled(DropdownMenu)`
  float: right;
  left: auto;
  right: 0;
`

const DropdownItemStyled = styled(DropdownItem)`
  line-height: 24px;
  &:hover {
    cursor: pointer;
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
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [dropdownHidden, setDropdownHidden] = useState(true)
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x00'
  }))

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

  const itemID = props.itemID
  const privateKey = recover[itemID] ? recover[itemID].privateKey : null

  const item = useCacheCall('Recover', 'items', itemID.padEnd(66, '0'))

  const arbitratorExtraData = useCacheCall('Recover', 'arbitratorExtraData')

  const arbitrationCost = useCacheCall(
    'KlerosLiquid', 
    'arbitrationCost',
    (arbitratorExtraData || '0x00')
  )

  const claimIDs = useCacheCall('Recover', 'getClaimsByItemID', itemID.padEnd(66, '0'))

  const loadDescription = useDataloader.getDescription()

  if (
    item !== undefined 
    && item.descriptionEncryptedLink !== undefined
    && privateKey
  ) {
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
              value={
                `https://app.recover.to/contract/${props.contract}/items/
                ${itemID}-privateKey=${privateKey}`}
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
      {/* TODO: only if the drizzle account is the owner */}
      {/* TODO: move this sewction in the top section to have the loading */}
      {/* item.amountLocked > 0 && item.owner === drizzleState.account */}
      <SubTitle>List Claims</SubTitle>
      {
        item && item.amountLocked > 0 && item.owner === drizzleState.account && (
          <DropdownStyled>
            <StyledSettings
              style={!dropdownHidden ? {background: '#fff'} : {}}
              onClick={() => setDropdownHidden(!dropdownHidden)}
            />
            <DropdownMenuStyled hidden={dropdownHidden}>
              {/* TODO: add loader transaction */}
              <DropdownItemStyled
                onClick={() => {
                  sendPayArbitrationFeeByOwner(
                    itemID.padEnd(66, '0'),
                    { value: arbitrationCost }
                  )
                  setDropdownHidden(!dropdownHidden)
                }}
              >
                Raise a Dispute
              </DropdownItemStyled>
            </DropdownMenuStyled>
          </DropdownStyled>
        )
      }
      {
        !claims.loading && claims.data.map(claim => (
          <StyledClaimBoxContainer key={claim.ID}>
            <StyledClaimAddressContainerBoxContent>
              <StyledClaimLabelBoxContent>Finder:</StyledClaimLabelBoxContent>
              <StyledClaimAddressBoxContent>
                {claim && claim.finder}
              </StyledClaimAddressBoxContent>
            </StyledClaimAddressContainerBoxContent>
            <StyledClaimDescriptionContainerBoxContent>
              {claim && claim.descriptionLink && (
                <>
                <StyledClaimLabelBoxContent>
                  Description:
                </StyledClaimLabelBoxContent> 
                <StyledClaimDescriptionBoxContent>
                  {claim.descriptionLink}
                </StyledClaimDescriptionBoxContent> 
                </>
              )}
            </StyledClaimDescriptionContainerBoxContent>
            {claim && item && item.amountLocked === 0 && (
              <StyledButtonClaimBox
                onClick={() =>
                  sendAcceptClaim(
                    itemID.padEnd(66, '0'), 
                    claim.ID, 
                    { value: item.rewardAmount}
                  )
                }
              >
                ACCEPT CLAIM
              </StyledButtonClaimBox>
            )}

            {claim && item && item.amountLocked > 0 && (
              <StyledButtonClaimBox
                onClick={() =>
                  sendAcceptClaim(
                    itemID.padEnd(66, '0'), 
                    claim.ID, 
                    { value: item.rewardAmount}
                  )
                }
              >
                REWARD THE FINDER
              </StyledButtonClaimBox>
            )}
          </StyledClaimBoxContainer>
        ))
      }
      {!claims.loading && claims.data.length === 0 && (
        <StyledNoClaim>There is no claim.</StyledNoClaim>
      )}
    </Container>
  )
}
