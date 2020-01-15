import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import Dotdotdot from 'react-dotdotdot'
import Modal from 'react-responsive-modal'
import { navigate } from '@reach/router'

import { useDataloader } from '../bootstrap/dataloader'
import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

const ModalTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  padding-bottom: 14px;
`

const ModalContent = styled.div`
  font-family: Roboto;
  color: #14213d;
  font-size: 16px;
  line-height: 24px;
`

const PModalContent = styled.p`
  padding: 20px 0;
`

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

const Home = ({ network, contract }) => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [isMMOpen, setMMOpen] = useState(false)

  const { useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0]
      ? drizzleState.accounts[0].toString()
      : '0x0000000000000000000000000000000000000000',
    networkID: drizzleState.web3.networkId
      ? drizzleState.web3.networkId.toString()
      : '1'
  }))

  useEffect(() => {
    // NOTE: redirect the client if the network does not match with the URL.
    if(network === 'mainnet' && drizzleState.networkID !== '1')
      navigate(`/network/kovan/contract/${process.env.REACT_APP_RECOVER_KOVAN_ADDRESS}`)
    else if (network === 'kovan' && drizzleState.networkID !== '42')
      navigate(`/network/mainnet/contract/${process.env.REACT_APP_RECOVER_MAINNET_ADDRESS}`)

    // NOTE: if the client does not injected web3, display the web3 modal.
    if (drizzleState.account === '0x0000000000000000000000000000000000000000')
      setMMOpen(true)
  }, [drizzleState])

  const loadDescription = useDataloader.getDescription()

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
    claimIDs && claimIDs[0] !== '0'
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
    <>
      {/* TODO: refactoring Metamask modal, see New (move to /components) */}
      <Modal
        open={isMMOpen}
        onClose={v => v}
        showCloseIcon={false}
        focusTrapped={false}
        center
        styles={{
          closeButton: { background: 'transparent' },
          modal: {
            width: '80vw',
            maxWidth: '400px',
            padding: '6vh 8vw',
            borderRadius: '10px'
          }
        }}
      >
        <ModalTitle>Metamask Wallet Required</ModalTitle>
        <ModalContent>
          <PModalContent>
            This is a decentralized application. You need to have a Metamask
            account with some Ethers, cryptocurrency of the Ethereum Blockchain.
          </PModalContent>

          <PModalContent>
            Here is the shortest way to create a Metamask Wallet with some
            Ethers:
          </PModalContent>
          <ol>
            <li>
              1. Install <a href="https://metamask.io/">Metamask</a>
            </li>
            <li>
              2. Buy some Ethers on{' '}
              <a href="https://www.coinbase.com/">Coinbase</a>
            </li>
            <li>3. Transfer your Ethers to your Metamask Wallet</li>
          </ol>
        </ModalContent>
      </Modal>
      <Grid>
        <CardItem newItem={true} network={network} />
        {
          !claims.loading && claims.data.map(claim => (
            <CardItem
              key={claim.ID}
              encrypted={false}
              network={network}
              onClick={
                () => navigate(`
                  /network/${network}/contract/${contract}/claims/${claim.ID}
                `)
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
                () => navigate(`
                  /network/${network}/contract/${contract}/items/${item.ID}/owner
                `)
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
    </>
  )
}

Home.propTypes = {
  network: PropTypes.string
}

Home.defaultProps = {
  network: 'mainnet'
}

export default Home