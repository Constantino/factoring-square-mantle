export const PORT: number = parseInt(process.env.PORT || '3001', 10);
export const DATABASE_CONNECTION_STRING: string = process.env.DATABASE_CONNECTION_STRING || '';

// Blockchain Configuration
export const RPC_URL: string = process.env.RPC_URL || '';
export const PRIVATE_KEY: string = process.env.PRIVATE_KEY || '';
export const VAULT_FACTORY_ADDRESS: string = process.env.VAULT_FACTORY_ADDRESS || '';

// Supabase S3 Configuration
export const SUPABASE_BUCKET_ENDPOINT: string = process.env.SUPABASE_BUCKET_ENDPOINT || '';
export const SUPABASE_BUCKET_ACCESS_KEY_ID: string = process.env.SUPABASE_BUCKET_ACCESS_KEY_ID || '';
export const SUPABASE_BUCKET_SECRET_ACCESS_KEY: string = process.env.SUPABASE_BUCKET_SECRET_ACCESS_KEY || '';

// Invoice NFT Configuration
export const INVOICE_NFT_INVOICE_IMAGE: string = process.env.INVOICE_NFT_INVOICE_IMAGE || '';

// Pinata Configuration
export const PINATA_API_KEY: string = process.env.PINATA_API_KEY || '';
export const PINATA_API_SECRET: string = process.env.PINATA_API_SECRET || '';
export const PINATA_JWT: string = process.env.PINATA_JWT || '';
