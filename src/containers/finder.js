import React, { useState, useMemo } from 'react'
import styled from 'styled-components/macro'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownDivider
} from 'styled-dropdown-component'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import { ReactComponent as Settings } from '../assets/images/settings.svg'

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

const DropdownStyled = styled(Dropdown)`
  float: right;
  top: -10px;
`

const StyledSettings = styled(Settings)`
  padding: 10px;
  border-radius: 50%;
  &:hover {
    cursor: pointer;
    background: #efefef;
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

export default props => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [dropdownHidden, setDropdownHidden] = useState(true)
  const { useCacheCall, useCacheSend, useCacheEvents, drizzle } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x00'
  }))

  const { send: sendReimburse, status: statusReimburse } = useCacheSend('Recover', 'reimburse')
  const { send: sendPayArbitrationFeeByFinder, status: statusPayArbitrationFeeByFinder } = useCacheSend(
    'Recover',
    'payArbitrationFeeByFinder'
  )
  const { send: sendAppeal, status: statusAppeal } = useCacheSend(
    'Recover',
    'appeal'
  )
  const { send: sendSubmitEvidence, status: statusSubmitEvidence } = useCacheSend(
    'Recover',
    'submitEvidence'
  )

  const arbitratorExtraData = useCacheCall('Recover', 'arbitratorExtraData')

  const arbitrationCost = useCacheCall(
    'KlerosLiquid', 
    'arbitrationCost',
    (arbitratorExtraData || '0x00')
  )

  const loadDescription = useDataloader.getDescription()

  const claimID = props.claimID.replace(/0+$/, '')

  const claim = useCacheCall('Recover', 'claims', claimID)

  const getEvidence = useDataloader.getEvidence()

  let item

  if(claim) {
    item = useCacheCall('Recover', 'items', claim.itemID)
    // TODO: test without web3 (drizzleState.account)
    claim.funds = useCacheEvents(
      'Recover',
      'Fund',
      useMemo(
        () => ({
          filter: { _claimID: claim.itemID },
          fromBlock: process.env.REACT_APP_DRAW_EVENT_LISTENER_BLOCK_NUMBER
        }),
        [drizzleState.account]
      )
    )

    if (claim.disputeID != '0') {
      if (claim.status > '2') {
        claim.disputeStatus = useCacheCall(
          'KlerosLiquid',
          'disputeStatus',
          claim.disputeID
        )

        claim.currentRuling = useCacheCall(
          'KlerosLiquid',
          'currentRuling',
          claim.disputeID
        )

        const dispute = useCacheCall(
          'KlerosLiquid',
          'disputes',
          claim.disputeID
        )

        if (dispute)
          claim.isRuled = dispute.ruled ? true : false

        claim.appealCost = useCacheCall(
          'KlerosLiquid',
          'appealCost',
          claim.disputeID,
          (arbitratorExtraData || '0x00')
        )

        claim.evidence = getEvidence(
          drizzle.contracts.Recover.address,
          drizzle.contracts.KlerosLiquid.address,
          claim.disputeID
        )
      }
    }

    if(item) {
      item.content = {
        dataDecrypted: {type: 'loading...'}
      }

      item.itemID = claim.itemID

      const itemID = claim.itemID.replace(/0x0/gi, '0x').replace(/0+$/, '')

      if(recover[itemID] && recover[itemID].privateKey) {
        const metaEvidence = loadDescription(
          item.descriptionEncryptedLink,
          recover[itemID].privateKey
        )
        if (metaEvidence) item.content = metaEvidence
      } else item.content = {
        dataDecrypted: {type: 'Data Encrypted'}
      }
      if(recover[itemID] && recover[itemID].finder)
      item.finder = recover[itemID].finder
    }
  }

  return (
    <Container>
      {claim && item ? (
        <>
          {claim.amountLocked > 0 && claim.finder === drizzleState.account && (
            <DropdownStyled>
              {/* FIX: only if status === 0 */}
              <StyledSettings
                style={!dropdownHidden ? {background: '#efefef'} : {}}
                onClick={() => setDropdownHidden(!dropdownHidden)}
              />
              <DropdownMenuStyled hidden={dropdownHidden}>
                <DropdownItemStyled 
                  onClick={() => {
                    sendReimburse(
                      claimID, 
                      item.rewardAmount
                    )
                    setDropdownHidden(!dropdownHidden)
                  }}
                >
                  Reimburse
                </DropdownItemStyled>
                <DropdownDivider />
                <DropdownItemStyled
                  onClick={() => {
                    sendPayArbitrationFeeByFinder(
                      claimID,
                      { value: arbitrationCost }
                    )
                    setDropdownHidden(!dropdownHidden)
                  }}
                >
                  Raise a Dispute
                </DropdownItemStyled>
              </DropdownMenuStyled>
            </DropdownStyled>
          )}
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
          {
            claim.status > 0 && (
              <>
                <Label>Dispute Status</Label>
                <div style={{padding: '10px 0'}}>
                  {
                    claim.status === '1'
                      ? 'Awaiting the fee from the finder.'
                      : claim.status === '2'
                        ? 'Awaiting the fee from you.'
                        : claim.status === '3'
                          ? !claim.isRuled
                            ? 'Dispute Ongoing'
                            : claim.currentRuling === '2'
                              ? <>You win the dispute. <br />The dispute can be appealable.</>
                              : <>You lose the dispute. <br />The dispute can be appealable.</>
                          : claim.status === '4' && claim.currentRuling === '2'
                            ? 'You win the dispute.'
                            : 'You lose the dispute.'
                  }
                </div>
              </>
            )
          }
        </>
      ) : (
        <Title>Loading Item...</Title>
      )}
    </Container>
  )
}
