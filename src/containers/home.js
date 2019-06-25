import React from 'react'
import styled from 'styled-components/macro'
import Dotdotdot from 'react-dotdotdot'
import { navigate } from '@reach/router'

import { useDataloader } from '../bootstrap/dataloader'
import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 70px;
  grid-auto-rows: 290px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const Type = styled.div`
  font-family: Nunito;
  font-weight: 600;
  font-size: 30px;
  color: #14213d;
  margin-bottom: 25px;
`

const Description = styled(Dotdotdot)`
  font-family: Nunito;
  font-size: 20px;
  color: #14213d;
  font-weight: 100;
`

export default () => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const loadDescription = useDataloader.getDescription()

  const { useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x0000000000000000000000000000000000000000',
    networkID: drizzleState.web3.networkId || 1
  }))

  const itemIDs = useCacheCall('Recover', 'getItemIDsByOwner', drizzleState.account)

  const items = useCacheCall(['Recover'], call =>
    itemIDs
      ? itemIDs.reduce(
          (acc, d) => {
            const item = call('Recover', 'items', d)
            if(item) {
              const itemID = d.replace(/0x0/gi, '0x').replace(/0+$/, '')

              item.content = {
                dataDecrypted: {type: 'loading...'}
              }
              if(recover[itemID] && recover[itemID].privateKey) {
                const metaEvidence = loadDescription(
                  item.descriptionEncryptedLink,
                  recover[itemID].privateKey
                )
                if (metaEvidence) item.content = metaEvidence
              } else item.content = {
                dataDecrypted: {type: 'Data Encrypted'}
              }
              item.ID = itemID
              acc.data.push(item)
            }
            return acc
          },
          {
            data: [],
            loading: false
          }
        )
      : { loading: true }
  )

  const claimIDs = useCacheCall('Recover', 'getClaimIDsByAddress', drizzleState.account)

  const claims = useCacheCall(['Recover'], call =>
    claimIDs
      ? claimIDs.reduce(
          (acc, d) => {
            const claim = call('Recover', 'claims', d)
            if(claim) {
              const item = call('Recover', 'items', claim.itemID)
              if(item) {
                item.content = {
                  dataDecrypted: {type: 'loading...'}
                }

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
              acc.data.push({ ...claim, ...item, ID: d })
            }
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
    <Grid>
      <CardItem newItem={true} />
      {
        !claims.loading && claims.data.map(claim => (
          <CardItem 
            key={claim.ID}
            encrypted={false}
            onClick={
              () => navigate(
                `/contract/${
                  drizzleState.networkID === 42 ?
                    process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                  : process.env.REACT_APP_RECOVER_MAINNET_ADDRESS
                }/claims/${claim.ID}`
              )
            }
          >
            <Type>{claim.content && claim.content.dataDecrypted.type}</Type>
            <Description clamp={5}>
              {claim.content && claim.content.dataDecrypted.description}
              {/* <p style={{padding: '10px 0'}}>Status: {claim && claim.status}</p> */}
            </Description>
          </CardItem>
        ))
      }
      {
        !items.loading && items.data.reverse().map(item => (
          <CardItem 
            key={item.ID}
            encrypted={false}
            onClick={
              () => navigate(
                `/contract/${
                  drizzleState.networkID === 42 ?
                    process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                    : process.env.REACT_APP_RECOVER_MAINNET_ADDRESS
                }/items/${item.ID}/owner`
              )
            }
          >
            <Type>{item.content && item.content.dataDecrypted.type}</Type>
            <Description clamp={5}>
              {item.content && item.content.dataDecrypted.description}
            </Description>
          </CardItem>
        ))
      }
    </Grid>
  )
}
