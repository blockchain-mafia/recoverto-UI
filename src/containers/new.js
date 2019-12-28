import PropTypes from 'prop-types'
import React, { useState, useCallback, useEffect } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'
import Modal from 'react-responsive-modal'
import { navigate } from '@reach/router'
import ReactPhoneInput from 'react-phone-input-2'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import MessageBoxTx from '../components/message-box-tx'
import ipfsPublish from './api/ipfs-publish'
import generateMetaEvidence from '../utils/generate-meta-evidence'

import 'react-phone-input-2/lib/style.css'

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
  font-size: 40px;
  color: #14213d;
  padding-bottom: 20px;
`

const FieldContainer = styled.div`
  margin: 20px 0;
`

const Error = styled.div`
  color: red;
  font-family: Roboto;
  font-size: 14px;
`

const StyledLabel = styled.label`
  font-family: Roboto;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 19px;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 10px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledSelect = styled.select`
  text-indent: 10px;
  height: 50px;
  margin: 10px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledOption = styled.option`
  font-family: Roboto;
  padding: 0 40px;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 10px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
  font-family: Nunito;
`

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
`

const Submit = styled.div`
  margin-top: 30px;
  text-align: right;
`

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

const Box = styled.div`
  display: flex;
  align-items: center;
  margin: 0 126px 1em 126px;
  color: #444;
  background-color: #a6ffcb;
  font-family: Roboto;
  padding: 0 40px;
  border-radius: 10px;
  font-size: 24px;
  height: 100px;
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 2em 3em;
    margin: 0 0 1em 0;
  }
`

const types = [
  'Phone',
  'Bag',
  'Laptop',
  'Luggage',
  'Pets',
  'Keys',
  'Ledger',
  'Trezor',
  'KeepKey',
  'Tablet'
]

