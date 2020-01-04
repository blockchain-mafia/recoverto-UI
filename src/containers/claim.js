import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'
import Web3 from 'web3'
import EthCrypto from 'eth-crypto'
import { navigate } from '@reach/router'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import MessageBoxTx from '../components/message-box-tx'
import ipfsPublish from './api/ipfs-publish'

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 104px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 2em 3em;
    margin: 0;
  }
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  padding-bottom: 20px;
`

const Message = styled.div`
  font-family: Nunito;
  font-size: 24px;
  line-height: 41px;
  color: #000;
  text-align: center;
  padding: 60px 0;
`

const Box = styled.div`
  font-family: Roboto;
  color: #444;
  background: #a6ffcb;
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

const DescriptionBox = styled.div`
  font-size: 20px;
`

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
  font-family: Nunito;
`

const StyledFieldDivSwitch = styled.div`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`

const StyledFieldSpanSwitch = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
  background-color: ${props => props.checked ? '#14213d' : '#ccc'};
  ::before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: #fff;
    transition: .4s;
    border-radius: 34px;
    transform: ${props => props.checked ? 'translateX(26px)' : 'translateX(0)'};
  }
`

const Error = styled.div`
  color: red;
  font-family: Roboto;
  font-size: 14px;
  margin: -20px 0 30px 0;
`

