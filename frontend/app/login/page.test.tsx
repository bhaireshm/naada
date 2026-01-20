import { useAuth } from '@/hooks/useAuth'
import { theme1Dark } from "@/lib/theme"
import { MantineProvider } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from './page'

expect.extend(toHaveNoViolations)

// Mock the hooks
jest.mock('@/hooks/useAuth')
jest.mock('next/navigation')
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}))

const renderWithMantine = (ui: React.ReactNode) => {
  return render(
    <MantineProvider theme={theme1Dark} forceColorScheme="dark">{ui}</MantineProvider>
  )
}

describe('LoginPage', () => {
  const mockSignIn = jest.fn()
  const mockSignInWithGoogle = jest.fn()
  const mockPush = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()

      // Default mock implementations
      ; (useAuth as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        signInWithGoogle: mockSignInWithGoogle,
        loading: false,
        error: null,
      })

      ; (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      })

      ; (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      })
  })

  it('renders login form', () => {
    renderWithMantine(<LoginPage />)

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('handles email/password submission', async () => {
    renderWithMantine(<LoginPage />)

    // Use more specific form interaction
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const submitButton = screen.getByRole('button', { name: /^sign in$/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('handles google sign in', async () => {
    renderWithMantine(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    await user.click(googleButton)

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled()
    })

    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('displays error message for Google sign-in failure', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Google sign-in failed'))

    renderWithMantine(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    await user.click(googleButton)

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Google Sign In Failed',
        message: 'Google sign-in failed',
        color: 'red',
      }))
    })
  })

  it('displays error message on failure', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

    renderWithMantine(<LoginPage />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'wrong')

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Sign In Failed',
        message: 'Invalid credentials',
        color: 'red',
      }))
    })
  })

  it('should have no accessibility violations', async () => {
    const { container } = renderWithMantine(<LoginPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('redirects to custom redirect URL after successful login', async () => {
    mockSignIn.mockResolvedValue(undefined)

    // Override search params mock BEFORE render
    const mockGet = jest.fn().mockImplementation((key) => key === 'redirect' ? '/profile' : null)
      ; (useSearchParams as jest.Mock).mockReturnValue({
        get: mockGet,
      })

    renderWithMantine(<LoginPage />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/profile')
    }, { timeout: 3000 })
  })

  it('shows validation error for invalid email', async () => {
    const { container } = renderWithMantine(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('shows validation error for empty fields', async () => {
    const { container } = renderWithMantine(<LoginPage />)

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})
