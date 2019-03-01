import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { version } from '../../package.json'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'

import ipfsPublish from './api/ipfs-publish'

const StyledDiv = styled.div`
  max-width: 90%;
`
export default props => {
  const [urlDescriptionEncrypted, setUrlDescriptionEncrypted] = useState()
  const { drizzle, useCacheCall, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0],
    balance: drizzle.web3.utils.toBN(
      drizzleState.accountBalances[drizzleState.accounts[0]]
    )
  }))

  const { send, status } = useCacheSend('Recover', 'claim')
  const [goodID, privateKey] = props.goodID_Pk.split('-')

  const claim = useCallback(({ useMetaTx, finder, descriptionLink }) => {
    if (!useMetaTx) {
      send(goodID, finder, descriptionLink)
    } else {
      const claimerAccount = drizzle.web3.eth.accounts.privateKeyToAccount(
        privateKey
      )
      console.log('!!!! claimerAccount address', claimerAccount.address)
      const msg = drizzle.web3.eth.abi.encodeParameters(
        ['bytes32', 'address', 'string'],
        [goodID, finder, descriptionLink]
      )
      const msgHash = drizzle.web3.utils.sha3(msg)
      const sig = claimerAccount.sign(msgHash)
      fetch(process.env.REACT_APP_METATX_URL, {
        method: 'post',
        body: JSON.stringify({
          goodID: goodID,
          finder: finder,
          descriptionLink: descriptionLink,
          sig: { v: sig.v, r: sig.r, s: sig.s }
        })
      })
        .then(async res => console.log(await res.json()))
        .catch(console.error)
    }
  })

  const good = useCacheCall('Recover', 'goods', goodID)

  return (
    <>
      <h1>My good</h1>
      {/* Decrypt the message and Generate QR code */}
      {good ? (
        <>
          <div>Owner: {good.owner}</div>
          <div>addressForEncryption: {good.addressForEncryption}</div>
          <div>descriptionEncryptedLink: {good.descriptionEncryptedLink}</div>
          <div>amountLocked: {good.amountLocked}</div>
          <div>rewardAmount: {good.rewardAmount}</div>
          <div>timeoutLocked: {good.timeoutLocked}</div>
          <div>Private Key: {privateKey}</div>
          <h2>
            Link:{' '}
            {`https://recover.to/contract/${
              process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
            }/goods/${props.goodID_Pk}`}
          </h2>
          <h2>Qr code</h2>
          <QRCode
            value={`https://recover.to/contract/${
              process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
            }/goods/${props.goodID_Pk}`}
          />
        </>
      ) : (
        <p>Loading good...</p>
      )}

      <h2>Claim this good</h2>
      <Formik
        initialValues={{
          finder: '',
          descriptionLink: '' // TODO: push on ipfs
        }}
        validate={values => {
          let errors = {}
          {
            /* TODO use Yup */
          }
          if (!drizzle.web3.utils.isAddress(values.finder))
            errors.finder = 'Valid Address Required'
          if (values.descriptionLink.length > 1000000)
            errors.descriptionLink =
              'The maximum numbers of the characters for the description is 1,000,000 characters.'

          return errors
        }}
        onSubmit={claim}
      >
        {({ errors, values, handleChange }) => (
          <>
            <Form>
              <div>
                <label htmlFor="finder" className="">
                  Finder Address
                </label>
                <Field
                  name="finder"
                  className=""
                  placeholder="Finder Address"
                />
              </div>
              <div>
                <label htmlFor="descriptionLink" className="">
                  Description
                </label>
                <Field
                  name="description"
                  value={values.descriptionLink}
                  render={({ field, form }) => (
                    <Textarea
                      {...field}
                      className=""
                      minRows={10}
                      onChange={e => {
                        handleChange(e)
                        form.setFieldValue('descriptionLink', e.target.value)
                      }}
                    />
                  )}
                />
                <ErrorMessage
                  name="descriptionLink"
                  component="div"
                  className=""
                />
              </div>
              <div>
                <label htmlFor="useMetaTx" className="">
                  Use Meta Transaction
                </label>
                <Field
                  name="useMetaTx"
                  type="checkbox"
                  className=""
                  placeholder=""
                />
              </div>
              <div className="">
                <Button
                  type="submit"
                  onClick={claim}
                  disabled={Object.entries(errors).length > 0}
                >
                  Claim
                </Button>
              </div>
            </Form>
            {status && status == 'pending' && <p>Transaction pending</p>}
            {status && status !== 'pending' && (
              <>
                <p>Transaction ongoing</p>
                {status === 'success'
                  ? 'Claim Saved'
                  : 'Error during the transaction.'}
              </>
            )}
          </>
        )}
      </Formik>

      <h2>List Claims</h2>

      <button>Accept Claim (owner)</button>

      <p>Version: {version}</p>
    </>
  )
}
