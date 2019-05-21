import React, { useState, useCallback } from 'react'
import styled from 'styled-components/macro'
import { Formik, Form, Field, ErrorMessage } from 'formik'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'


const Box = styled.div`
  display: flex;
  align-items: center;
  margin-top: 50px;
  color: #444;
  background-color: #a6ffcb;
  background-repeat: no-repeat;
  background-position: center;
  overflow: hidden;
  font-style: Roboto;
  padding: 0 40px;
  border-radius: 10px;
  font-size: 24px;
  height: 100px;
  overflow: hidden;
`

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

  const [isSaved, setIsSaved] = useState(false)

  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x00',
    balance: drizzleState.accountBalances[drizzleState.accounts[0]],
    transactions: drizzleState.transactions
  }))

  return (
    <Container>
      <Title>Settings</Title>
      <Formik
        initialValues={{
          email: recover[drizzleState.account].email || '',
          timeoutLocked: recover[drizzleState.account].timeoutLocked || 604800
        }}
        validate={values => {
          let errors = {}
          if (
            values.email !== '' && 
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)
          )
            errors.email = 'Invalid email address'
          if (isNaN(values.timeoutLocked))
            errors.timeoutLocked = 'Number Required'
          if (values.timeoutLocked <= 0)
            errors.timeoutLocked = 'Timeout locked must be positive.'

          return errors
        }}
        onSubmit={values => {
          window.localStorage.setItem('recover', JSON.stringify({
            ...JSON.parse(localStorage.getItem('recover') || '{}'),
            [drizzleState.account]: {
              email: values.email,
              timeoutLocked: values.timeoutLocked
            }
          }))

          setIsSaved(true)
        }}
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
                  Email
                </StyledLabel>
                <StyledField
                  name="email"
                  placeholder="Email"
                />
                <ErrorMessage
                  name="email"
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
              <Submit>
                <Button
                  type="submit"
                  disabled={Object.entries(errors).length > 0}
                >
                  Save Settings
                </Button>
              </Submit>
            </StyledForm>
          </>
        )}
      </Formik>
      {
        isSaved && (
          <Box>
            Settings saved
          </Box>
        )
      }
    </Container>
  )
}
