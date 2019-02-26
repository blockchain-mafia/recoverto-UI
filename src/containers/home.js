import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { version } from '../../package.json'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'

import ipfsPublish from './api/ipfs-publish'


const StyledDiv = styled.div`
  max-width: 90%;
`
export default () => {
  const [urlDescriptionEncrypted, setUrlDescriptionEncrypted] = useState()
  const [status, setStatus] = useState()
  const [identity] = useState(EthCrypto.createIdentity())
  const { drizzle, useCacheCall, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0],
    balance: drizzle.web3.utils.toBN(
      drizzleState.accountBalances[drizzleState.accounts[0]]
    )
  }))
  const { send } = useCacheSend('Recover', 'addGood')
  const addGood = useCallback(
    ({ 
      goodID, 
      addressForEncryption, 
      descriptionEncryptedIpfsUrl, 
      rewardAmount, 
      timeoutLocked
    }) => send(
      goodID,
      addressForEncryption, 
      descriptionEncryptedIpfsUrl, 
      Number(rewardAmount), 
      Number(timeoutLocked)
    )
  )

  return (
    <>
      <p>Hello you have <ETHAmount amount={drizzleState.balance} decimals={4} /> ETH</p>
      <Formik
        initialValues={{
          goodID: 0x00, // Generate random bytes32 goodID from 7 digits.
          addressForEncryption: '', 
          description: '',
          rewardAmount: 0,
          timeoutLocked: 604800 // Locked for one week
        }}
        validate = {values => {
          {/* TODO use Yup */}
          let errors = {}
          if (values.goodID.length > 55)
            errors.goodID = 'Number of characters for the good allowed is exceeded. The maximum is 8 characters.'
          if (!values.addressForEncryption)
            errors.addressForEncryption = 'Sender Address Required'
          if (!drizzle.web3.utils.isAddress(values.addressForEncryption))
            errors.addressForEncryption = 'Valid Address Required'
          if (values.description.length > 1000000)
            errors.description = 'The maximum numbers of the characters for the description is 1,000,000 characters.'
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

          values.descriptionEncryptedIpfsUrl = `ipfs/${ipfsHashMetaEvidenceObj[1].hash}${ipfsHashMetaEvidenceObj[0].path}`

          values.goodID = drizzle.web3.utils.fromAscii((Math.floor(Math.random() * 9000000) + 1000000).toString())
          addGood(values)
          // redirect to the QR code
        })}
      >
        {({ errors, setFieldValue, touched, isSubmitting, values, handleChange }) => (
          <Form>
            <label htmlFor='addressForEncryption' className=''>Address For Encryption</label>
            <Field name='addressForEncryption' className='' placeholder='Title' />
            <label htmlFor='rewardAmount' className=''>Amount (ETH)</label>
            <Field name='rewardAmount' className='' placeholder='Amount' />
            <ErrorMessage name='rewardAmount' component='div' className='' />
            <label htmlFor='description' className=''>Description</label>
            <Field
              name='description'
              value={values.description}
              render={({ field, form }) => (
                <Textarea
                  {...field}
                  className=''
                  minRows={10}
                  onChange={e => {
                    handleChange(e)
                    form.setFieldValue('description', e.target.value)
                  }}
                />
              )}
            />
            <ErrorMessage name='description' component='div' className='' />
            <Field name='timeoutLocked' className='' placeholder='Timeout locked' />
            <ErrorMessage name='timeoutLocked' component='div' className='' />
            <div className=''>
              <Button type='submit' disabled={Object.entries(errors).length > 0}>Save Transaction</Button>
            </div>
          </Form>
        )}
      </Formik>
      <p>{version}</p>
    </>
  )
}
