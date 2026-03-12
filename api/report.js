const { supabase } = require('../lib/supabaseClient');
const { calculatePenalty, daysBetween } = require('../lib/calculator');

/**
 * Helper to send JSON response (native http module compatible)
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

/**
 * GET /api/report
 */
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method not allowed' });
    }

    try {
        const { query, client_name = 'SUGUS', as_of_date = '2024-08-14', contract_no } = req.query;

        if (!query) {
            return sendJson(res, 400, {
                error: 'Missing required query parameter',
                required: ['query'],
                available: ['A', 'B']
            });
        }

        if (query === 'A') {
            return await handleQueryA(res, client_name, as_of_date);
        } else if (query === 'B') {
            return await handleQueryB(res, as_of_date, contract_no);
        } else {
            return sendJson(res, 400, {
                error: 'Invalid query type',
                available: ['A', 'B']
            });
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        return sendJson(res, 500, { error: 'Internal server error', details: error.message });
    }
};

async function handleQueryA(res, clientName, asOfDate) {
    try {
        const { data: contracts, error: contractsError } = await supabase
            .from('contracts')
            .select('contract_no, client_name')
            .ilike('client_name', `%${clientName}%`);

        if (contractsError) {
            return sendJson(res, 500, { error: 'Failed to fetch contracts', details: contractsError.message });
        }

        if (!contracts || contracts.length === 0) {
            return sendJson(res, 404, {
                query: 'A',
                description: 'Total installments due',
                client_name: clientName,
                as_of_date: asOfDate,
                message: 'No contracts found for this client',
                total_due: 0,
                installments: []
            });
        }

        const contractNos = contracts.map(c => c.contract_no);

        const { data: installments, error: installmentsError } = await supabase
            .from('installments')
            .select('contract_no, installment_no, amount, due_date, status')
            .in('contract_no', contractNos)
            .lte('due_date', asOfDate)
            .eq('status', 'pending')
            .order('due_date', { ascending: true });

        if (installmentsError) {
            return sendJson(res, 500, { error: 'Failed to fetch installments', details: installmentsError.message });
        }

        const totalDue = installments.reduce((sum, inst) => sum + parseFloat(inst.amount), 0);

        return sendJson(res, 200, {
            query: 'A',
            description: 'Total installments due',
            client_name: clientName,
            as_of_date: asOfDate,
            total_due: totalDue,
            installments_count: installments.length,
            installments: installments || []
        });

    } catch (error) {
        console.error('Query A error:', error);
        return sendJson(res, 500, { error: 'Internal server error', details: error.message });
    }
}

async function handleQueryB(res, asOfDate, contractNoFilter) {
    try {
        const PENALTY_RATE = 0.001;
        const JUNE_2024_START = '2024-06-01';

        let contractsQuery = supabase.from('contracts').select('contract_no, client_name');
        if (contractNoFilter) {
            contractsQuery = contractsQuery.eq('contract_no', contractNoFilter);
        }

        const { data: contracts, error: contractsError } = await contractsQuery;

        if (contractsError) {
            return sendJson(res, 500, { error: 'Failed to fetch contracts', details: contractsError.message });
        }

        if (!contracts || contracts.length === 0) {
            return sendJson(res, 404, {
                query: 'B',
                description: 'Penalty calculation for unpaid installments',
                as_of_date: asOfDate,
                message: 'No contracts found',
                penalties: []
            });
        }

        const contractNos = contracts.map(c => c.contract_no);

        const { data: installments, error: installmentsError } = await supabase
            .from('installments')
            .select('contract_no, installment_no, amount, due_date, status')
            .in('contract_no', contractNos)
            .gte('due_date', JUNE_2024_START)
            .lte('due_date', asOfDate)
            .eq('status', 'pending')
            .order('contract_no', { ascending: true });

        if (installmentsError) {
            return sendJson(res, 500, { error: 'Failed to fetch installments', details: installmentsError.message });
        }

        const penalties = [];
        let totalPenalty = 0;

        for (const installment of (installments || [])) {
            const daysLate = daysBetween(installment.due_date, asOfDate);
            
            if (daysLate > 0) {
                const penalty = calculatePenalty({
                    amount: parseFloat(installment.amount),
                    daysLate,
                    penaltyRate: PENALTY_RATE
                });

                const contract = contracts.find(c => c.contract_no === installment.contract_no);

                penalties.push({
                    contract_no: installment.contract_no,
                    client_name: contract ? contract.client_name : 'Unknown',
                    installment_no: installment.installment_no,
                    amount: parseFloat(installment.amount),
                    due_date: installment.due_date,
                    days_late: daysLate,
                    penalty_rate: PENALTY_RATE * 100,
                    total_penalty: penalty
                });

                totalPenalty += penalty;
            }
        }

        return sendJson(res, 200, {
            query: 'B',
            description: 'Penalty calculation for unpaid installments (0.1% per day)',
            period: {
                from: JUNE_2024_START,
                to: asOfDate
            },
            as_of_date: asOfDate,
            total_penalties: totalPenalty,
            penalties_count: penalties.length,
            penalties: penalties
        });

    } catch (error) {
        console.error('Query B error:', error);
        return sendJson(res, 500, { error: 'Internal server error', details: error.message });
    }
}
