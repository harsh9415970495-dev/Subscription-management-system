export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  checklist: {
    minLength: boolean; // 9+ chars
    uppercase: boolean; // >= 1 A-Z
    lowercase: boolean; // >= 1 a-z
    number: boolean;    // >= 1 0-9
    specialChar: boolean; // >= 1 symbol
  };
}

export class PasswordValidator {
  public static readonly MIN_LENGTH = 9;
  public static readonly SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  public static validate(password: string): PasswordValidationResult {
    const minLength = (password ?? '').length >= this.MIN_LENGTH;
    const uppercase = /[A-Z]/.test(password ?? '');
    const lowercase = /[a-z]/.test(password ?? '');
    const number = /[0-9]/.test(password ?? '');
    const specialChar = this.SPECIAL_CHAR_REGEX.test(password ?? '');

    const errors: string[] = [];
    if (!minLength) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }
    if (!uppercase) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }
    if (!lowercase) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }
    if (!number) {
      errors.push('Password must contain at least one numeric digit (0-9)');
    }
    if (!specialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      checklist: {
        minLength,
        uppercase,
        lowercase,
        number,
        specialChar,
      },
    };
  }
}
