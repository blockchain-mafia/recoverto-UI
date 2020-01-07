import PropTypes from 'prop-types'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import styled from 'styled-components/macro'
import { Dropdown, DropdownItem, DropdownMenu } from 'styled-dropdown-component'
import Textarea from 'react-textarea-autosize'
import Modal from 'react-responsive-modal'
import { Formik, Field, ErrorMessage } from 'formik'
import { navigate } from '@reach/router'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import ipfsPublish from './api/ipfs-publish'
import MessageBoxTx from '../components/message-box-tx'
import ReadFile from '../utils/read-file'
import Button from '../components/button'
import { ReactComponent as Settings } from '../assets/images/settings.svg'

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

const Label = styled.div`
  margin-top: 24px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 200;
  font-size: 16px;
  line-height: 19px;
  color: #5c5c5c;
`

const DropdownStyled = styled(Dropdown)`
  float: right;
  top: -10px;
`

const StyledSettings = styled(Settings)`
  padding: 10px;
  border-radius: 50%;
  &:hover {
    cursor: pointer;
    background: #efefef;
  }
`

const DropdownMenuStyled = styled(DropdownMenu)`
  float: right;
  left: auto;
  right: 0;
`

const DropdownItemStyled = styled(DropdownItem)`
  line-height: 24px;
  &:hover {
    cursor: pointer;
  }
`

const Box = styled.div`
  display: flex;
  align-items: center;
  margin-top: 50px;
  color: #444;
  background-color: #a6ffcb;
  background-repeat: no-repeat;
  background-position: center;
  overflow: hidden;
  font-family: Roboto;
  padding: 0 40px;
  border-radius: 10px;
  font-size: 24px;
  height: 100px;
  overflow: hidden;
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

const FieldContainer = styled.div`
  margin: 20px 0;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #ffffff;
  border: 1px solid #cccccc;
  box-sizing: border-box;
  border-radius: 5px;
  min-height: 11em;
  font-family: Nunito;
`

const Error = styled.div`
  color: red;
  font-family: Roboto;
  font-size: 14px;
`

const ModalTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  padding-bottom: 14px;
`

