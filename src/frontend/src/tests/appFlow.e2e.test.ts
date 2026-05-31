import { beforeEach, describe, expect, it } from 'vitest'
import { router } from '../app/router'

describe('app flow e2e', () => {
  beforeEach(async () => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    await router.push('/auth')
  })

  it('redirects authenticated users with required password change to settings', async () => {
    window.sessionStorage.setItem('familyhub:auth:accessToken', 'token')
    window.sessionStorage.setItem('familyhub:auth:accessTokenExpiry', '2099-05-28T12:00:00Z')
    window.localStorage.setItem('familyhub:auth:user', JSON.stringify({
      id: 'user-1',
      firstName: 'Max',
      lastName: 'Muster',
      email: 'max@example.com',
      requiresPasswordChange: true,
    }))

    await router.push('/dashboard')

    expect(router.currentRoute.value.name).toBe('settings')
  })

  it('redirects legacy family route to settings', async () => {
    window.sessionStorage.setItem('familyhub:auth:accessToken', 'token')
    window.sessionStorage.setItem('familyhub:auth:accessTokenExpiry', '2099-05-28T12:00:00Z')
    window.localStorage.setItem('familyhub:auth:user', JSON.stringify({
      id: 'user-1',
      firstName: 'Max',
      lastName: 'Muster',
      email: 'max@example.com',
      requiresPasswordChange: false,
    }))

    await router.push('/family')
    expect(router.currentRoute.value.path).toBe('/settings')
  })
})
