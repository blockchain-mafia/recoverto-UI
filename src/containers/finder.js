import React, { useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import Textarea from 'react-textarea-autosize'
import Web3 from 'web3'

import { useDrizzle } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import MessageBoxTx from '../components/message-box-tx'

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
  padding-bottom: 20px;
`

const SubTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  margin: 30px 0;
`

const Label = styled.div`
  margin-top: 24px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 200;
  font-size: 16px;
  line-height: 19px;
  color: #5C5C5C;
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

const StyledPrint = styled.div`
  display: none;
  @media print {
    display: block;
    margin: 40px;
  }
`

export default props => {
  const { drizzle, useCacheCall, useCacheSend } = useDrizzle()
  const [isClaim, setClaim] = useState(false)
  const [isSendClaim, setSendClaim] = useState('')

  const [itemIDHex, privateKey] = props.itemID_Pk.split('-privateKey=')

  const itemID = itemIDHex.replace(/0+$/, '')

  const claim = useCallback(({finder, descriptionLink}) => {
    const web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/846256afe0ee40f0971d902ea8d36266'),
      {
        defaultBlock: "latest",
        transactionConfirmationBlocks: 1,
        transactionBlockTimeout: 5
      }
    )
    if(!isClaim) {
      setClaim(true)
      setSendClaim('pending')

      const encodedABI = drizzle.contracts.Recover.methods.claim(itemID, finder, descriptionLink).encodeABI()
      web3.eth.accounts.signTransaction({
            to: drizzle.contracts.Recover.address,
            gas: 255201, // TODO: compute the gas cost before
            data: encodedABI
          }, 
          privateKey
        ).then(
          signTransaction => {
            web3.eth.sendSignedTransaction(signTransaction.rawTransaction.toString('hex'))
              .on('transactionHash', txHash => {
                // TODO: post msg to airtable to be sure the tx is deployed
                window.location.replace(
                  `/contract/${
                    process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
                  }/items/${itemID}-privateKey=${privateKey}`
                )
              })
          }
        )
    }
  })

  const item = useCacheCall('Recover', 'items', itemID)

  const loadDescription = useDataloader.getDescription()

  if (item !== undefined && item.descriptionEncryptedLink !== undefined) {
    const metaEvidence = loadDescription(item.descriptionEncryptedLink, privateKey)
    if (metaEvidence)
      item.content = metaEvidence
  }

  return (
    <Container>
      {item ? (
        <>
          <Title>{item.content ? item.content.dataDecrypted.type : 'Item'}</Title>
          <Label>Description</Label>
          <div style={{padding: '10px 0'}}>{item.content ? item.content.dataDecrypted.description : '...'}</div>
          <Label>Contact Information</Label>
          <div style={{padding: '10px 0'}}>{item.content ? item.content.dataDecrypted.contactInformation : '...'}</div>
          <Label>Reward</Label>
          <div style={{padding: '10px 0'}}>{
              ETHAmount({amount: item.rewardAmount, decimals: 2})
            } ETH
          </div>
        </>
      ) : (
        <Title>Loading Item...</Title>
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
                  name="descriptionLink"
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
                  disabled={Object.entries(errors).length > 0}
                >
                  Claim
                </Button>
              </div>
            </StyledForm>
            {isSendClaim === 'pending' && (
              <MessageBoxTx
                ongoing={true}
              />
            )}
          </>
        )}
      </Formik>
    </Container>
  )
}
