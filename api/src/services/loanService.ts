import { pool } from "../config/database";
import { LoanStatus } from "../types/loanStatus";

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
}

export const loanService = new LoanService();

