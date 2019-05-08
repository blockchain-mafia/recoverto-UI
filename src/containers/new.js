import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { version } from '../../package.json'
import Button from '../components/button'

import ipfsPublish from './api/ipfs-publish'

const Container = styled.div`
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
`

export default () => {
  const [identity] = useState(EthCrypto.createIdentity())
  const [isMetaEvidencePublish, setIsMetaEvidencePublish] = useState(false)
  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

  const { send, status } = useCacheSend('Recover', 'addItem')
  
  const addItem = useCallback(
    ({
      itemID,
      addressForEncryption,
      descriptionEncryptedIpfsUrl,
      rewardAmount,
      timeoutLocked
    }) =>
      send(
        itemID,
        addressForEncryption,
        descriptionEncryptedIpfsUrl,
        drizzle.web3.utils.toWei(rewardAmount, 'ether'),
        Number(timeoutLocked)
      )
  )

  return (
    <Container>
      <Title>New Item</Title>
      <Formik
        initialValues={{
          description: '',
          rewardAmount: 0,
          timeoutLocked: 604800 // Locked for one week
        }}
        validate={values => {
          let errors = {}
          if (values.description.length > 1000000)
            errors.description =
              'The maximum numbers of the characters for the description is 1,000,000 characters.'
          if (!values.rewardAmount)
            errors.rewardAmount = 'Amount reward required'
          if (isNaN(values.rewardAmount))
            errors.rewardAmount = 'Number Required'
          if (values.rewardAmount <= 0)
            errors.rewardAmount = 'Amount required must be positive.'
          if (!values.timeoutLocked)
            errors.timeoutLocked = 'Timeout locked reward required'
          if (isNaN(values.timeoutLocked))
            errors.timeoutLocked = 'Number Required'
          if (values.timeoutLocked <= 0)
            errors.timeoutLocked = 'Timeout locked must be positive.'

          return errors
        }}
        onSubmit={useCallback(async values => {
          const messageEncrypted = await EthCrypto.encryptWithPublicKey(
            identity.publicKey,
            values.description
          )

          const enc = new TextEncoder()

          // Upload the description encrypted to IPFS
          const ipfsHashMetaEvidenceObj = await ipfsPublish(
            'metaEvidence.json',
            enc.encode(EthCrypto.cipher.stringify(messageEncrypted).toString())
          )

          await setIsMetaEvidencePublish(true)

          values.descriptionEncryptedIpfsUrl = `ipfs/${
            ipfsHashMetaEvidenceObj[1].hash
          }${ipfsHashMetaEvidenceObj[0].path}`

          values.itemID = drizzle.web3.utils.fromAscii(
            (Math.floor(Math.random() * 9000000) + 1000000).toString() // or a custom itemID
          )

          values.addressForEncryption = EthCrypto.publicKey.toAddress(
            identity.publicKey
          )

          window.localStorage.setItem('recover', JSON.stringify({
            ...localStorage.recover,
            [values.itemID]: {
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
            <Form>
              <div>
                <label htmlFor="rewardAmount" className="">
                  Amount (ETH)
                </label>
                <Field
                  name="rewardAmount"
                  className=""
                  placeholder="Amount reward"
                />
                <ErrorMessage
                  name="rewardAmount"
                  component="div"
                  className=""
                />
              </div>

              <div>
                <label htmlFor="description" className="">
                  Description
                </label>
                <Field
                  name="description"
                  value={values.description}
                  render={({ field, form }) => (
                    <Textarea
                      {...field}
                      className=""
                      minRows={10}
                      onChange={e => {
                        handleChange(e)
                        form.setFieldValue('description', e.target.value)
                      }}
                    />
                  )}
                />
                <ErrorMessage name="description" component="div" className="" />
              </div>
              <div>
                <label htmlFor="timeoutLocked" className="">
                  Time Locked
                </label>
                <Field
                  name="timeoutLocked"
                  className=""
                  placeholder="Timeout locked"
                />
                <ErrorMessage
                  name="timeoutLocked"
                  component="div"
                  className=""
                />
              </div>

              <div className="">
                <Button
                  type="submit"
                  disabled={Object.entries(errors).length > 0}
                >
                  Save Transaction
                </Button>
              </div>
            </Form>
            {/* <p>Private Key for encryption and recover: {identity.privateKey}</p> */}
            {status && status == 'pending' && <p>Transaction pending</p>}
            {status && status !== 'pending' && (
              <>
                <p>Transaction ongoing</p>
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
      <p>Version: {version}</p>
    </Container>
  )
}
