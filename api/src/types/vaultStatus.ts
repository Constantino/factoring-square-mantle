export enum VaultStatus {
    PENDING = 'PENDING',
    FUNDING = 'FUNDING',
    FUNDED = 'FUNDED',
    RELEASED = 'RELEASED',
    MATURED = 'MATURED',
    DEFAULTED = 'DEFAULTED'
}

export type VaultStatusType = VaultStatus;
