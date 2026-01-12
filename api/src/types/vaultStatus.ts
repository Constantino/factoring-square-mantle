export enum VaultStatus {
    PENDING = 'PENDING',
    FUNDING = 'FUNDING',
    FUNDED = 'FUNDED',
    RELEASED = 'RELEASED',
    REPAID = 'REPAID',
    MATURED = 'MATURED',
    DEFAULTED = 'DEFAULTED'
}

export type VaultStatusType = VaultStatus;
