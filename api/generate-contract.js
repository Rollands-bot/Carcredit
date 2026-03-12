const { supabase } = require('../lib/supabaseClient');
const { calculateInstallment, generateInstallmentSchedule } = require('../lib/calculator');

/**
 * Helper to send JSON response (native http module compatible)
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

/**
 * POST /api/generate-contract
 * Creates a new contract and generates installment schedule
 */
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    try {
        const { contract_no, client_name, otr, dp_percent, period, start_date = '2024-01-25' } = req.body;

        if (!contract_no || !client_name || !otr || dp_percent === undefined || !period) {
            return sendJson(res, 400, {
                error: 'Missing required fields',
                required: ['contract_no', 'client_name', 'otr', 'dp_percent', 'period']
            });
        }

        const calculation = calculateInstallment({
            otr: parseFloat(otr),
            dpPercent: parseFloat(dp_percent),
            periodMonths: parseInt(period)
        });

        const contractData = {
            contract_no,
            client_name,
            otr: calculation.otr,
            dp_amount: calculation.dpAmount,
            principal: calculation.principal,
            interest_rate: calculation.interestRate,
            period_months: calculation.periodMonths
        };

        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .insert(contractData)
            .select()
            .single();

        if (contractError) {
            console.error('Contract insertion error:', contractError);
            if (contractError.code === '23505') {
                return sendJson(res, 409, { error: 'Contract number already exists' });
            }
            return sendJson(res, 500, { error: 'Failed to create contract', details: contractError.message });
        }

        const installments = generateInstallmentSchedule({
            monthlyInstallment: calculation.monthlyInstallment,
            totalMonths: calculation.periodMonths,
            startDate: start_date
        });

        const installmentsData = installments.map(inst => ({
            contract_no,
            installment_no: inst.installment_no,
            amount: inst.amount,
            due_date: inst.due_date,
            status: inst.status
        }));

        const { data: insertedInstallments, error: installmentsError } = await supabase
            .from('installments')
            .insert(installmentsData)
            .select();

        if (installmentsError) {
            console.error('Installments insertion error:', installmentsError);
            await supabase.from('contracts').delete().eq('contract_no', contract_no);
            return sendJson(res, 500, { error: 'Failed to create installments', details: installmentsError.message });
        }

        return sendJson(res, 201, {
            success: true,
            contract: {
                id: contract.id,
                contract_no: contract.contract_no,
                client_name: contract.client_name,
                otr: contract.otr,
                dp_amount: contract.dp_amount,
                principal: contract.principal,
                interest_rate: contract.interest_rate,
                period_months: contract.period_months
            },
            calculation: {
                total_interest: calculation.totalInterest,
                total_amount: calculation.totalAmount,
                monthly_installment: calculation.monthlyInstallment
            },
            installments_count: insertedInstallments.length,
            installments: insertedInstallments
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return sendJson(res, 500, { error: 'Internal server error', details: error.message });
    }
};
