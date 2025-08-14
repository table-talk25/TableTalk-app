// Test file per SocialLoginButtons
// Questo file serve per verificare che il componente funzioni correttamente

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import SocialLoginButtons from './index';

// Mock delle dipendenze
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'auth.orContinueWith': 'oppure continua con',
        'auth.continueWithGoogle': 'Continua con Google',
        'auth.continueWithApple': 'Continua con Apple'
      };
      return translations[key] || key;
    }
  })
}));

jest.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    signIn: jest.fn()
  }
}));

jest.mock('@capacitor-community/apple-sign-in', () => ({
  SignInWithApple: {
    authorize: jest.fn()
  }
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn(() => 'web')
  }
}));

jest.mock('../../../services/socialAuthService', () => ({
  loginWithGoogle: jest.fn(),
  loginWithApple: jest.fn()
}));

describe('SocialLoginButtons', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Google button', () => {
    render(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Continua con Google')).toBeInTheDocument();
  });

  it('renders Apple button on iOS', () => {
    const { rerender } = render(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Mock iOS platform
    jest.requireMock('@capacitor/core').Capacitor.getPlatform.mockReturnValue('ios');
    
    rerender(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Continua con Apple')).toBeInTheDocument();
  });

  it('shows loading state when Google login is in progress', async () => {
    render(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const googleButton = screen.getByText('Continua con Google');
    fireEvent.click(googleButton);

    // Verifica che il pulsante sia disabilitato durante il caricamento
    await waitFor(() => {
      expect(googleButton).toBeDisabled();
    });
  });

  it('calls onSuccess when Google login succeeds', async () => {
    const { loginWithGoogle } = require('../../../services/socialAuthService');
    loginWithGoogle.mockResolvedValue({
      success: true,
      user: { id: '123', email: 'test@example.com' },
      token: 'jwt-token'
    });

    render(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const googleButton = screen.getByText('Continua con Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        user: { id: '123', email: 'test@example.com' },
        token: 'jwt-token'
      });
    });
  });

  it('calls onError when Google login fails', async () => {
    const { loginWithGoogle } = require('../../../services/socialAuthService');
    loginWithGoogle.mockRejectedValue(new Error('Login failed'));

    render(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const googleButton = screen.getByText('Continua con Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Login failed');
    });
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <SocialLoginButtons
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        disabled={true}
      />
    );

    const googleButton = screen.getByText('Continua con Google');
    expect(googleButton).toBeDisabled();
  });
});
