import { getSecuritySettings } from './systemSettings';
import logger from './logger';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password against security settings
 */
export async function validatePassword(password: string): Promise<PasswordValidationResult> {
  const errors: string[] = [];
  
  // Check if password is provided
  if (!password || typeof password !== 'string') {
    errors.push('Mật khẩu là bắt buộc');
    return {
      isValid: false,
      errors,
    };
  }
  
  try {
    const securitySettings = await getSecuritySettings();
    
    // Check minimum length
    if (password.length < securitySettings.passwordMinLength) {
      errors.push(`Mật khẩu phải có ít nhất ${securitySettings.passwordMinLength} ký tự`);
    }
    
    // Check uppercase requirement
    if (securitySettings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết hoa');
    }
    
    // Check lowercase requirement
    if (securitySettings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết thường');
    }
    
    // Check numbers requirement
    if (securitySettings.passwordRequireNumbers && !/[0-9]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ số');
    }
    
    // Check special characters requirement
    if (securitySettings.passwordRequireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    logger.error('Error validating password:', error);
    // If we can't get security settings, use basic validation
    if (password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Get password requirements message for frontend
 */
export async function getPasswordRequirements(): Promise<string[]> {
  const requirements: string[] = [];
  
  try {
    const securitySettings = await getSecuritySettings();
    
    requirements.push(`Độ dài tối thiểu: ${securitySettings.passwordMinLength} ký tự`);
    
    if (securitySettings.passwordRequireUppercase) {
      requirements.push('Chứa ít nhất một chữ cái viết hoa (A-Z)');
    }
    
    if (securitySettings.passwordRequireLowercase) {
      requirements.push('Chứa ít nhất một chữ cái viết thường (a-z)');
    }
    
    if (securitySettings.passwordRequireNumbers) {
      requirements.push('Chứa ít nhất một chữ số (0-9)');
    }
    
    if (securitySettings.passwordRequireSpecialChars) {
      requirements.push('Chứa ít nhất một ký tự đặc biệt (!@#$%^&*...)');
    }
  } catch (error) {
    logger.error('Error getting password requirements:', error);
    requirements.push('Độ dài tối thiểu: 6 ký tự');
  }
  
  return requirements;
}

