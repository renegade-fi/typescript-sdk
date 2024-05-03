import { config } from '@renegade-fi/test'
import { afterAll, beforeEach, expect, test, vi } from 'vitest'
import { getAuthorizationHeaders } from './getAuthHeaders.js'

beforeEach(() => {
  config.setState({
    seed: '0x629f936135e5dff7bba7a1793e7a49a963429de5cb770d0a54f20527b3367db60dcaf82de7d6fdc6daf80676b0440626f676d3849c982084cf5c31a3820b1c481b',
  })
  vi.useFakeTimers()
  vi.setSystemTime(1712975040125)
})

test('default', () => {
  const [authHeader, expirationSig] = getAuthorizationHeaders(config, {
    message: '',
  })
  expect(authHeader).toBeDefined()
  expect(expirationSig).toBeDefined()
})

test('with message', () => {
  const [authHeader, expiration] = getAuthorizationHeaders(config, {
    message: `{"public_var_sig":[],"from_addr":"0x637038D1Ff4d8F7bBd68422fCC93B9AF674Fa810","mint":"0x4af567288e68cad4aa93a272fe6139ca53859c70","amount":[2808348672,232830643,0,0,0,0,0,0],"wallet_commitment_sig":[40,95,157,132,204,249,51,245,105,106,249,130,4,178,214,147,42,51,73,152,120,52,207,7,142,184,17,121,36,78,106,250,72,223,135,190,89,69,160,204,190,200,22,105,26,138,215,191,80,227,77,228,73,230,93,211,5,241,71,77,235,163,170,33,0],"permit_nonce":[3554982101,1176130],"permit_deadline":[1712976837],"permit_signature":[18,242,168,139,241,1,145,92,1,236,219,73,91,49,171,12,209,166,189,75,38,7,12,203,32,104,166,254,97,87,191,62,34,122,174,146,190,166,38,221,37,135,218,244,93,190,39,142,194,82,161,217,195,232,16,53,116,91,151,41,192,250,204,21,28]}`,
  })
  expect(authHeader).toEqual(
    '58pDxzb5L/pHUDFEUpMeQ8U16NdMnSrRq7wLGkn5QitwC8YYf54MKcOwR2e+OD4hu5tuxCsS4xzOxFdtJsxnCQ',
  )
  expect(expiration).toEqual('1712975050125')
})

test('expirationSig format', () => {
  const [, expirationSig] = getAuthorizationHeaders(config, {
    message: '',
  })
  expect(expirationSig).toMatch(/^\d+$/)
})

test('authHeader format', () => {
  const [authHeader] = getAuthorizationHeaders(config, {
    message: '',
  })
  expect(authHeader).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
})

test('expirationSig is future timestamp', () => {
  const [, expirationSig] = getAuthorizationHeaders(config, {
    message: '',
  })
  const now = new Date().getTime().toString()
  expect(Number.parseInt(expirationSig)).toBeGreaterThan(Number.parseInt(now))
})

test('authHeader and expirationSig are consistent with same message', () => {
  const [authHeader1, expirationSig1] = getAuthorizationHeaders(config, {
    message: 'consistentMessage',
  })
  const [authHeader2, expirationSig2] = getAuthorizationHeaders(config, {
    message: 'consistentMessage',
  })
  expect(authHeader1).toEqual(authHeader2)
  expect(expirationSig1).toEqual(expirationSig2)
})

// Reset the mocks after the tests
afterAll(() => {
  vi.useRealTimers()
})
