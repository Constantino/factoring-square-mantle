import { pool } from "../config/database";
import { LoanStatus } from "../types/loanStatus";
import { LoanStats } from "../types/loanStats";

export class LoanService {
    public async changeLoanStatus(loanId: number, status: LoanStatus): Promise<void> {
        const query = `
            UPDATE "LoanRequests"
            SET status = $1,
                modified_at = NOW()
            WHERE id = $2
        `;

        const result = await pool.query(query, [status, loanId]);

        if (result.rowCount === 0) {
            throw new Error(`Loan request with id ${loanId} not found`);
        }
    }

    public async getLoanStatsByBorrower(borrowerAddress: string): Promise<LoanStats> {
        const query = `
            SELECT 
                COUNT(CASE WHEN status = $1 THEN 1 END) as active,
                COUNT(CASE WHEN status = $2 THEN 1 END) as paid,
                COUNT(CASE WHEN status = $3 THEN 1 END) as defaulted,
                COUNT(CASE WHEN status = $4 THEN 1 END) as listed
            FROM "LoanRequests"
            WHERE borrower_address = $5
        `;

        const result = await pool.query(query, [
            LoanStatus.ACTIVE,
            LoanStatus.PAID,
            LoanStatus.DEFAULTED,
            LoanStatus.LISTED,
            borrowerAddress
        ]);

        const row = result.rows[0];
        return {
            active: parseInt(row.active, 10),
            paid: parseInt(row.paid, 10),
            defaulted: parseInt(row.defaulted, 10),
            listed: parseInt(row.listed, 10)
        };
    }
}

export const loanService = new LoanService();

