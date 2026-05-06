// Version Download API Service
export interface CompanyDetailsResponse {
  success: boolean;
  employee_name?: string;
  message?: string;
}

export interface CompanyDetailsRequest {
  emp_code: string;
}

// Real API endpoint for employee verification
const VERSION_API_BASE_URL = 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com';
const VALIDATE_COMPANY_CODE_PATH = '/version/validate-company-code';

// GitHub release link for software download
const GITHUB_RELEASE_LINK = 'https://github.com/deckmount/cardiox-desktop/releases/latest';

export async function validateCompanyCode(empCode: string): Promise<CompanyDetailsResponse> {
  try {
    const response = await fetch(`${VERSION_API_BASE_URL}${VALIDATE_COMPANY_CODE_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emp_code: empCode.toUpperCase(), // Convert to uppercase before sending
      } as CompanyDetailsRequest),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      // Map HTTP status codes to user-friendly messages
      if (response.status === 404) {
        return {
          success: false,
          message: 'User does not exist'
        };
      } else if (response.status >= 500) {
        return {
          success: false,
          message: 'Something went wrong. Please try again'
        };
      } else {
        return {
          success: false,
          message: 'Unable to verify access code right now'
        };
      }
    }

    const data: CompanyDetailsResponse = await response.json();
    
    // Handle API response format
    if (data.success && data.employee_name) {
      return data;
    } else {
      // Return failed response with clean message
      return {
        success: false,
        message: 'User does not exist'
      };
    }
  } catch (error) {
    // Handle different types of errors with user-friendly messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Unable to verify access code right now'
        };
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return {
          success: false,
          message: 'Unable to verify access code right now'
        };
      }
    }
    
    // Default fallback for any unexpected errors
    return {
      success: false,
      message: 'Something went wrong. Please try again'
    };
  }
}

export function getDownloadLink(): string {
  return GITHUB_RELEASE_LINK;
}