const Claim = ({itemID_Pk, network}) => {
  const { drizzle, useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account:
      drizzleState.accounts[0] || '0x0000000000000000000000000000000000000000',
    networkID: drizzleState.web3.networkId
      ? drizzleState.web3.networkId.toString()
      : '1',
    web3: drizzleState.web3
  }))
  const [isClaim, setClaim] = useState(false)
  const [wallet] = useState(EthCrypto.createIdentity())
  const [isAdvanced, setIsAdvanced] = useState(false)

  const [itemID, privateKey] = itemID_Pk.split('-privateKey=')

  const item = useCacheCall('Recover', 'items', itemID.padEnd(66, '0'))

  const claim = useCallback(async ({ finder, email, description }) => {
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `https://${
          drizzleState.networkID === '42' ? 'kovan' : 'mainnet'
        }.infura.io/v3/846256afe0ee40f0971d902ea8d36266`
      ),
      {
        defaultBlock: 'latest',
        transactionConfirmationBlocks: 1,
        transactionBlockTimeout: 5
      }
    )

    if (!isClaim) {
      setClaim(true)

      await fetch('/.netlify/functions/claims', {
        method: 'post',
        body: JSON.stringify({
          network: drizzleState.networkID === '42' ? 'KOVAN' : 'MAINNET',
          addressOwner: item.owner,
          addressFinder: finder,
          itemID: itemID,
          isAdvanced: isAdvanced,
          privateKeyFinder: isAdvanced ? '' : wallet.privateKey,
          emailFinder: email
        })
      })
        .then(res => res.json())
        .catch(err => console.error(err))

      // TODO: do this only if the private is not registered
      window.localStorage.setItem(
        'recover',
        JSON.stringify({
          ...JSON.parse(localStorage.getItem('recover') || '{}'),
          [itemID]: {
            finder,
            privateKey // to decode the metaevidence
          }
        })
      )

      const dataEncrypted = await EthCrypto.encryptWithPublicKey(
        EthCrypto.publicKeyByPrivateKey(privateKey),
        JSON.stringify({ email, description })
      )

      const enc = new TextEncoder()

      // Upload the finder description encrypted to IPFS
      const ipfsHashMetaEvidenceObj = await ipfsPublish(
        'claim.json',
        enc.encode(
          JSON.stringify({
            dataEncrypted: EthCrypto.cipher.stringify(dataEncrypted).toString()
          })
        )
      )

      const descriptionEncryptedIpfsUrl = `ipfs/${
        ipfsHashMetaEvidenceObj[1].hash
      }${ipfsHashMetaEvidenceObj[0].path}`

      const encodedABI = drizzle.contracts.Recover.methods
        .claim(itemID.padEnd(66, '0'), finder, descriptionEncryptedIpfsUrl)
        .encodeABI()

      await web3.eth.accounts
        .signTransaction(
          {
            to: drizzle.contracts.Recover.address,
            gas: 255201, // TODO: compute the gas cost before
            data: encodedABI
          },
          privateKey
        )
        .then(signTransaction => {
          web3.eth
            .sendSignedTransaction(
              signTransaction.rawTransaction.toString('hex')
            )
            .on('transactionHash', () => {
              // TODO: post msg to airtable to be sure the tx is deployed
              navigate(`
                /network/${network}/contract/${
                  drizzleState.networkID === '42'
                    ? process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                    : process.env.REACT_APP_RECOVER_MAINNET_ADDRESS
                }/items/${itemID}/pk/${privateKey}/claim-success
              `)
            })
        })
    }
  })

  const loadDescription = useDataloader.getDescription()

  if ( // redirect page to register your item
    item !== undefined
    && item.owner === '0x0000000000000000000000000000000000000000'
  )
    navigate(`
      /network/${network}/new/items/undefined/pk/undefined
    `)
  else if ( // load metaevidence
    item !== undefined
    && item.descriptionEncryptedLink !== undefined
    && privateKey
  ) {
    const metaEvidence = loadDescription(
      item.descriptionEncryptedLink,
      privateKey
    )
    if (metaEvidence) item.content = metaEvidence
  }

  return (
    <Container>
      <Title>Discovered Item</Title>
      <Message>
        Congratulations! You found a lost item.
        <br />
        Claim the discovered to get the reward!
      </Message>
      {item && item.content && item.content.dataDecrypted ? (
        <Box>
          {/* Add fiat price with API */}
          {/* Use https://api.etherscan.io/api?module=stats&action=ethprice&apikey= */}
          <TitleBox>
            {/* TODO: Display reward in FIAT currency per default */}
            {ETHAmount({ amount: item.rewardAmount, decimals: 2 })} ETH
          </TitleBox>
          <TypeBox>
            {item.content ? item.content.dataDecrypted.type : '...'}
          </TypeBox>
          <DescriptionBox>
            {item.content ? item.content.dataDecrypted.description : '...'}
          </DescriptionBox>
          <div
            style={{ // TODO: refactoring
              display: 'flex',
              width: '280px',
              height: '50px',
              background: '#12c2e9',
              borderRadius: '40px',
              fontSize: '16px',
              margin: '30px auto 0 auto',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}
          >
            <div style={{width: '90px'}}>Simple</div>
            <StyledFieldDivSwitch>
              <StyledFieldSpanSwitch
                checked={isAdvanced}
                onClick={() => setIsAdvanced(!isAdvanced)}
              />
            </StyledFieldDivSwitch>
            <div style={{width: '90px'}}>Advanced</div>
          </div>
        </Box>
      ) : (
        <Title>Loading Item...</Title>
      )}
      <Formik
        initialValues={{
          finder: '', // NOTE: type should be an address
          email: '',
          description: ''
        }}
        validate={values => {
          let errors = {}

          if (isAdvanced) {
            if (!values.finder)
              errors.finder = 'Address Required'
            if (!drizzle.web3.utils.isAddress(values.finder))
              errors.finder = 'Valid Address Required'
          } else {
            values.finder = wallet.address
          }
          if (!values.email) errors.email = 'Email Required'
          if (
            values.email !== '' &&
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
          )
            errors.email = 'Invalid email address'
          if (values.description.length === 0)
            errors.description = 'Description Required'
          if (values.description.length > 1000000)
            errors.description =
              'The maximum numbers of the characters for the description is 1,000,000 characters.'

          return errors
        }}

        onSubmit={claim}
      >
        {({ errors }) => (
          <>
            <StyledForm>
              {
                isAdvanced && (
                  <div>
                    <label
                      style={{ display: 'block', width: '100%' }}
                      htmlFor="finder"
                    >
                      Account
                    </label>
                    <StyledField
                      name="finder"
                      placeholder="Your Ethereum Account (0x123...)"
                      autoComplete="nope"
                    />
                    <ErrorMessage name="finder" component={Error} />
                  </div>
                )
              }
              <div>
                <label
                  style={{ display: 'block', width: '100%' }}
                  htmlFor="email"
                >
                  Email
                </label>
                <StyledField name="email" placeholder="me@example.com" />
                <ErrorMessage name="email" component={Error} />
              </div>
              <div>
                <label htmlFor="description">Message</label>
                <StyledField
                  name="description"
                  render={({ field, form }) => (
                    <StyledTextarea
                      {...field}
                      placeholder={`I found your ${
                        item && item.content
                          ? item.content.dataDecrypted.type
                          : '...'
                      } in ...
                        \n\nThis is my Whatsapp: +1 23 ...
                        \n\nSee you!
                      `}
                      minRows={10}
                      onChange={e => form.setFieldValue('description', e.target.value)}
                    />
                  )}
                />
                <ErrorMessage name="description" component={Error} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <Button
                  // FIXME:
                  // style={{
                  //   padding: '0 30px',
                  //   textAlign: 'center',
                  //   lineHeight: '50px',
                  //   border: '1px solid #14213d',
                  //   borderRadius: '10px'
                  // }}
                  type="submit"
                  disabled={Object.entries(errors).length > 0}
                >
                  Claim Discovered →
                </Button>
              </div>
            </StyledForm>
            {isClaim && <MessageBoxTx ongoing={true} />}
          </>
        )}
      </Formik>
    </Container>
  )
}

Claim.propTypes = {
  itemID_Pk: PropTypes.string,
  network: PropTypes.string
}

Claim.defaultProps = {
  itemID_Pk: '',
  network: 'mainnet'
}

export default Claim
