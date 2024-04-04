import {randomUUID} from 'node:crypto'
import PlaidService from '../../src/plaid/PlaidService'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import Bank from '../../src/banks/Bank'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        }
    })
}))

jest.mock('../../src/plaid/PlaidConfiguration', () => ({
    plaidClient: {
        transactionsGet: jest.fn(),
        linkTokenCreate: jest.fn(),
        itemPublicTokenExchange: jest.fn(),
        institutionsGetById: jest.fn(),
        accountsGet: jest.fn()
    }
}))

jest.mock('../../src/banks/BankService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createBank: jest.fn(),
            getBanksByOwner: jest.fn(),
            getBank: jest.fn()
        }
    })
})

describe('Plaid service', () => {
    beforeEach(() => {
        jest.clearAllMocks() // Resets call counts but keeps the mock implementation
    })

    const plaidService = new PlaidService()
    describe('in regards to normal operation', () => {
        test('should call to plaid and return link token', async () => {
            // given
            let mockedLinkToken = randomUUID();
            (plaidClient.linkTokenCreate as jest.Mock).mockResolvedValue({data: {link_token: mockedLinkToken}})
            let userId = 'user'

            // when
            const result = await plaidService.createLinkToken(userId)

            // then
            expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                'client_name': 'personal-finance-web-app',
                'country_codes': ['US'],
                'language': 'en',
                'user': {
                    'client_user_id': userId
                },
                'products': ['transactions']
            })
            expect(result).toEqual({link_token: mockedLinkToken})
        })

        test('should call to plaid to exchange public token for access token and to bank', async () => {
            // given
            let mockedAccessToken = randomUUID()
            let mockedBankId = randomUUID();
            (plaidClient.itemPublicTokenExchange as jest.Mock).mockImplementation((param: any) => {
                if (param.public_token === 'public_token') {
                    return {data: {access_token: mockedAccessToken}}
                }
            });
            (plaidService.bankService.createBank as jest.Mock).mockImplementation((accessToken: any, owner: any) => {
                if (accessToken === mockedAccessToken && owner === 'user') {
                    const bank = new Bank(accessToken, owner)
                    bank.id = mockedBankId
                    return bank
                }
            })

            // when
            const result = await plaidService.exchangeTokenAndSaveBank('public_token', 'user')

            // then
            expect(result).toEqual({bankId: mockedBankId})
        })

        test('should call to plaid to get bank names, account names, and associated transactions', async () => {
            // given
            let userId = 'user'
            let firstMockedBank = new Bank('access_token1', userId)
            let secondMockedBank = new Bank('access_token2', userId);
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockImplementation((owner) => {
                if (owner === userId) {
                    return [firstMockedBank, secondMockedBank]
                }
            });
            (plaidClient.institutionsGetById as jest.Mock).mockImplementation((params: any) => {
                if (params.institution_id === 'bankId1' && params.country_codes[0] === 'US') {
                    return {data: {institution: {name: 'bankName1'}}}
                }
                if (params.institution_id === 'bankId2' && params.country_codes[0] === 'US') {
                    return {data: {institution: {name: 'bankName2'}}}
                }
            });
            (plaidClient.transactionsGet as jest.Mock).mockImplementation((params: any) => {
                if (params.access_token === firstMockedBank.accessToken && params.start_date === '2022-01-01' && params.end_date === '2023-01-01') {
                    return {
                        data: {
                            item: {institution_id: 'bankId1'},
                            transactions: [
                                {amount: 2, date: '2-2-2', account_id: 'accountId1'},
                                {amount: 1, date: '1-1-1', account_id: 'accountId2'},
                                {amount: 4, date: '3-3-3', account_id: 'accountId1'},
                                {amount: 3, date: '2-2-2', account_id: 'accountId2'}
                            ],
                            total_transactions: 4,
                            accounts: [
                                {
                                    account_id: 'accountId1',
                                    name: 'bank1AccountName1',
                                    type: 'depository', balances: {current: 100}
                                }, {
                                    account_id: 'accountId2',
                                    name: 'bank1AccountName2',
                                    type: 'credit', balances: {current: 200}
                                }
                            ],
                        }
                    }
                }
                if (params.access_token === secondMockedBank.accessToken && params.start_date === '2022-01-01' && params.end_date === '2023-01-01') {
                    return {
                        data: {
                            item: {institution_id: 'bankId2'},
                            transactions: [
                                {amount: 6, date: '4-4-4', account_id: 'accountId3'},
                                {amount: 5, date: '3-3-3', account_id: 'accountId4'},
                                {amount: 8, date: '5-5-5', account_id: 'accountId3'},
                                {amount: 7, date: '4-4-4', account_id: 'accountId4'},
                            ],
                            total_transactions: 4,
                            accounts: [
                                {
                                    account_id: 'accountId3',
                                    name: 'bank2AccountName1',
                                    type: 'loan', balances: {current: 300}
                                }, {
                                    account_id: 'accountId4',
                                    name: 'bank2AccountName2',
                                    type: 'investment', balances: {current: 400}
                                }
                            ],
                        }
                    }
                }
            })

            // when
            const response = await plaidService.getOverview(userId)

            // then
            expect(response).toEqual({
                banks: [
                    {
                        name: 'bankName1',
                        accounts: [
                            {
                                name: 'bank1AccountName1',
                                type: 'depository',
                                balances: {current: 100},
                                transactions: [{amount: 2, date: '2-2-2'}, {amount: 4, date: '3-3-3'}]
                            },
                            {
                                name: 'bank1AccountName2',
                                type: 'credit',
                                balances: {current: 200},
                                transactions: [{amount: 1, date: '1-1-1'}, {amount: 3, date: '2-2-2'}]
                            }
                        ]
                    },
                    {
                        name: 'bankName2',
                        accounts: [
                            {
                                name: 'bank2AccountName1',
                                type: 'loan',
                                balances: {current: 300},
                                transactions: [{amount: 6, date: '4-4-4'}, {amount: 8, date: '5-5-5'}]
                            },
                            {
                                name: 'bank2AccountName2',
                                type: 'investment',
                                balances: {current: 400},
                                transactions: [{amount: 5, date: '3-3-3'}, {amount: 7, date: '4-4-4'}]
                            }
                        ]
                    },
                ],
                netWorths: [
                    {date: '1-1-1', value: 0},
                    {date: '2-2-2', value: 1},
                    {date: '3-3-3', value: 2},
                    {date: '4-4-4', value: -7},
                    {date: '5-5-5', value: -8},
                    {date: '2024-4-4', value: 0}
                ]
            })
        })

        test('should call transactions get more than once when bad request message is PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValueOnce({response: {data: {error_code: 'PRODUCT_NOT_READY'}}});
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: [{amount: 1}]}})

            // when
            await plaidService.getTransactionsResponseWithRetry(firstMockedBank)

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2)
        })

        test('should call transactions get more than once when transactions length is 0', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: []}});
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({data: {transactions: [{amount: 1}]}})

            // when
            await plaidService.getTransactionsResponseWithRetry(firstMockedBank)

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2)
        })

        test('should throw error when bad request message is not PRODUCT_NOT_READY', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidClient.transactionsGet as jest.Mock).mockRejectedValue({response: 'SOME_OTHER_ERROR'})

            try {
                // when
                await plaidService.getTransactionsResponseWithRetry(firstMockedBank)
            } catch (error: any) {
                // then
                expect(error.response).toEqual('SOME_OTHER_ERROR')
            }
        })

        test('should paginate transactions when transactions length is less than total transactions', async () => {
            // given
            let firstMockedBank = new Bank('access_token1');
            (plaidService.bankService.getBanksByOwner as jest.Mock).mockResolvedValue([firstMockedBank]);
            (plaidClient.transactionsGet as jest.Mock).mockImplementation((params) => {
                if (params.options.offset === 1) {
                    return {
                        data: {
                            transactions: [{amount: 2}],
                            total_transactions: 2
                        },
                    }
                }
            });
            (plaidClient.transactionsGet as jest.Mock).mockResolvedValueOnce({
                data: {
                    transactions: [{amount: 1}],
                    total_transactions: 2,
                    item: {institution_id: 'bankId1'},
                    accounts: [{name: 'bank1AccountName1', balances: {current: 1}}]
                },
            });
            (plaidClient.institutionsGetById as jest.Mock).mockResolvedValue({data: {institution: {name: 'bankName1'}}})

            // when
            const result = await plaidService.getOverview('userId')

            // then
            expect(plaidClient.transactionsGet).toHaveBeenCalledTimes(2)
            expect(result.banks[0].accounts[0].transactions).toEqual([{amount: 1}, {amount: 2}])
        })
    })
})