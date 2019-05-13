import React, { useState, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'
import { BounceLoader } from 'react-spinners'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import { version } from '../../package.json'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'

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

const SubTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  margin: 30px 0;
`

const StyledDiv = styled.div`
  max-width: 90%;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 20px 0 40px 0;
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

export default props => {
  const { drizzle, useCacheCall, useCacheSend } = useDrizzle()

  const { send: sendClaim, status: statusClaim } = useCacheSend(
    'Recover',
    'claim'
  )
  const { send: sendAcceptClaim, status: statusAcceptClaim } = useCacheSend(
    'Recover',
    'acceptClaim'
  )
  const { send: sendPay, status: statusPay } = useCacheSend('Recover', 'pay')

  const [itemID, privateKey] = props.itemID_Pk.split('-privateKey=')

  // use api infura
  const claim = useCallback(({ finder, descriptionLink }) => {
    if(itemID && finder && descriptionLink)
      sendClaim(itemID, finder, descriptionLink) // TODO: encrypt the data of the descriptionLink with public key of the owner
  })

  const item = useCacheCall('Recover', 'items', itemID)

  const claimIDs = useCacheCall('Recover', 'getClaimsByItemID', itemID)

  const loadDescription = useDataloader.getDescription()

  if (item !== undefined && item.descriptionEncryptedLink !== undefined) {
    const metaEvidence = loadDescription(item.descriptionEncryptedLink, privateKey)
    if (metaEvidence)
      item.content = metaEvidence
  }

  const claims = useCacheCall(['Recover'], call =>
    claimIDs
      ? claimIDs.reduce(
          (acc, d) => {
            const claim = call('Recover', 'claims', d)
            if(claim)
              acc.data.push({ ...claim, ID: d })
            // TODO: decrypt details information
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
    <Container>
      <Title>My item</Title>
      {item ? (
        <>
          <div style={{padding: '10px 0'}}>Owner: {item.owner}</div>
          <div style={{padding: '10px 0'}}>amountLocked: {item.amountLocked}</div>
          <div style={{padding: '10px 0'}}>rewardAmount: {
              ETHAmount({amount: item.rewardAmount, decimals: 2})
            } ETH
          </div>
          <div style={{padding: '10px 0'}}>Private Key: {privateKey}</div>
          <div style={{padding: '10px 0'}}>Content: {item.content && item.content.dataDecrypted.type}</div>
          <SubTitle>Qr code</SubTitle>
          <div style={{textAlign: 'center', padding: '50px'}}>
            <QRCode
              value={`https://app.recover.to/contract/${props.contract}/items/${
                props.itemID_Pk
              }`}
            />
          </div>
        </>
      ) : (
        <p>Loading item...</p>
      )}

      <SubTitle>Claim this item</SubTitle>
      <Formik
        initialValues={{
          finder: '',
          descriptionLink: ''
        }}
        validate={values => {
          let errors = {}
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
            <StyledForm>
              <div>
                <label htmlFor="finder" className="">
                  Finder Address
                </label>
                <StyledField
                  name="finder"
                  className=""
                  placeholder="Finder Address"
                />
              </div>
              <div>
                <label htmlFor="descriptionLink" className="">
                  Description
                </label>
                <StyledField
                  name="description"
                  value={values.descriptionLink}
                  render={({ field, form }) => (
                    <StyledTextarea
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
                />
              </div>
              <div style={{textAlign: 'right'}}>
                <Button
                  style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}}
                  type="submit"
                  onClick={claim}
                  disabled={Object.entries(errors).length > 0}
                >
                  Claim
                </Button>
              </div>
            </StyledForm>
            {statusClaim && statusClaim == 'pending' && (
              <p><BounceLoader color={'#12D8FA'} size={30} style={{display: 'inline'}}/> {' '}Transaction pending</p>
            )}
            {statusClaim && statusClaim !== 'pending' && (
              <>
                <p>Transaction ongoing</p>
                {statusClaim === 'success'
                  ? 'Claim Saved'
                  : 'Error during the transaction.'}
              </>
            )}
          </>
        )}
      </Formik>

      <SubTitle>List Claims</SubTitle>
      {
        !claims.loading && claims.data.map(claim => (
          <div key={claim.ID}>
            <p style={{padding: '10px 0'}}>ID: {claim && claim.ID}</p>
            <p style={{padding: '10px 0'}}>Finder: {claim && claim.finder}</p>
            <p style={{padding: '10px 0 40px 0'}}>Description: {claim && claim.descriptionLink}</p>

            {claim && item && item.rewardAmount && (
              <button
                style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}}
                onClick={() =>
                  sendAcceptClaim(itemID, claim.ID, {
                    value: item.rewardAmount
                  })
                }
              >
                Accept Claim
              </button>
            )}

            {' '}

            {claim && item && item.amountLocked > 0 && (
              <button style={{padding: '0 30px', textAlign: 'center', lineHeight: '50px', border: '1px solid #14213D', borderRadius: '10px'}} onClick={() => sendPay(itemID, item.amountLocked)}>
                Pay the finder
              </button>
            )}
          </div>
        ))
      }

      {!claims.loading && claims.data.length === 0 && 'No claim'}
    </Container>
  )
}
