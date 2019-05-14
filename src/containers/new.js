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
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 40px;
  color: #14213d;
  margin-botton: 30px;
  padding-bottom: 50px;
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
  const [identity] = useState(EthCrypto.createIdentity())
  const [isMetaEvidencePublish, setIsMetaEvidencePublish] = useState(false)
  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],
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
          rewardAmount: 0,
          fundClaimAmount: 0.005,
          timeoutLocked: 604800 // Locked for one week
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
            errors.rewardAmount = 'Amount required must be positive.'
          if (isNaN(values.fundClaimAmount))
            errors.fundClaimAmount = 'Number Required'
          if (Number(values.fundClaimAmount) > drizzle.web3.utils.fromWei(drizzleState.balance))
            errors.fundClaimAmount = 'Amount must be less than your wallet amount.'
          if (!values.timeoutLocked)
            errors.timeoutLocked = 'Timeout locked reward required'
          if (isNaN(values.timeoutLocked))
            errors.timeoutLocked = 'Number Required'
          if (values.timeoutLocked <= 0)
            errors.timeoutLocked = 'Timeout locked must be positive.'

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

          values.itemID = drizzle.web3.utils.randomHex(16)

          values.addressForEncryption = EthCrypto.publicKey.toAddress(
            identity.publicKey
          )

          values.value = drizzle.web3.utils.toWei(
            typeof values.fundClaimAmount === 'string'
              ? values.fundClaimAmount
              : String(values.fundClaimAmount)
            )

          window.localStorage.setItem('recover', JSON.stringify({
            ...JSON.parse(localStorage.getItem('recover') || '{}'),
            [values.itemID.padEnd(65, '0')]: {
              owner: drizzleState.account,
              privateKey: identity.privateKey
            }
          }));

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
                  Amount (ETH)
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
              <FieldContainer>
                <StyledLabel htmlFor="timeoutLocked">
                  Time Locked
                </StyledLabel>
                <StyledField
                  name="timeoutLocked"
                  placeholder="Timeout locked"
                />
                <ErrorMessage
                  name="timeoutLocked"
                  component={Error}
                />
              </FieldContainer>
              <FieldContainer>
                <StyledLabel htmlFor="fundClaimAmount">
                  Fund Claim Amount (ETH)
                </StyledLabel>
                <StyledField
                  name="fundClaimAmount"
                  placeholder="Fund Claim Call"
                />
                <ErrorMessage
                  name="fundClaimAmount"
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
                      }/items/${values.itemID}-privateKey=${identity.privateKey}`
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