const New = ({network, itemID, pk}) => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [isMetaEvidencePublish, setIsMetaEvidencePublish] = useState(false)
  const [isOpen, setOpen] = useState(false)
  const [isMMOpen, setMMOpen] = useState(false)
  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account:
      drizzleState.accounts[0] || '0x0000000000000000000000000000000000000000',
    ID: `${drizzleState.accounts[0]}-${drizzleState.web3.networkId}`,
    transactions: drizzleState.transactions,
    // NOTE: Force the type string to be compitable with different version of web3
    networkID: drizzleState.web3.networkId ? drizzleState.web3.networkId.toString() : '1'
  }))

  useEffect(() => {
    console.log(network)
    console.log(drizzleState.networkID)
      if (network === 'mainnet' && drizzleState.networkID !== '1')
        navigate(`/network/kovan`)
      else if (network === 'kovan' && drizzleState.networkID !== '42')
        navigate(`/network/mainnet`)

    if (drizzleState.account === '0x0000000000000000000000000000000000000000')
      setMMOpen(true)
  }, [drizzleState])

  const [identity] =
    itemID !== 'undefined'
      ? useState({
          privateKey: pk,
          publicKey: EthCrypto.publicKeyByPrivateKey(pk)
        })
      : useState(EthCrypto.createIdentity())

  const { send, status } = useCacheSend('Recover', 'addItem')

  const addItem = useCallback(
    ({
      itemID,
      addressForEncryption,
      descriptionEncryptedIpfsUrl,
      rewardAmount,
      timeoutLocked,
      value
    }) =>
      send(
        itemID,
        addressForEncryption,
        descriptionEncryptedIpfsUrl,
        drizzle.web3.utils.toWei(rewardAmount, 'ether'),
        Number(timeoutLocked),
        { value }
      )
  )

  const addSettings = useCallback(
    async ({ email, phoneNumber, fundClaims, timeoutLocked }) => {
      const signMsg = await drizzle.web3.eth.personal.sign(
        `Signature required to check if your are the owner of this address: ${
          drizzleState.account
        }`,
        drizzleState.account
      )

      // TODO: use await
      fetch('/.netlify/functions/settings', {
        method: 'post',
        body: JSON.stringify({
          network: drizzleState.networkID === 42 ? 'KOVAN' : 'MAINNET',
          address: drizzleState.account,
          signMsg,
          email,
          phoneNumber
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.result === 'Settings added')
            window.localStorage.setItem(
              'recover',
              JSON.stringify({
                ...JSON.parse(localStorage.getItem('recover') || '{}'),
                [drizzleState.ID]: {
                  email,
                  phoneNumber,
                  fundClaims,
                  timeoutLocked
                }
              })
            )

          setOpen(false)

          // TODO: if error, render error on the UI
        })
        .catch(err => console.error(err))
    }
  )

  return (
    <>
      {/* TODO: refactoring Metamask modal, see Home (move to /components) */}
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
      {itemID !== 'undefined' && (
        <Box>
          <div style={{ flexGrow: '1', textAlign: 'center' }}>
            You are about to register the item with the ID {itemID}
          </div>
        </Box>
      )}
      <Container>
        <Title>New Item</Title>
        <Formik
          initialValues={{
            type: 'undefined',
            description: '',
            contactInformation: '',
            rewardAmount: 0,
            email:
              (recover[drizzleState.ID] && recover[drizzleState.ID].email)
              || '',
            phoneNumber:
              (recover[drizzleState.ID] && recover[drizzleState.ID].phoneNumber)
              || '',
            fundClaims:
              (recover[drizzleState.ID] && recover[drizzleState.ID].fundClaims)
              || '0.007',
            timeoutLocked:
              (recover[drizzleState.ID] && recover[drizzleState.ID].timeoutLocked)
              || 604800
          }}
          validate={values => {
            let errors = {}
            if (values.type === '' || values.type === 'undefined')
              errors.type = 'Type Required'
            if (values.description === '')
              errors.description = 'Description Required'
            if (values.description.length > 100000)
              errors.description =
                'The maximum numbers of the characters for the description is 100,000 characters.'
            if (values.contactInformation === '')
              errors.contactInformation = 'Contact information Required'
            if (values.contactInformation.length > 100000)
              errors.contactInformation =
                'The maximum numbers of the characters for the contact information is 100,000 characters.'
            if (!values.rewardAmount)
              errors.rewardAmount = 'Amount reward required'
            if (isNaN(values.rewardAmount))
              errors.rewardAmount = 'Number Required'
            if (values.rewardAmount <= 0)
              errors.rewardAmount = 'The reward must be positive.'
            if (!values.email) errors.email = 'Email Required'
            if (
              values.email !== ''
              && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
            )
              errors.email = 'Invalid email address'
            if (isNaN(values.fundClaims)) errors.fundClaims = 'Number Required'
            if (values.fundClaims <= 0)
              errors.fundClaims = 'Amount of the fund claims must be positive.'
            if (isNaN(values.timeoutLocked))
              errors.timeoutLocked = 'Number Required'
            if (values.timeoutLocked <= 0)
              errors.timeoutLocked = 'Timeout locked must be positive.'

            return errors
          }}
          onSubmit={async values => {
            const dataEncrypted = await EthCrypto.encryptWithPublicKey(
              identity.publicKey,
              JSON.stringify({
                type: values.type,
                description: values.description,
                contactInformation: values.contactInformation
              })
            )

            const enc = new TextEncoder()

            // Upload the description encrypted to IPFS
            const ipfsHashMetaEvidenceObj = await ipfsPublish(
              'metaEvidence.json',
              enc.encode(
                JSON.stringify(
                  generateMetaEvidence({
                    arbitrableAddress:
                      drizzleState.networkID === 42
                        ? process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                        : process.env.REACT_APP_RECOVER_MAINNET_ADDRESS,
                    owner: drizzleState.account,
                    dataEncrypted: EthCrypto.cipher
                      .stringify(dataEncrypted)
                      .toString(),
                    timeout: values.timeoutLocked,
                    arbitrator:
                      drizzleState.networkID === 42
                        ? process.env.REACT_APP_ARBITRATOR_KOVAN_ADDRESS
                        : process.env.REACT_APP_ARBITRATOR_MAINNET_ADDRESS
                  })
                )
              )
            )

            await setIsMetaEvidencePublish(true)

            values.descriptionEncryptedIpfsUrl = `ipfs/${
              ipfsHashMetaEvidenceObj[1].hash
            }${ipfsHashMetaEvidenceObj[0].path}`

            values.itemID =
              itemID != 'undefined'
                ? itemID
                : drizzle.web3.utils.randomHex(8).padEnd(64, '0')

            values.addressForEncryption = EthCrypto.publicKey.toAddress(
              identity.publicKey
            )

            window.localStorage.setItem(
              'recover',
              JSON.stringify({
                ...JSON.parse(localStorage.getItem('recover') || '{}'),
                [values.itemID.replace(/0+$/, '')]: {
                  owner: drizzleState.account,
                  privateKey: identity.privateKey
                }
              })
            )

            const fundClaimsAmount =
              (recover[drizzleState.ID] &&
                recover[drizzleState.ID].fundClaims) ||
              '0.007'

            values.value = drizzle.web3.utils.toWei(
              typeof fundClaimsAmount === 'string'
                ? fundClaimsAmount
                : String(fundClaimsAmount)
            )

            values.timeoutLocked =
              (recover[drizzleState.ID] && recover[drizzleState.ID].timeoutLocked)
              || 604800

            addItem(values)
          }}
        >
          {({ errors, setFieldValue, values, handleChange }) => (
            <>
              <StyledForm>
                <FieldContainer>
                  <StyledLabel htmlFor="type">Type</StyledLabel>
                  <StyledSelect
                    name="type"
                    value={values.type}
                    onChange={handleChange}
                  >
                    <StyledOption
                      value={values.type === 'undefined' ? 'undefined' : ''}
                      label={
                        values.type === 'undefined'
                          ? 'Select your Type'
                          : 'Custom'
                      }
                    />
                    {values.type === 'undefined' && (
                      <StyledOption value="" label="Custom" />
                    )}
                    {types.map(type => (
                      <StyledOption key={type} value={type} label={type} />
                    ))}
                  </StyledSelect>
                  {!types.includes(values.type) &&
                    values.type !== 'undefined' && (
                      <StyledField
                        name="type"
                        placeholder="Describe the Type of your Item"
                      />
                    )}
                  <ErrorMessage name="type" component={Error} />
                </FieldContainer>
                <FieldContainer>
                  <StyledLabel htmlFor="description">Description</StyledLabel>
                  <StyledField
                    name="description"
                    value={values.description}
                    render={({ field, form }) => (
                      <StyledTextarea
                        {...field}
                        minRows={10}
                        onChange={e => {
                          handleChange(e)
                          form.setFieldValue('description', e.target.value)
                        }}
                      />
                    )}
                  />
                  <ErrorMessage name="description" component={Error} />
                </FieldContainer>
                <FieldContainer>
                  <StyledLabel htmlFor="contactInformation">
                    Contact Information
                  </StyledLabel>
                  <StyledField
                    name="contactInformation"
                    value={values.contactInformation}
                    render={({ field, form }) => (
                      <StyledTextarea
                        {...field}
                        minRows={10}
                        onChange={e => {
                          handleChange(e)
                          form.setFieldValue(
                            'contactInformation',
                            e.target.value
                          )
                        }}
                      />
                    )}
                  />
                  <ErrorMessage name="contactInformation" component={Error} />
                </FieldContainer>
                <FieldContainer>
                  <StyledLabel htmlFor="rewardAmount">
                    Reward Amount (ETH)
                  </StyledLabel>
                  <StyledField
                    name="rewardAmount"
                    placeholder="Amount reward"
                  />
                  <ErrorMessage name="rewardAmount" component={Error} />
                </FieldContainer>
                <Modal
                  open={isOpen}
                  onClose={() => setOpen(false)}
                  center
                  styles={{
                    closeButton: { background: 'transparent' },
                    modal: {
                      width: '80vw',
                      maxWidth: '300px',
                      padding: '6vh 8vw'
                    }
                  }}
                >
                  <ModalTitle>Settings</ModalTitle>
                  <FieldContainer>
                    <StyledLabel htmlFor="email">
                      <span
                        className="info"
                        aria-label="Your email to be notified if there is a claim on one of your items."
                      >
                        Email (required)
                      </span>
                    </StyledLabel>
                    <StyledField name="email" placeholder="Email" />
                    <ErrorMessage name="email" component={Error} />
                  </FieldContainer>
                  <FieldContainer>
                    <StyledLabel htmlFor="phoneNumber">
                      <span
                        className="info"
                        aria-label="Your phone number to be notified by SMS if there is a claim on one of your items."
                      >
                        Phone Number
                      </span>
                    </StyledLabel>
                    <ReactPhoneInput
                      value={values.phoneNumber}
                      onChange={phoneNumber =>
                        setFieldValue('phoneNumber', phoneNumber)
                      }
                      containerStyle={{
                        margin: '10px 0',
                        lineHeight: '50px',
                        boxSizing: 'border-box',
                        border: '1px solid #ccc !important'
                      }}
                      inputStyle={{
                        height: '52px',
                        width: '100%',
                        boxSizing: 'border-box',
                        color: '#222',
                        font: '400 15px Nunito'
                      }}
                      inputExtraProps={{
                        name: 'phoneNumber'
                      }}
                    />
                    <ErrorMessage name="phoneNumber" component={Error} />
                  </FieldContainer>
                  <FieldContainer>
                    <StyledLabel htmlFor="fundClaims">
                      <span
                        className="info"
                        aria-label="
                          The amount sent to the wallet finder to pay the gas to claim without ETH.
                          It's a small amount of ETH.
                        "
                      >
                        Fund Claims (ETH)
                      </span>
                    </StyledLabel>
                    <StyledField
                      name="fundClaims"
                      placeholder="PreFund Gas Cost to Claim"
                    />
                    <ErrorMessage name="fundClaims" component={Error} />
                  </FieldContainer>
                  <FieldContainer>
                    <StyledLabel htmlFor="timeoutLocked">
                      <span
                        className="info"
                        aria-label="
                          Time in seconds after which the finder from whom his claim was accepted
                          may force the payment of the reward if there is no dispute flow.
                        "
                      >
                        Time Locked (seconds)
                      </span>
                    </StyledLabel>
                    <StyledField
                      name="timeoutLocked"
                      placeholder="Timeout locked"
                    />
                    <ErrorMessage name="timeoutLocked" component={Error} />
                  </FieldContainer>
                  <p
                    style={{
                      color: '#444',
                      fontFamily: 'Roboto',
                      fontWeight: '300',
                      textAlign: 'center',
                      padding: '14px 0 22px 0'
                    }}
                  >
                    You can set up these settings <br /> in &nbsp;
                    <i
                      style={{
                        fontFamily: 'Tahoma, Geneva, sans-serif',
                        lineHeight: '30px',
                        color: '#808080',
                        fontSize: '14px'
                      }}
                    >
                      Menu > Settings
                    </i>{' '}
                    .
                  </p>
                  <Button
                    style={{ width: '100%' }}
                    onClick={() =>
                      addSettings({
                        email: values.email,
                        phoneNumber: values.phoneNumber,
                        fundClaims: values.fundClaims,
                        timeoutLocked: values.timeoutLocked
                      })
                    }
                  >
                    Save Settings
                  </Button>
                </Modal>
                {values.email === '' && (
                  <Button onClick={() => setOpen(true)}>Settings</Button>
                )}
                <Submit>
                  <Button
                    type="submit"
                    disabled={
                      Object.entries(errors).length > 0 ||
                      (status && status === 'pending')
                    }
                  >
                    Save Transaction →
                  </Button>
                </Submit>
              </StyledForm>
              {status && status === 'pending' && (
                <MessageBoxTx
                  pending={true}
                  onClick={() =>
                    window.open(
                      `https://${
                        drizzleState.networkID === 42 ? 'kovan.' : ''
                      }etherscan.io/tx/${
                        Object.keys(drizzleState.transactions)[0]
                      }`,
                      '_blank'
                    )
                  }
                />
              )}
              {status && status !== 'pending' && (
                <>
                  <MessageBoxTx
                    ongoing={true}
                    onClick={() =>
                      window.open(
                        `https://${
                          drizzleState.networkID === 42 ? 'kovan.' : ''
                        }etherscan.io/tx/${
                          Object.keys(drizzleState.transactions)[0]
                        }`,
                        '_blank'
                      )
                    }
                  />
                  {/* FIXME: use `navigate()` if it's possible else add note */}
                  {status === 'success' && isMetaEvidencePublish
                    ? window.location.replace(
                        `/network/${network}/contract/${
                          drizzleState.networkID === 42
                            ? process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                            : process.env.REACT_APP_RECOVER_MAINNET_ADDRESS
                        }/items/${values.itemID.replace(/0+$/, '')}/owner`
                      )
                    : 'Error during the transaction.'}
                </>
              )}
            </>
          )}
        </Formik>
      </Container>
    </>
  )
}

New.propTypes = {
  network: PropTypes.string,
  itemID: PropTypes.string,
  pk: PropTypes.string
}

New.defaultProps = {
  network: 'mainnet',
  itemID: PropTypes.string,
  pk: PropTypes.string
}

export default New
