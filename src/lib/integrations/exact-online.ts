import { supabase } from '../supabase';

const EXACT_API_BASE = 'https://start.exactonline.nl/api/v1';
const EXACT_AUTH_URL = 'https://start.exactonline.nl/api/oauth2/auth';
const EXACT_TOKEN_URL = 'https://start.exactonline.nl/api/oauth2/token';

export interface ExactConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface ExactTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ExactCustomer {
  ID: string;
  Name: string;
  CompanyName?: string;
  Email?: string;
  Phone?: string;
  AddressLine1?: string;
  City?: string;
  Postcode?: string;
}

export interface ExactProject {
  ID: string;
  Description: string;
  ProjectCode?: string;
  BudgetAmount?: number;
}

export const EXACT_FIELD_MAPPINGS = {
  customers: {
    contact_name: 'Name',
    company_name: 'CompanyName',
    email: 'Email',
    phone: 'Phone',
    address: 'AddressLine1',
    city: 'City',
    postal_code: 'Postcode',
  },
  projects: {
    title: 'Description',
    quote_number: 'ProjectCode',
    total_price: 'BudgetAmount',
  },
};

export function getAuthorizationUrl(config: ExactConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
  });

  return `${EXACT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  config: ExactConfig
): Promise<ExactTokens> {
  const params = new URLSearchParams({
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(EXACT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string,
  config: ExactConfig
): Promise<ExactTokens> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(EXACT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export function isTokenExpired(expiresAt: string): boolean {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const bufferMinutes = 5;
  return expiry.getTime() - now.getTime() < bufferMinutes * 60 * 1000;
}

export async function getExactDivision(accessToken: string): Promise<number> {
  const response = await fetch(`${EXACT_API_BASE}/current/Me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get division');
  }

  const data = await response.json();
  return data.d.results[0].CurrentDivision;
}

export async function getExactCustomers(
  accessToken: string,
  division: number
): Promise<ExactCustomer[]> {
  const response = await fetch(
    `${EXACT_API_BASE}/${division}/crm/Accounts?$select=ID,Name,CompanyName,Email,Phone,AddressLine1,City,Postcode`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch customers from Exact');
  }

  const data = await response.json();
  return data.d.results;
}

export async function createExactCustomer(
  accessToken: string,
  division: number,
  customer: Partial<ExactCustomer>
): Promise<ExactCustomer> {
  const response = await fetch(`${EXACT_API_BASE}/${division}/crm/Accounts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(customer),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create customer in Exact: ${error}`);
  }

  const data = await response.json();
  return data.d;
}

export async function updateExactCustomer(
  accessToken: string,
  division: number,
  customerId: string,
  updates: Partial<ExactCustomer>
): Promise<void> {
  const response = await fetch(
    `${EXACT_API_BASE}/${division}/crm/Accounts(guid'${customerId}')`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update customer in Exact');
  }
}

export async function getExactProjects(
  accessToken: string,
  division: number
): Promise<ExactProject[]> {
  const response = await fetch(
    `${EXACT_API_BASE}/${division}/project/Projects?$select=ID,Description,ProjectCode,BudgetAmount`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch projects from Exact');
  }

  const data = await response.json();
  return data.d.results;
}

export async function createExactProject(
  accessToken: string,
  division: number,
  project: Partial<ExactProject>
): Promise<ExactProject> {
  const response = await fetch(`${EXACT_API_BASE}/${division}/project/Projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create project in Exact: ${error}`);
  }

  const data = await response.json();
  return data.d;
}