const Finder = ({network, claimID}) => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [dropdownHidden, setDropdownHidden] = useState(true)
  const [isOpen, setOpen] = useState(false)
  const [isEvidenceSent, setIsEvidenceSent] = useState(false)
  const { useCacheCall, useCacheSend, useCacheEvents, drizzle } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0]
      ? drizzleState.accounts[0].toString()
      : '0x0000000000000000000000000000000000000000',
    networkID: drizzleState.web3.networkId
      ? drizzleState.web3.networkId.toString()
      : '1',
    transactions: drizzleState.transactions
  }))

  useEffect(() => {
    if(network === 'mainnet' && drizzleState.networkID !== '1')
      navigate(`/network/kovan`)
    else if (network === 'kovan' && drizzleState.networkID !== '42')
      navigate(`/network/mainnet`)
  }, [drizzleState])

  const resetEvidenceReset = useCallback(resetForm => {
    if (!isEvidenceSent) {
      resetForm()
      setIsEvidenceSent(true)
    }
  })

  // TODO: implement loader
  const { send: sendReimburse, status: statusReimburse } = useCacheSend(
    'Recover',
    'reimburse'
  )
  const {
    send: sendPayArbitrationFeeByFinder,
    status: statusPayArbitrationFeeByFinder // TODO: implement loader
  } = useCacheSend('Recover', 'payArbitrationFeeByFinder')
  const { send: sendAppeal, status: statusAppeal } = useCacheSend(
    'Recover',
    'appeal'
  )
  const {
    send: sendSubmitEvidence,
    status: statusSubmitEvidence
  } = useCacheSend('Recover', 'submitEvidence')

  const arbitratorExtraData = useCacheCall('Recover', 'arbitratorExtraData')

  const arbitrationCost = useCacheCall(
    'KlerosLiquid',
    'arbitrationCost',
    arbitratorExtraData || '0x00'
  )

  const loadDescription = useDataloader.getDescription()

  claimID = claimID.replace(/0+$/, '')

  const claim = useCacheCall('Recover', 'claims', claimID)

  const getEvidence = useDataloader.getEvidence()

  let item

  if (claim) {
    item = useCacheCall('Recover', 'items', claim.itemID)
    // TODO: test without web3 (drizzleState.account)
    claim.funds = useCacheEvents(
      'Recover',
      'Fund',
      useMemo(
        () => ({
          filter: { _claimID: claim.itemID },
          fromBlock: process.env.REACT_APP_DRAW_EVENT_LISTENER_BLOCK_NUMBER
        }),
        [drizzleState.account]
      )
    )

    if (claim.disputeID != '0') { // FIXME: operator !== ??
      if (claim.status > '2') {
        claim.disputeStatus = useCacheCall(
          'KlerosLiquid',
          'disputeStatus',
          claim.disputeID
        )

        claim.currentRuling = useCacheCall(
          'KlerosLiquid',
          'currentRuling',
          claim.disputeID
        )

        const dispute = useCacheCall(
          'KlerosLiquid',
          'disputes',
          claim.disputeID
        )

        if (dispute) claim.isRuled = dispute.ruled ? true : false

        claim.appealCost = useCacheCall(
          'KlerosLiquid',
          'appealCost',
          claim.disputeID,
          arbitratorExtraData || '0x00'
        )

        claim.evidence = getEvidence(
          drizzle.contracts.Recover.address,
          drizzle.contracts.KlerosLiquid.address,
          claim.disputeID
        )
      }
    }

    if (item) {
      item.content = {
        dataDecrypted: { type: 'loading...' }
      }

      item.itemID = claim.itemID

      const itemID = claim.itemID.replace(/0x0/gi, '0x').replace(/0+$/, '')

      if (recover[itemID] && recover[itemID].privateKey) {
        const metaEvidence = loadDescription(
          item.descriptionEncryptedLink,
          recover[itemID].privateKey
        )
        if (metaEvidence) item.content = metaEvidence
      } else
        item.content = {
          dataDecrypted: { type: 'Data Encrypted' }
        }
      if (recover[itemID] && recover[itemID].finder)
        item.finder = recover[itemID].finder
    }
  }

  // TODO: refactoring send evidence box with owner.js (create component EvidenceBox)

  return (
    <Container>
      <Formik
        initialValues={{
          name: '',
          description: '',
          evidenceFile: ''
        }}
        validate={values => {
          let errors = {}
          if (values.name === '') errors.name = 'Name Required'
          if (values.description.length > 100000)
            errors.description =
              'The maximum numbers of the characters for the description is 100,000 characters.'
          if (values.evidenceFile.size > 5000000)
            errors.evidenceFile =
              'The file is too big. The maximum size is 5MB.'
          return errors
        }}
        onSubmit={async ({ name, description, evidenceFile }) => {
          setIsEvidenceSent(false)

          let evidenceFileURI = ''

          if (evidenceFile) {
            const evidenceArrayBuffer = await ReadFile(evidenceFile.dataURL)

            const ipfsHashEvidenceObj = await ipfsPublish(
              evidenceFile.name,
              new Buffer(evidenceArrayBuffer)
            )

            evidenceFileURI = await `ipfs/${ipfsHashEvidenceObj[1].hash}${
              ipfsHashEvidenceObj[0].path
            }`
          }

          const evidence = await {
            evidenceFileURI,
            name,
            description
          }

          const enc = new TextEncoder()

          // Upload the evidence to IPFS
          const ipfsHashEvidenceObj = await ipfsPublish(
            'evidence.json',
            enc.encode(JSON.stringify(evidence)) // encode to bytes
          )

          const ipfsHashEvidence = `${ipfsHashEvidenceObj[1].hash}${
            ipfsHashEvidenceObj[0].path
          }`

          await sendSubmitEvidence(claimID, `/ipfs/${ipfsHashEvidence}`)
        }}
      >
        {({
          submitForm,
          touched,
          errors,
          setFieldValue,
          values,
          handleChange,
          resetForm
        }) => (
          <Modal
            open={isOpen}
            onClose={() => setOpen(false)}
            center
            styles={{
              closeButton: { background: 'transparent' },
              modal: { width: '80vw', maxWidth: '300px', padding: '6vh 8vw' }
            }}
          >
            <ModalTitle>Evidence</ModalTitle>
            <FieldContainer>
              <StyledLabel htmlFor="name">
                <span className="info" aria-label="The name of the evidence">
                  Name
                </span>
              </StyledLabel>
              <StyledField name="name" placeholder="Name" />
              <ErrorMessage name="name" component={Error} />
            </FieldContainer>
            <FieldContainer>
              <StyledLabel htmlFor="description">
                <span
                  className="info"
                  aria-label="
                    Description of the evidence.
                  "
                >
                  Description
                </span>
              </StyledLabel>
              <StyledField
                name="description"
                value={values.description}
                render={({ field, form }) => (
                  <StyledTextarea
                    {...field}
                    placeholder="Description of the evidence"
                    onChange={e => {
                      handleChange(e)
                      form.setFieldValue('description', e.target.value)
                    }}
                  />
                )}
              />
              <ErrorMessage name="description" component={Error} />
            </FieldContainer>
            {/* hack Formik for file type */}
            {/* and store only the path on the file in the redux state */}
            <FieldContainer>
              <StyledLabel htmlFor="evidenceFile">
                <span
                  className="info"
                  aria-label="A file to prove your statement."
                >
                  File (optional)
                </span>
              </StyledLabel>
              <div className="NewEvidenceArbitrableTx-form-file FileInput">
                <input
                  className="FileInput-input--noBorder"
                  id="evidenceFile"
                  name="evidenceFile"
                  type="file"
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={e => {
                    const file = e.currentTarget.files[0]
                    if (file)
                      return setFieldValue('evidenceFile', {
                        dataURL: e.currentTarget.files[0],
                        name: file.name
                      })
                  }}
                />
                <div className="FileInput-filename">
                  {values.evidenceFile ? values.evidenceFile.name : null}
                </div>
              </div>
              {errors.evidenceFile && (
                <div className="error">{errors.evidenceFile}</div>
              )}
            </FieldContainer>
            <Button
              onClick={submitForm}
              style={{ width: '100%' }}
              type="submit"
              disabled={
                Object.entries(touched).length === 0
                && touched.constructor === Object
                || Object.entries(errors).length > 0
                || (statusSubmitEvidence && statusSubmitEvidence === 'pending')
              }
            >
              Submit Evidence
            </Button>
            {statusSubmitEvidence && statusSubmitEvidence === 'pending' && (
              <MessageBoxTx
                pending={true}
                onClick={() => {
                  window.open(
                    `https://${
                      drizzleState.networkID === '42' ? 'kovan.' : ''
                    }etherscan.io/tx/${
                      Object.keys(drizzleState.transactions)[0]
                    }`,
                    '_blank'
                  )
                  resetForm()
                }}
              />
            )}
            {statusSubmitEvidence && statusSubmitEvidence === 'success' && (
              <Box>
                Evidence sent
                {!isEvidenceSent && resetEvidenceReset(resetForm)}
              </Box>
            )}
          </Modal>
        )}
      </Formik>
      {claim && item ? (
        <>
          {claim.amountLocked > 0 && claim.finder === drizzleState.account && (
            <DropdownStyled>
              {/* FIX: only if status === 0 */}
              <StyledSettings
                style={!dropdownHidden ? { background: '#efefef' } : {}}
                onClick={() => setDropdownHidden(!dropdownHidden)}
              />
              <DropdownMenuStyled hidden={dropdownHidden}>
                {claim.status === '0' && (
                  <DropdownItemStyled
                    onClick={() => {
                      sendReimburse(claimID, item.rewardAmount)
                      setDropdownHidden(!dropdownHidden)
                    }}
                  >
                    Reimburse
                  </DropdownItemStyled>
                )}
                {claim.status === '0' && (
                  <DropdownItemStyled
                    onClick={() => {
                      sendPayArbitrationFeeByFinder(claimID, {
                        value: arbitrationCost
                      })
                      setDropdownHidden(!dropdownHidden)
                    }}
                  >
                    Raise a Dispute
                  </DropdownItemStyled>
                )}
                {claim.status > '0' && claim.status < '4' && (
                  <DropdownItemStyled
                    onClick={() => {
                      // TODO: open a box to submit an evidence
                      setOpen(true)
                      setDropdownHidden(!dropdownHidden)
                    }}
                  >
                    Submit an Evidence
                  </DropdownItemStyled>
                )}
                {claim.status === '3' &&
                  claim.currentRuling === '1' &&
                  claim.disputeStatus === '1' &&
                  claim.isRuled && (
                    <DropdownItemStyled
                      onClick={() => {
                        sendAppeal(claim.ID, { value: claim.appealCost })
                        setDropdownHidden(!dropdownHidden)
                      }}
                    >
                      Appeal to the Ruling
                    </DropdownItemStyled>
                  )}
              </DropdownMenuStyled>
            </DropdownStyled>
          )}
          <Title>
            {item.content ? item.content.dataDecrypted.type : 'Item'}
          </Title>
          <Label>Description</Label>
          <div style={{ padding: '10px 0' }}>
            {item.content ? item.content.dataDecrypted.description : '...'}
          </div>
          <Label>Contact Information</Label>
          <div style={{ padding: '10px 0' }}>
            {item.content
              ? item.content.dataDecrypted.contactInformation
              : '...'}
          </div>
          <Label>Reward</Label>
          <div style={{ padding: '10px 0' }}>
            {ETHAmount({ amount: item.rewardAmount, decimals: 2 })} ETH
          </div>
          {claim.status > 0 && (
            <>
              <Label>Dispute Status</Label>
              <div style={{ padding: '10px 0' }}>
                {claim.status === '1' ? (
                  'Awaiting the fee from the finder.'
                ) : claim.status === '2' ? (
                  'Awaiting the fee from you.'
                ) : claim.status === '3' ? (
                  !claim.isRuled ? (
                    'Dispute Ongoing'
                  ) : claim.currentRuling === '2' ? (
                    <>
                      You win the dispute. <br />
                      The dispute can be appealable.
                    </>
                  ) : (
                    <>
                      You lose the dispute. <br />
                      The dispute can be appealable.
                    </>
                  )
                ) : claim.status === '4' && claim.currentRuling === '2' ? (
                  'You win the dispute.'
                ) : (
                  'You lose the dispute.'
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <Title>Loading Item...</Title>
      )}
    </Container>
  )
}

Finder.propTypes = {
  network: PropTypes.string,
  claimID: PropTypes.string
}

Finder.defaultProps = {
  network: 'mainnet',
  claimID: ''
}

export default Finder
