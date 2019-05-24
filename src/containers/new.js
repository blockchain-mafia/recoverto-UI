import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import MessageBoxTx from '../components/message-box-tx'
import ipfsPublish from './api/ipfs-publish'
import generateMetaEvidence from '../utils/generate-meta-evidence';

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

const FieldContainer = styled.div`
  margin: 20px 0;
`

const Error  = styled.div`
  color: red;
  font-family: Roboto;
  font-size: 14px;
`

const StyledLabel  = styled.label`
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
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 10px 0;
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

const Submit = styled.div`
  margin-top: 30px;
  text-align: right;
`

export default () => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [identity] = useState(EthCrypto.createIdentity())
  const [isMetaEvidencePublish, setIsMetaEvidencePublish] = useState(false)
  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x00',
    balance: drizzleState.accountBalances[drizzleState.accounts[0]],
    transactions: drizzleState.transactions
  }))

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

  return (
    <Container>
      <Title>New Item</Title>
      <Formik
        initialValues={{
          type: '',
          description: '',
          contactInformation: '',
          rewardAmount: 0
        }}
        validate={values => {
          let errors = {}
          if (values.type  === '')
            errors.type = 'Type Required'
          if (values.description  === '')
            errors.description = 'Description Required'
          if (values.description.length > 100000)
            errors.description =
              'The maximum numbers of the characters for the description is 100,000 characters.'
          if (values.contactInformation  === '')
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

          return errors
        }}
        onSubmit={useCallback(async values => {
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
            enc.encode(JSON.stringify(generateMetaEvidence({
              arbitrableAddress: process.env.REACT_APP_RECOVER_KOVAN_ADDRESS,
              owner: drizzleState.account,
              dataEncrypted: EthCrypto.cipher.stringify(dataEncrypted).toString(),
              timeout: values.timeoutLocked,
              arbitrator: process.env.REACT_APP_ARBITRATOR_KOVAN_ADDRESS
            })))
          )

          await setIsMetaEvidencePublish(true)

          values.descriptionEncryptedIpfsUrl = `ipfs/${
            ipfsHashMetaEvidenceObj[1].hash
          }${ipfsHashMetaEvidenceObj[0].path}`

          values.itemID = drizzle.web3.utils.randomHex(32)

          values.addressForEncryption = EthCrypto.publicKey.toAddress(
            identity.publicKey
          )

          window.localStorage.setItem('recover', JSON.stringify({
            ...JSON.parse(localStorage.getItem('recover') || '{}'),
            [values.itemID]: {
              owner: drizzleState.account,
              privateKey: identity.privateKey
            }
          }))

          const fundClaimsAmount = (recover[drizzleState.account] && recover[drizzleState.account].fundClaims) || '0.005'

          values.value = drizzle.web3.utils.toWei(
            typeof fundClaimsAmount === 'string'
              ? fundClaimsAmount
              : String(fundClaimsAmount)
            )

          values.timeoutLocked = (recover[drizzleState.account] && recover[drizzleState.account].timeoutLocked) || 604800

          addItem(values)
        })}
      >
        {({
          errors,
          setFieldValue,
          touched,
          isSubmitting,
          values,
          handleChange
        }) => (
          <>
            <StyledForm>
              <FieldContainer>
                <StyledLabel htmlFor="type">
                  Type
                </StyledLabel>
                <StyledField
                  name="type"
                  placeholder="Type"
                />
                <ErrorMessage
                  name="type"
                  component={Error}
                />
              </FieldContainer>
              <FieldContainer>
                <StyledLabel htmlFor="description">
                  Description
                </StyledLabel>
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
                        form.setFieldValue('contactInformation', e.target.value)
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
                <ErrorMessage
                  name="rewardAmount"
                  component={Error}
                />
              </FieldContainer>
              <Submit>
                <Button
                  type="submit"
                  disabled={Object.entries(errors).length > 0 || (status && status === 'pending')}
                >
                  Save Transaction →
                </Button>
              </Submit>
            </StyledForm>
            {status && status === 'pending' && (
              <MessageBoxTx
                pending={true}
                onClick={() => window.open(
                  `https://kovan.etherscan.io/tx/${Object.keys(drizzleState.transactions)[0]}`,
                  '_blank'
                )}
              />
            )}
            {status && status !== 'pending' && (
              <>
                <MessageBoxTx 
                  ongoing={true}
                  onClick={() => window.open(
                    `https://kovan.etherscan.io/tx/${Object.keys(drizzleState.transactions)[0]}`,
                    '_blank'
                  )}
                />
                {(status === 'success' && isMetaEvidencePublish)
                  ? window.location.replace(
                      `/contract/${
                        process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                      }/items/${values.itemID}/owner`
                    )
                  : 'Error during the transaction.'}
              </>
            )}
          </>
        )}
      </Formik>
    </Container>
  )
}
