/**
 * Calculate interest rate based on loan period
 * @param {number} periodMonths - Loan period in months
 * @returns {number} Interest rate as decimal (e.g., 0.14 for 14%)
 */
function getInterestRate(periodMonths) {
    if (periodMonths <= 12) {
        return 0.12; // 12%
    } else if (periodMonths >= 13 && periodMonths <= 24) {
        return 0.14; // 14%
    } else {
        return 0.165; // 16.5%
    }
}

/**
 * Calculate monthly installment based on business rules
 * Formula: Monthly Installment = (Principal + (Principal * Interest Rate)) / Period
 * 
 * @param {Object} params
 * @param {number} params.otr - On The Road price
 * @param {number} params.dpPercent - Down payment percentage (e.g., 20 for 20%)
 * @param {number} params.periodMonths - Loan period in months
 * @returns {Object} Calculation result with all details
 */
function calculateInstallment({ otr, dpPercent, periodMonths }) {
    const dpAmount = otr * (dpPercent / 100);
    const principal = otr - dpAmount;
    const interestRate = getInterestRate(periodMonths);
    const totalInterest = principal * interestRate;
    const totalAmount = principal + totalInterest;
    const monthlyInstallment = totalAmount / periodMonths;

    return {
        otr,
        dpPercent,
        dpAmount,
        principal,
        interestRate: interestRate * 100, // Convert to percentage for display
        periodMonths,
        totalInterest,
        totalAmount,
        monthlyInstallment
    };
}

/**
 * Generate installment schedule with due dates
 * @param {Object} params
 * @param {number} params.monthlyInstallment - Monthly payment amount
 * @param {number} params.totalMonths - Total number of installments
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @returns {Array} Array of installment objects
 */
function generateInstallmentSchedule({ monthlyInstallment, totalMonths, startDate }) {
    const installments = [];
    const start = new Date(startDate);

    for (let i = 1; i <= totalMonths; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + (i - 1));

        installments.push({
            installment_no: i,
            amount: monthlyInstallment,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pending'
        });
    }

    return installments;
}

/**
 * Calculate penalty for overdue installment
 * @param {Object} params
 * @param {number} params.amount - Installment amount
 * @param {number} params.daysLate - Number of days late
 * @param {number} params.penaltyRate - Daily penalty rate (default 0.001 = 0.1%)
 * @returns {number} Penalty amount
 */
function calculatePenalty({ amount, daysLate, penaltyRate = 0.001 }) {
    if (daysLate <= 0) return 0;
    return amount * penaltyRate * daysLate;
}

/**
 * Calculate days between two dates
 * @param {string} fromDate - Start date (YYYY-MM-DD)
 * @param {string} toDate - End date (YYYY-MM-DD)
 * @returns {number} Number of days
 */
function daysBetween(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
    getInterestRate,
    calculateInstallment,
    generateInstallmentSchedule,
    calculatePenalty,
    daysBetween
};
