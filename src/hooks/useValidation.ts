import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';
import { useToast } from './use-toast';

interface ValidationResult<T> {
  data?: T;
  errors: string[];
  isValid: boolean;
}

export function useValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validate = useCallback((data: unknown): ValidationResult<T> => {
    try {
      const result = schema.parse(data);
      setErrors([]);
      return {
        data: result,
        errors: [],
        isValid: true
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message);
        setErrors(errorMessages);
        return {
          errors: errorMessages,
          isValid: false
        };
      }
      const genericError = ['เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'];
      setErrors(genericError);
      return {
        errors: genericError,
        isValid: false
      };
    }
  }, [schema]);

  const validateAndToast = useCallback((data: unknown): ValidationResult<T> => {
    const result = validate(data);
    
    if (!result.isValid) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: result.errors.join(', '),
        variant: "destructive",
      });
    }
    
    return result;
  }, [validate, toast]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    validate,
    validateAndToast,
    clearErrors,
    errors,
    hasErrors: errors.length > 0
  };
}

// Hook for form validation with real-time feedback
export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateField = useCallback((fieldName: string, value: unknown) => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.pick({ [fieldName]: true } as any);
      fieldSchema.parse({ [fieldName]: value });
      
      // Clear field error if validation passes
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง';
        setFieldErrors(prev => ({
          ...prev,
          [fieldName]: errorMessage
        }));
        return false;
      }
      return false;
    }
  }, [schema]);

  const validateForm = useCallback(async (data: unknown): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    
    try {
      const result = schema.parse(data);
      setFieldErrors({});
      setIsValidating(false);
      return {
        data: result,
        errors: [],
        isValid: true
      };
    } catch (error) {
      setIsValidating(false);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const generalErrors: string[] = [];
        
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (path) {
            fieldErrors[path] = err.message;
          } else {
            generalErrors.push(err.message);
          }
        });
        
        setFieldErrors(fieldErrors);
        
        if (generalErrors.length > 0) {
          toast({
            title: "ข้อมูลไม่ถูกต้อง",
            description: generalErrors.join(', '),
            variant: "destructive",
          });
        }
        
        return {
          errors: Object.values(fieldErrors).concat(generalErrors),
          isValid: false
        };
      }
      
      const genericError = ['เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'];
      toast({
        title: "เกิดข้อผิดพลาด",
        description: genericError[0],
        variant: "destructive",
      });
      
      return {
        errors: genericError,
        isValid: false
      };
    }
  }, [schema, toast]);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return fieldErrors[fieldName] || '';
  }, [fieldErrors]);

  return {
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    fieldErrors,
    isValidating,
    hasErrors: Object.keys(fieldErrors).length > 0
  };
}

// Hook for async validation (useful for checking uniqueness)
export function useAsyncValidation<T>(schema: ZodSchema<T>) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateAsync = useCallback(async (
    data: unknown,
    asyncChecks?: Array<(data: T) => Promise<boolean | string>>
  ): Promise<ValidationResult<T>> => {
    setIsValidating(true);
    setValidationErrors([]);

    try {
      // First, validate with schema
      const result = schema.parse(data);
      
      // Then run async checks if provided
      if (asyncChecks && asyncChecks.length > 0) {
        const asyncResults = await Promise.all(
          asyncChecks.map(check => check(result))
        );
        
        const asyncErrors: string[] = [];
        asyncResults.forEach((result, index) => {
          if (typeof result === 'string') {
            asyncErrors.push(result);
          } else if (!result) {
            asyncErrors.push(`การตรวจสอบที่ ${index + 1} ล้มเหลว`);
          }
        });
        
        if (asyncErrors.length > 0) {
          setValidationErrors(asyncErrors);
          setIsValidating(false);
          return {
            errors: asyncErrors,
            isValid: false
          };
        }
      }
      
      setIsValidating(false);
      return {
        data: result,
        errors: [],
        isValid: true
      };
    } catch (error) {
      setIsValidating(false);
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message);
        setValidationErrors(errorMessages);
        return {
          errors: errorMessages,
          isValid: false
        };
      }
      
      const genericError = ['เกิดข้อผิดพลาดในการตรวจสอบข้อมูล'];
      setValidationErrors(genericError);
      return {
        errors: genericError,
        isValid: false
      };
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return {
    validateAsync,
    clearErrors,
    validationErrors,
    isValidating,
    hasErrors: validationErrors.length > 0
  };
}
