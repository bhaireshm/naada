import { useAuth } from '@/hooks/useAuth'
import { theme1Dark } from "@/lib/theme"
import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useRouter, useSearchParams } from 'next/navigation'
import RegisterPage from './page'

expect.extend(toHaveNoViolations)

// Mock the hooks
jest.mock('@/hooks/useAuth')
jest.mock('next/navigation')

const renderWithMantine = (ui: React.ReactNode) => {
  return render(
    <MantineProvider theme={theme1Dark} forceColorScheme="dark">{ui}</MantineProvider>
  )
}

describe('RegisterPage', () => {
  const mockSignUp = jest.fn()
  const mockSignInWithGoogle = jest.fn()
  const mockPush = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()

      // Default mock implementations
      ; (useAuth as jest.Mock).mockReturnValue({
        signUp: mockSignUp,
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

  it('renders register form', () => {
    renderWithMantine(<RegisterPage />)

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
  })

  it('handles email/password registration', async () => {
    renderWithMantine(<RegisterPage />)

    // Use more specific form interaction
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /^sign up$/i })

    await user.type(emailInput, 'newuser@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'password123')
    })

    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('displays error message on failure', async () => {
    mockSignUp.mockRejectedValue(new Error('Email already in use'))

    renderWithMantine(<RegisterPage />)

    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /^sign up$/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
  })

  it('should have no accessibility violations', async () => {
    const { container } = renderWithMantine(<RegisterPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('shows validation error for mismatched passwords', async () => {
    const { container } = renderWithMantine(<RegisterPage />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'mismatch')

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    const { container } = renderWithMantine(<RegisterPage />)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), '123')
    await user.type(screen.getByLabelText(/confirm password/i), '123')

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
